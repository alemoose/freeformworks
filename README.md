# Freeform Works

Static site — **v1 (R5)** with custom Google Calendar booking.

## Preview (static only)

```bash
python3 -m http.server 8080
```

Open http://localhost:8080 — `book.html` needs the API (see below).

## Booking (local)

```bash
cp scripts/google-oauth/.env .env   # same three Google vars at repo root
npm install
npx vercel dev
```

Open http://localhost:3000/book.html

## Deploy (Vercel)

1. Push repo to GitHub.
2. [vercel.com](https://vercel.com) → Import project.
3. **Settings → Environment Variables** — add:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_REFRESH_TOKEN`
   - optional: `BOOKING_TIMEZONE` (`America/Chicago`)
   - optional: `BOOKING_NOTIFY_EMAIL` (defaults to `hello@freeformworks.com`). Every address here gets a calendar invite on every booking; separate several with commas. Don't list the calendar's own Google account: Google never emails the organizer.
4. Deploy. Point `freeformworks.com` at the Vercel project.

Booking notifications:
- Every booking emails the calendar owner's Gmail ("New booking: ..."), sent through the Gmail API. The refresh token needs both scopes in `scripts/google-oauth/get-refresh-token.mjs` (calendar and gmail.send). Set `BOOKING_ALERT_EMAIL` to send it somewhere else.
- If the alert can't be sent, the booking still goes through and the Vercel log says `[book] booking alert email failed`.

Booking hours are configured in `lib/booking-config.js` (default Mon–Fri 9–5 CT, 15 min).

## Leads (private page at `/leads`)

A lead finder for Agustin and Maria only. It searches Google Maps for local businesses in a city, checks each one's website (no site, Facebook only, a booking-app page as the whole site, broken, not built for phones, "Not secure", old copyright year), and ranks them with a score and plain reasons. Mark a lead Called, Walked in, Follow up, Not a fit or Client, and add notes; both of you see the same list.

Vercel environment variables:
- `LEADS_PASSWORD`: shared password, at least 12 characters. The page stays locked until it's set. Changing it signs everyone out.
- `GOOGLE_MAPS_API_KEY`: a Google Cloud key with **Places API (New)** and **PageSpeed Insights API** enabled. Restrict the key to those two APIs, and set a budget alert.
- Saving needs **Upstash for Redis** from the Vercel Marketplace (Storage tab, free plan). Connecting it adds `KV_REST_API_URL` and `KV_REST_API_TOKEN`.

Google's terms only allow storing place IDs, so saved leads keep the ID plus our own status, notes, site check and speed score; names, phones and websites are re-fetched from Google when the Saved tab loads. The page sends `noindex` and isn't linked from the site.

Files: `leads.html`, `api/leads.js`, `lib/leads/`.

## Files

- `index.html` — main site
- `book.html` — scheduling UI
- `api/slots.js`, `api/book.js` — availability + create event
- `leads.html`, `api/leads.js`, `lib/leads/` — private lead finder
- `lib/` — calendar + slot logic
- `scripts/google-oauth/` — one-time refresh token setup

## Crew dashboard (`grounds-app/`)

`grounds-app/` is the owner dashboard behind the Crew plan: request intake, estimates, recurring jobs and follow-ups for landscaping and other trade crews. It is a separate Flask app with its own PostgreSQL schema, tests and deployment guide ([`grounds-app/README.md`](grounds-app/README.md)), is never uploaded with this static site, and does not use the studio's Google Calendar credentials. There is no public product page for it; it is sold as part of the Crew plan.
