const { google } = require('googleapis');
const config = require('./booking-config');

function getOAuth2() {
  const id = process.env.GOOGLE_CLIENT_ID;
  const secret = process.env.GOOGLE_CLIENT_SECRET;
  const refresh = process.env.GOOGLE_REFRESH_TOKEN;
  if (!id || !secret || !refresh) {
    throw new Error('Missing Google OAuth env vars');
  }
  const oauth2 = new google.auth.OAuth2(id, secret);
  oauth2.setCredentials({ refresh_token: refresh });
  return oauth2;
}

function getCalendar() {
  return google.calendar({ version: 'v3', auth: getOAuth2() });
}

async function getBusyBlocks(timeMin, timeMax) {
  const calendar = getCalendar();
  const res = await calendar.freebusy.query({
    requestBody: {
      timeMin,
      timeMax,
      timeZone: config.TIMEZONE,
      items: [{ id: config.CALENDAR_ID }],
    },
  });
  return res.data.calendars?.[config.CALENDAR_ID]?.busy ?? [];
}

const BUSINESS_TYPE_LABELS = {
  restaurants: 'Restaurants',
  'barbershops-salons': 'Barbershops & salons',
  photographers: 'Photographers',
  florists: 'Florists',
  'lawn-care': 'Lawn care',
  retail: 'Retail',
  other: 'Other',
};

function formatBusinessType(type, other) {
  const label = BUSINESS_TYPE_LABELS[type] || type;
  if (type === 'other' && other?.trim()) return `${label}: ${other.trim()}`;
  return label;
}

async function createDiscoveryCall({
  start,
  end,
  name,
  email,
  phone,
  businessName,
  businessType,
  businessTypeOther,
}) {
  const calendar = getCalendar();
  const typeLine = formatBusinessType(businessType, businessTypeOther);
  const description = [
    `Business: ${businessName}`,
    `Type: ${typeLine}`,
    'Booked via freeformworks.com',
    `Contact: ${name}`,
    `Email: ${email}`,
    phone ? `Phone: ${phone} (call this number instead of the video link)` : '',
  ].filter(Boolean).join('\n\n');

  const clientEmail = email.trim().toLowerCase();
  const attendees = [{ email: clientEmail, displayName: name }];
  // Everyone on BOOKING_NOTIFY_EMAIL (comma-separated) gets the invite too. The calendar's own
  // Google account is the organizer and is never emailed by Google, so list addresses you read.
  const notifyEmails = [...new Set(config.NOTIFY_EMAIL.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean))];
  for (const notifyEmail of notifyEmails) {
    if (notifyEmail !== clientEmail) attendees.push({ email: notifyEmail, displayName: 'Freeform Works' });
  }

  const res = await calendar.events.insert({
    calendarId: config.CALENDAR_ID,
    sendUpdates: 'all',
    conferenceDataVersion: 1,
    requestBody: {
      summary: `${config.EVENT_TITLE} (${businessName})`,
      description,
      start: { dateTime: start, timeZone: config.TIMEZONE },
      end: { dateTime: end, timeZone: config.TIMEZONE },
      attendees,
      // Reminders on the organizer's calendar: phone alerts before the call, an email a day before.
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 30 },
          { method: 'popup', minutes: 10 },
          { method: 'email', minutes: 24 * 60 },
        ],
      },
      conferenceData: {
        createRequest: {
          requestId: `fw-${Date.now()}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      },
    },
  });
  return res.data;
}

/** RFC 2047 header word, so names like "María" survive. */
function encodeHeader(text) {
  return `=?UTF-8?B?${Buffer.from(String(text).replace(/[\r\n]+/g, ' '), 'utf8').toString('base64')}?=`;
}

/**
 * Email the studio about a new booking, from the calendar owner's Gmail to itself
 * (or to BOOKING_ALERT_EMAIL). Google never emails the organizer about events it created,
 * so this is how the owner hears about bookings. Needs the gmail.send scope on the token.
 */
async function sendBookingAlert({ when, name, email, phone, businessName, typeLine, event }) {
  const auth = getOAuth2();
  let to = config.ALERT_EMAIL;
  if (!to) {
    const cal = await google.calendar({ version: 'v3', auth }).calendars.get({ calendarId: config.CALENDAR_ID });
    to = cal.data.id;
  }
  const meet = event?.hangoutLink || event?.conferenceData?.entryPoints?.[0]?.uri;
  const body = [
    `${name} booked a 15-minute call.`,
    '',
    `When: ${when}`,
    `Business: ${businessName}`,
    `Type: ${typeLine}`,
    `Email: ${email}`,
    phone ? `Phone: ${phone} (they'd rather get a call)` : 'Phone: not given, use the Meet link',
    meet ? `Meet: ${meet}` : null,
    event?.htmlLink ? `On your calendar: ${event.htmlLink}` : null,
    '',
    'Reply to this email to write back to them.',
  ].filter((line) => line !== null).join('\r\n');
  const raw = [
    `To: ${to}`,
    `From: Freeform Works bookings <${to}>`,
    `Reply-To: ${email}`,
    `Subject: ${encodeHeader(`New booking: ${name}, ${businessName} · ${when}`)}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    Buffer.from(body, 'utf8').toString('base64'),
  ].join('\r\n');
  await google.gmail({ version: 'v1', auth }).users.messages.send({
    userId: 'me',
    requestBody: { raw: Buffer.from(raw, 'utf8').toString('base64url') },
  });
  return to;
}

module.exports = { getBusyBlocks, createDiscoveryCall, sendBookingAlert, formatBusinessType };
