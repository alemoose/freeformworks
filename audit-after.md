# Audit after the redesign

Target: the new homepage (`index.html`) and booking page (`book.html`) on branch `claude/gracious-ramanujan-impmqj`, compared with `audit-before.md` (11/20). Run Nov 24, 2026.

How it was checked:
- the Impeccable detector on the source files and on both pages rendered at 1440x900 and 390x844
- Google Lighthouse 12.2.1, phone and desktop, two runs each
- keyboard and touch-target checks in Chromium
- the booking flow driven end to end with the calendar API mocked
- motion checked both with motion allowed and with reduce-motion on

Pages were served from a local static server, so `/book`'s calendar API wasn't live. Not tested: a real screen reader, real phones, or the production deploy on Vercel.

## Audit Health Score

| # | Dimension | Before | After | Key finding now |
|---|-----------|--------|-------|-----------------|
| 1 | Accessibility | 2 | 4 | Lighthouse 100 on both pages. The lowest text contrast measured is 7.7:1. Reduce-motion handled everywhere. Calendar days and times are labeled with their pressed state. |
| 2 | Performance | 2 | 4 | Lighthouse 100 on phone and desktop. Homepage is 184 KB (was 4.5 MB on a phone). Fonts are self-hosted and preloaded. No layout shift. |
| 3 | Theming | 3 | 3 | Colors and easing live in shared tokens. A few one-off tints remain (`#f3dde1`, `#c9a2aa`). There's no dark mode, and none is required. |
| 4 | Responsive Design | 3 | 4 | No sideways scroll at 390 or 1440. Taps are 44px or more, except links inside sentences. Sticky header. Hover lift only with a real mouse. |
| 5 | Implementation Integrity | 1 | 3 | Every claim traces to a source, with no invented businesses or placeholders. Remaining: `/book`'s business-type list doesn't match the shop and crew plans yet. |
| **Total** | | **11/20** | **18/20** | **Excellent (minor polish)** |

## Lighthouse (local static server, Nov 24, 2026)

| Page | Device | Speed | Accessibility | Best practices | SEO | Main content shows | Layout shift | Weight |
|---|---|---|---|---|---|---|---|---|
| Homepage | Phone | 100 | 100 | 100 | 100 | 1.7 to 1.8 s | 0 | 184 KB |
| Homepage | Desktop | 100 | 100 | 100 | 100 | 0.4 s | 0 | 184 KB |
| /book | Phone | 100 | 100 | 96* | 100 | 1.6 s | 0 | 117 KB |
| /book | Desktop | 100 | 100 | 96* | 100 | 0.4 s | 0 | 117 KB |

\* The only failing check is a console 404 from `/api/slots`, which doesn't exist on the local test server. On Vercel the API answers, so this should be 100. Confirm on the live deploy.

Before self-hosting the fonts, the homepage scored 95 on a phone with the main content at 2.9 s.

## What changed since `audit-before.md`

| Before (P1/P2) | Now |
|---|---|
| "Lorem ipsum" hero image | Removed. The image file is deleted. |
| Six invented businesses | Removed. |
| 4.5 MB on phones, 8 font families | 184 KB, 3 self-hosted fonts |
| Text contrast as low as 1.9:1 | Lowest 7.7:1 |
| No reduced-motion handling on the homepage | Movement is opt-in. Reduce-motion gets fades only. |
| Calendar days read as "25, button" | "Wednesday, November 25", with pressed state |
| Floating pill covering content | Removed. Sticky header with a Book button. |
| Nav links 22px tall | Header and buttons 44px or more |
| Weak focus ring | 3px ring on every control, themed per background |
| `/book` with no landmarks | `<main>`, focus moves to the confirmation, errors announced |
| Dead `#` links | Gone |
| Old design pages publicly served at `/site/` | Excluded from deploys (`.vercelignore`) |

## Remaining

- **[P2] `/book` business types:** still the old six industries. The booking API checks against this list, so changing it touches `api/book.js` and `lib/google-calendar.js`. María owns this list.
- **[P3] One-off tints:** `#f3dde1` (receipt highlight) and `#c9a2aa` (calendar day border) could become tokens.
- **[P3] Static-scan noise:** 8 "cramped-padding" hits and 1 "marquee" hit from the source scan. These are false positives: the scan can't resolve `clamp()` and CSS variables, and the "marquee" is the loading shimmer, which is off under reduce-motion. The rendered scans are clean.
- **Outside this audit:** `/grounds` is still public, with its own proposed pricing ($99 and $249 a month) that doesn't match the studio plans.
