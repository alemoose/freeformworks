const { getBusyBlocks } = require('../lib/google-calendar');
const {
  parseDateOnly,
  buildCandidateStarts,
  filterSlots,
  dayBoundsUtc,
  listAvailableDates,
  isDateBookable,
  todayInTz,
} = require('../lib/slots');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const date = req.query.date;
    if (!date) {
      res.status(200).json({
        timezone: process.env.BOOKING_TIMEZONE || 'America/Chicago',
        today: todayInTz(),
        dates: listAvailableDates(),
      });
      return;
    }

    if (!parseDateOnly(date) || !isDateBookable(date)) {
      res.status(400).json({ error: 'Invalid or unavailable date' });
      return;
    }

    const { timeMin, timeMax } = dayBoundsUtc(date);
    const busy = await getBusyBlocks(timeMin, timeMax);
    const candidates = buildCandidateStarts(date);
    const slots = filterSlots(candidates, busy);

    res.status(200).json({ date, slots });
  } catch (err) {
    // Name the cause in the Vercel logs: missing env vars, or Google refusing the refresh token.
    const google = err?.response?.data;
    const reason = err?.message === 'Missing Google OAuth env vars'
      ? 'missing_env_vars'
      : google?.error === 'invalid_grant'
        ? 'refresh_token_expired_or_revoked'
        : google?.error || err?.code || 'unknown';
    console.error('[slots] calendar lookup failed:', reason, google || err?.message);
    res.status(500).json({ error: 'Could not load availability' });
  }
};
