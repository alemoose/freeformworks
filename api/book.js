const { getBusyBlocks, createDiscoveryCall } = require('../lib/google-calendar');
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
    const { start, name, email, businessName, businessType, businessTypeOther } =
      req.body || {};
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
      name: name.trim().slice(0, 120),
      email: email.trim(),
      businessName: businessName.trim().slice(0, 160),
      businessType,
      businessTypeOther: businessTypeOther?.trim().slice(0, 200) || '',
    });

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
