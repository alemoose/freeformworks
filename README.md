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
   - optional: `BOOKING_NOTIFY_EMAIL` (defaults to `hello@freeformworks.com` — gets a calendar invite on every booking)
4. Deploy. Point `freeformworks.com` at the Vercel project.

Booking hours are configured in `lib/booking-config.js` (default Mon–Fri 9–5 CT, 15 min).

## Files

- `index.html` — main site
- `book.html` — scheduling UI
- `api/slots.js`, `api/book.js` — availability + create event
- `lib/` — calendar + slot logic
- `scripts/google-oauth/` — one-time refresh token setup

## Before launch

- Compress large PNGs in `assets/` if needed
