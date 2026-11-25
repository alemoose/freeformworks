# Copy audit, Step 5

Checked every visible line on `index.html` and `book.html` (including hidden states, alt text, page titles and meta descriptions) against the copy rules in `PRODUCT.md`. Nov 24, 2026.

Clean: no em dashes, no "X, not Y" or "less X, more Y", no invented businesses or testimonials, every number traces to the pricing decision, Agustin's resume (Feb 2026) or the Lighthouse reports in `docs/`.

## Violations found

| # | Where | Rule | Was | Fix |
|---|---|---|---|---|
| 1 | `/book`, calendar error | Plain words | "Could not load the calendar. Run vercel dev and refresh, or email hello@freeformworks.com." (a developer note shown to customers) | "We couldn't load the calendar. Refresh the page, or email hello@freeformworks.com and we'll find a time." |
| 2 | `/book`, times error | Plain words, say what to do | "Could not load times." | "We couldn't load times for this day. Pick another day or refresh the page." |
| 3 | `/book`, meta description | No agency speak | "Book a free 15-minute discovery call with Freeform Works." | "Book a free 15-minute call with Agustin or María at Freeform Works." |
| 4 | Hero name tags | "We", not "I" | "I build it." / "I make it fit your business." | "Builds it." / "Makes it fit your business." ("Hello, I'm" stays: it's the printed label on a name tag.) |
| 5 | Proof, Lemoose | No overclaiming, real names | "We built his site from scratch." (María wasn't part of that build as far as we know) | "Agustin built it from scratch." |
| 6 | Proof, Lemoose specs | Plain words | "Lighthouse performance, desktop / phone", "Main image on screen, desktop" | "Google speed score, laptop / phone", "Main image loads, laptop", with Lighthouse named once in the note |
| 7 | Past work, APC | Plain words | "Moved the center's old website to React while keeping the live site running." | "Moved the center's old website onto new code without taking it offline." |
| 8 | Name tag and bio, María | Plain words | "MIS" with no explanation | Tag: "Business systems (MIS), UA, May 2027". Bio: "Management information systems (MIS) student at UA". |
| 9 | What we build, website | Every claim gets a specific | "fast on a phone" | "fast on a phone (our first one scores 94 out of 100 on Google's phone test)" |
| 10 | About, María | Approved by María | Bio and Mercedes-Benz line not yet reviewed by her | Left as is with the yellow marker until she signs off. Not fixable by us. |

## Not changed, worth a look

- `/book` business type list still shows the old six industries (Restaurants, Barbershops & salons, Photographers, Florists, Lawn care, Retail, Other). Changing it also changes the booking API. María owns this list.
- Booking API error text ("Invalid email", "That time is no longer available") is plain enough and stays.
