const config = require('./booking-config');

function pad(n) {
  return String(n).padStart(2, '0');
}

function todayInTz() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: config.TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function parseDateOnly(str) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) return null;
  const [y, m, d] = str.split('-').map(Number);
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  return { y, m, d };
}

function addDays(dateStr, days) {
  const p = parseDateOnly(dateStr);
  const dt = new Date(Date.UTC(p.y, p.m - 1, p.d + days));
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
}

function compareDate(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Day of week in BOOKING_TIMEZONE (0 = Sun … 6 = Sat). */
function dayOfWeekInTz(dateStr) {
  const wd = new Intl.DateTimeFormat('en-US', {
    timeZone: config.TIMEZONE,
    weekday: 'long',
  }).format(new Date(localSlotToMs(dateStr, 12, 0)));
  const map = {
    Sunday: 0,
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
  };
  return map[wd] ?? 0;
}

/** Wall-clock in BOOKING_TIMEZONE → UTC ms. */
function localSlotToMs(dateStr, hour, minute) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const guess = Date.UTC(y, m - 1, d, hour, minute, 0);
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: config.TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  for (let offset = -48; offset <= 48; offset++) {
    const t = guess + offset * 3600000;
    const parts = Object.fromEntries(
      fmt.formatToParts(new Date(t)).map((p) => [p.type, p.value])
    );
    const py = Number(parts.year);
    const pm = Number(parts.month);
    const pd = Number(parts.day);
    const ph = Number(parts.hour);
    const pmin = Number(parts.minute);
    if (py === y && pm === m && pd === d && ph === hour && pmin === minute) return t;
  }
  return guess;
}

function buildCandidateStarts(dateStr) {
  const p = parseDateOnly(dateStr);
  if (!p) return [];
  if (!config.WORK_DAYS.includes(dayOfWeekInTz(dateStr))) return [];

  const slots = [];
  for (let h = config.WORK_START; h < config.WORK_END; h++) {
    for (const min of [0, 15, 30, 45]) {
      const endMs = localSlotToMs(dateStr, h, min) + config.DURATION_MIN * 60 * 1000;
      const endLocal = new Intl.DateTimeFormat('en-US', {
        timeZone: config.TIMEZONE,
        hour: 'numeric',
        minute: 'numeric',
        hour12: false,
      }).format(endMs);
      const [eh, em] = endLocal.split(':').map(Number);
      if (eh > config.WORK_END || (eh === config.WORK_END && em > 0)) continue;
      slots.push(`${dateStr}T${pad(h)}:${pad(min)}:00`);
    }
  }
  return slots;
}

function toMs(iso) {
  return new Date(iso).getTime();
}

function slotEndDateTime(startDateTime) {
  const date = startDateTime.slice(0, 10);
  const [h, m] = startDateTime.slice(11, 16).split(':').map(Number);
  const endMs = localSlotToMs(date, h, m) + config.DURATION_MIN * 60 * 1000;
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: config.TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(new Date(endMs));
  const hh = parts.find((p) => p.type === 'hour').value;
  const mm = parts.find((p) => p.type === 'minute').value;
  return `${date}T${hh}:${mm}:00`;
}

function overlapsBusy(startDateTime, busyBlocks) {
  const date = startDateTime.slice(0, 10);
  const [h, m] = startDateTime.slice(11, 16).split(':').map(Number);
  const start = localSlotToMs(date, h, m);
  const end = start + config.DURATION_MIN * 60 * 1000;
  const padMs = config.BUFFER_MIN * 60 * 1000;
  return busyBlocks.some((b) => {
    const bStart = toMs(b.start);
    const bEnd = toMs(b.end);
    return start < bEnd + padMs && end + padMs > bStart;
  });
}

function formatLabel(startDateTime) {
  const date = startDateTime.slice(0, 10);
  const [h, m] = startDateTime.slice(11, 16).split(':').map(Number);
  return new Intl.DateTimeFormat('en-US', {
    timeZone: config.TIMEZONE,
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(localSlotToMs(date, h, m)));
}

function listAvailableDates() {
  const today = todayInTz();
  const out = [];
  for (let i = 0; i <= config.MAX_DAYS_AHEAD; i++) {
    const d = addDays(today, i);
    const p = parseDateOnly(d);
    if (config.WORK_DAYS.includes(dayOfWeekInTz(d))) out.push(d);
  }
  return out;
}

function filterSlots(starts, busyBlocks) {
  const now = Date.now();
  const minStart = now + config.MIN_NOTICE_HOURS * 60 * 60 * 1000;
  return starts
    .filter((start) => {
      const date = start.slice(0, 10);
      const [h, m] = start.slice(11, 16).split(':').map(Number);
      return localSlotToMs(date, h, m) >= minStart;
    })
    .filter((start) => !overlapsBusy(start, busyBlocks))
    .map((start) => ({
      start,
      end: slotEndDateTime(start),
      label: formatLabel(start),
    }));
}

function dayBoundsUtc(dateStr) {
  const timeMin = new Date(localSlotToMs(dateStr, 0, 0)).toISOString();
  const next = addDays(dateStr, 1);
  const timeMax = new Date(localSlotToMs(next, 0, 0)).toISOString();
  return { timeMin, timeMax };
}

function isDateBookable(dateStr) {
  const today = todayInTz();
  if (compareDate(dateStr, today) < 0) return false;
  if (compareDate(dateStr, addDays(today, config.MAX_DAYS_AHEAD)) > 0) return false;
  return listAvailableDates().includes(dateStr);
}

module.exports = {
  todayInTz,
  parseDateOnly,
  buildCandidateStarts,
  filterSlots,
  dayBoundsUtc,
  listAvailableDates,
  isDateBookable,
  slotEndDateTime,
  formatLabel,
};
