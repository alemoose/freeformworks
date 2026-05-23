module.exports = {
  TIMEZONE: process.env.BOOKING_TIMEZONE || 'America/Chicago',
  CALENDAR_ID: process.env.GOOGLE_CALENDAR_ID || 'primary',
  DURATION_MIN: 15,
  BUFFER_MIN: 15,
  MIN_NOTICE_HOURS: 4,
  MAX_DAYS_AHEAD: 28,
  // 0 = Sun … 6 = Sat
  WORK_DAYS: [1, 2, 3, 4, 5],
  WORK_START: 13,
  WORK_END: 17,
  EVENT_TITLE: 'Discovery call',
  /** Gets a calendar invite email on every booking (in addition to the client). */
  NOTIFY_EMAIL: process.env.BOOKING_NOTIFY_EMAIL || 'hello@freeformworks.com',
};
