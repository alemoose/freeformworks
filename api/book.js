const { getBusyBlocks, createDiscoveryCall, sendBookingAlert, formatBusinessType } = require('../lib/google-calendar');
const {
  parseDateOnly,
  buildCandidateStarts,
  filterSlots,
  dayBoundsUtc,
  isDateBookable,
  slotEndDateTime,
} = require('../lib/slots');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const BUSINESS_TYPES = new Set([
  'restaurants',
  'barbershops-salons',
  'photographers',
  'florists',
  'lawn-care',
  'retail',
  'other',
]);

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { start, name, email, phone, businessName, businessType, businessTypeOther } =
      req.body || {};
    const oneLine = (v, max) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, max) : '');
    const cleanPhone = typeof phone === 'string' ? phone.replace(/[^\d+()\-.\s]/g, '').trim().slice(0, 30) : '';
    if (!start || !name?.trim() || !email?.trim() || !businessName?.trim()) {
      res.status(400).json({ error: 'Missing name, email, business, or time' });
      return;
    }
    if (!businessType || !BUSINESS_TYPES.has(businessType)) {
      res.status(400).json({ error: 'Select a business type' });
      return;
    }
    if (!EMAIL_RE.test(email.trim())) {
      res.status(400).json({ error: 'Invalid email' });
      return;
    }

    const date = start.slice(0, 10);
    if (!parseDateOnly(date) || !isDateBookable(date)) {
      res.status(400).json({ error: 'Invalid time' });
      return;
    }

    const { timeMin, timeMax } = dayBoundsUtc(date);
    const busy = await getBusyBlocks(timeMin, timeMax);
    const allowed = filterSlots(buildCandidateStarts(date), busy);
    const match = allowed.find((s) => s.start === start);
    if (!match) {
      res.status(409).json({ error: 'That time is no longer available' });
      return;
    }

    const event = await createDiscoveryCall({
      start: match.start,
      end: match.end || slotEndDateTime(match.start),
      name: oneLine(name, 120),
      email: email.trim(),
      phone: cleanPhone,
      businessName: oneLine(businessName, 160),
      businessType,
      businessTypeOther: oneLine(businessTypeOther, 200),
    });

    // Tell the studio. A failed alert never fails the booking; the event is already on the calendar.
    try {
      const day = new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' })
        .format(Date.parse(`${date}T12:00:00Z`));
      await sendBookingAlert({
        when: `${day}, ${match.label} Central`,
        name: oneLine(name, 120),
        email: email.trim(),
        phone: cleanPhone,
        businessName: oneLine(businessName, 160),
        typeLine: formatBusinessType(businessType, oneLine(businessTypeOther, 200)),
        event,
      });
    } catch (alertErr) {
      const g = alertErr?.response?.data?.error;
      console.error('[book] booking alert email failed:', g?.status || g || alertErr?.message,
        '(if insufficient permissions: re-run scripts/google-oauth/get-refresh-token.mjs so the token includes gmail.send)');
    }

    res.status(200).json({
      ok: true,
      htmlLink: event.htmlLink,
      meetLink: event.hangoutLink || event.conferenceData?.entryPoints?.[0]?.uri,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not complete booking' });
  }
};
