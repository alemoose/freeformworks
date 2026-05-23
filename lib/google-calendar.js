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
  if (type === 'other' && other?.trim()) return `${label} — ${other.trim()}`;
  return label;
}

async function createDiscoveryCall({
  start,
  end,
  name,
  email,
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
  ].filter(Boolean).join('\n\n');

  const clientEmail = email.trim().toLowerCase();
  const notifyEmail = config.NOTIFY_EMAIL.trim().toLowerCase();
  const attendees = [{ email: clientEmail, displayName: name }];
  if (notifyEmail && notifyEmail !== clientEmail) {
    attendees.push({ email: notifyEmail, displayName: 'Freeform Works' });
  }

  const res = await calendar.events.insert({
    calendarId: config.CALENDAR_ID,
    sendUpdates: 'all',
    conferenceDataVersion: 1,
    requestBody: {
      summary: `${config.EVENT_TITLE} — ${businessName}`,
      description,
      start: { dateTime: start, timeZone: config.TIMEZONE },
      end: { dateTime: end, timeZone: config.TIMEZONE },
      attendees,
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

module.exports = { getBusyBlocks, createDiscoveryCall };
