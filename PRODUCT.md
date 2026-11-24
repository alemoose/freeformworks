# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Local business owners in and around Tuscaloosa, AL. Two groups, given equal weight: trades businesses (lawn care, landscaping and other crews), which have more money and the most to gain, and small shops (barbers, salons, photographers, florists, restaurants). They are not technical, they run the business themselves, and they are skeptical of agencies after being quoted high prices or sold things they did not need. Today a lot of their customer handling happens by text, phone and memory.

They arrive at the site wanting to know three things fast: who these people are, what it costs, and whether it will actually fit how their business runs. The job they hire Freeform Works for is "get me a real website and stop me losing customers in my text messages."

## Product Purpose

Freeform Works is a two-person web studio. We build a small business a custom website plus the back office behind it: booking on their own domain, an owner dashboard, and the stuff they currently do by text. Success is a booked 15-minute call from an owner who already knows the price and trusts the two people they will be talking to.

## Positioning

Two real people, named and pictured, with published prices. One of us builds it (Agustin), one of us makes sure it fits how the business actually runs day to day (María, who built and runs her own business, Amitie Florals in Montgomery). Agencies in town hide pricing ("starting at $10K, everything else scoped") and show no faces. We show both.

## Operating Context

- The first contact is a 15-minute call booked on our own `/book` page (native calendar on freeformworks.com, Google Calendar behind it, Mon to Fri, 1 to 5 PM Central, 15-minute slots, 4 hours minimum notice, up to 28 days ahead).
- Process: 15-minute call, build (about 2 weeks), launch, then the monthly care plan.
- Owners mostly look at the site on a phone.

## Capabilities and Constraints

Deliverable to a client today:
- Custom website build.
- Booking on the client's own domain (the same flow as our `/book`).
- Owner dashboard. Agustin can stand one up for a client in 12 hours or less.

Not deliverable yet, so never sold or shown as working:
- AI intake (an assistant that answers new customers). Do not list it as included in setup or in the care plan until it exists. A demo of it may only appear if it is built and clearly labeled as a demo.

Pricing: published on the site, never "contact us for pricing". The numbers are an open decision (see below). Working numbers from the original brief: $1,500 to $2,500 setup, $150 a month care plan (hosting, edits, updates).

Technical:
- Static HTML/CSS/JS on Vercel, with serverless functions in `api/` and `lib/` for the Google Calendar booking. `/book` must keep working exactly as it does now.
- Lighthouse stays at 95 or above. Our speed numbers are part of the pitch.

Open decisions:
- Prices. Likely two tiers, shops and trades. Research and a recommendation are in `docs/pricing-research.md`. Settle before writing the hero and pricing sections.
- Freeform Grounds (`/grounds`, landscaping owner software, MVP, with its own proposed $99 and $249 monthly plans) does not have a settled place in the studio offer. Keep it off the homepage until the owners decide.

## Brand Commitments

- Name: Freeform Works. Location: Tuscaloosa, AL.
- People: Agustin Lemuz-Juarez and María Estrada. Both University of Alabama students, both graduating May 2027. María is an MIS major.
- Voice: friendly, direct, specific, a little personal. Two real people talking to a barber or a florist. Never an agency.
- Must keep: the native `/book` calendar flow on our own domain.

Copy rules (binding on every page):
- No em dashes anywhere.
- No "X, not Y" or "less X, more Y" constructions.
- No invented businesses, testimonials, clients or stats. Every number is real and checkable.
- "We", not "I". Use real names.
- Short sentences, plain words. No agency speak ("growth operating system", "solutions", "elevate").
- Every claim gets a specific: a number, a name, a date or a link.

## Evidence on Hand

Real and usable:
- Lemoose Productions, lemooseproductions.com: a portrait photography site we built for Agustin's older brother, Dre Lemuz. Must be described as family ("our first build was for Agustin's brother Dre's photography studio"). Stats: 0.4s largest contentful paint, 99 Lighthouse, 1.2 MB page weight, 9-day build. Screenshots: `assets/lemooseproductions-hero.png`, `assets/lemooseproductions-mobile.png`.
- Agustin's past work, with his role stated accurately:
  - Student Seats: he helped build it. Platform figures from the brief: 42,000+ users, $2.8M+ in sales. Present these as the platform's numbers, never as his personal results, until he confirms which flows he owned.
  - APC (apc.ua.edu): part-time intern on the migration to Next.js, which cut deploys from 30+ minutes to about 5. Never call it a contract or client project.
  - Autobet: founding engineer.
- The `/book` page itself, as a working example of booking on your own domain.

Pending, do not publish until confirmed:
- Everything about María: how her name is shown, her bio, her photo. She approves it first. Known so far: María Estrada, MIS major, founded Amitie Florals in Montgomery, AL, a real florist business she ran before college and stepped back from when she started school. It has no website, so it is her owner experience, never a case study of ours. Agustin reports she is fine with naming it. Also a Mercedes-Benz co-op and work at Parker Towing, where she may have built AI-assisted dashboards on top of older systems (unconfirmed; she describes it). Employers get "experience at" wording only, never logos or anything implying they endorse Freeform. Say nothing about Parker Towing's vendors.
- Photos of Agustin and María: real photos only, no AI headshots. Placeholder slots until provided.

Absent, must not be fabricated:
- Client testimonials. The old "D. Moose" quote is from family and is retired.
- Hicks BBQ and Snipes: never approved. Never named, and never shown under a made-up business name either. Their designs may only come back as an unnamed sample (for example "sample barbershop booking page"), labeled as a demo on the page itself.
- Any client other than Lemoose. The six industry mock businesses on the old site (Harry's Ramen, Fades by Paul, Hollis Reid, Bluestem Floral, Red Oak Grounds, Northriver General) are invented and must not return.

## Product Principles

1. Show the people. Names and real faces come first, because owners hire people they trust.
2. Publish the price. Being upfront about cost is our biggest edge over every agency in town.
3. Only what's real. If we cannot link it, name it or measure it, it does not go on the site. Lead with what exists and never point at what is missing.
4. Fit the business. Every feature is explained by the day-to-day problem it removes (missed texts, no-shows, double bookings).
5. Fast is part of the product. The site must prove the speed we sell.

## Accessibility & Inclusion

WCAG 2.1 AA. Respect `prefers-reduced-motion`. Readable on a phone in daylight by someone who is not technical.
