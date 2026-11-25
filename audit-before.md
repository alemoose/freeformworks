# Audit before the redesign

Target: current homepage (`index.html`) and booking page (`book.html`), branch `claude/gracious-ramanujan-impmqj` at commit `1472280` (same as `main`). Run 2026-11-24.

How it was checked: the Impeccable detector on both files; a source read; Chromium renders at 1280x800 and 390x844 (file:// for the homepage); the booking flow driven by keyboard and mouse with the calendar API mocked, since this container can't reach freeformworks.com or Google Calendar. Not tested: the real booking API, a real phone, screen readers, and real-network Lighthouse. Load times measured from local files mean nothing for the real site, so they're left out; page weight is reported instead.

## Audit Health Score

| # | Dimension | Score | Key Finding |
|---|-----------|-------|-------------|
| 1 | Accessibility | 2 | Body and meta text fails contrast (as low as 1.9:1); no reduced-motion handling on the homepage |
| 2 | Performance | 2 | 4.5 MB on a phone: two 3 to 4 MB PNGs and eight Google font families |
| 3 | Theming | 3 | 55 tokens used 552 times; hard-coded colors live mostly inside the fake mock sites |
| 4 | Responsive Design | 3 | Works at 390px; floating "Let's chat" pill covers content, nav links are 22px tall |
| 5 | Implementation Integrity | 1 | "Lorem ipsum" in the hero image, six invented businesses, two dead links |
| **Total** | | **11/20** | **Acceptable (significant work needed)** |

## Implementation Integrity Verdict

**Fail.** The page does not read as a product-specific system. Verified evidence:
- The hero image (`assets/hero-monitor.png`) is a monitor showing a wireframe with "Lorem ipsum dolor" and grey image placeholders. The first thing a visitor sees is placeholder content.
- The "What I build" section is six fake businesses (Harry's Ramen, Fades by Paul, Hollis Reid, Bluestem Floral, Red Oak Grounds, Northriver General) built on one shared layout, under a headline that says "no templates".
- The proof section announces its own emptiness ("One project in evidence", "More case studies arrive as projects ship").
- The only testimonial is from the owner's brother, attributed as "D. Moose", with no disclosure.
- Detector: eight font families loaded on one page (Anton, Cormorant, IBM Plex Sans, Inter, Libre Baskerville, Oswald, Playfair Display, Shippori Mincho), Inter as primary on both pages, a two-axis grid-line background, decorative repeating stripes, and an eyebrow-over-heading pattern on `/book`.

## Executive Summary

- Audit Health Score: **11/20** (Acceptable)
- Issues: P0: 0, P1: 6, P2: 6, P3: 2
- Top issues:
  1. Placeholder and invented content in the hero and the main section (P1)
  2. 4.5 MB page weight on mobile, which undercuts the "fast sites" pitch (P1)
  3. Text contrast failures on both pages (P1)
  4. Calendar day buttons give screen readers a bare number with no month or selected state (P1)
  5. No `prefers-reduced-motion` handling on the homepage (P1)
- Most of the P1 items go away with the planned rebuild (Step 3). The `/book` items need targeted fixes because that page is being kept.

## Detailed Findings by Severity

### P1 Major

**[P1] Placeholder content in the hero image**
- Location: `index.html` hero, `assets/hero-monitor.png`
- Category: Implementation Integrity
- Impact: The first screen shows "Lorem ipsum". To an owner deciding whether you build real websites, that reads as unfinished.
- Recommendation: Remove it. Use real photos of Agustin and María, or a real screenshot of a shipped build.
- Suggested command: /impeccable shape (handled by the Step 3 rebuild)

**[P1] Invented businesses presented as the offer**
- Location: `index.html`, "What I build" tab panel (about lines 1,000 to 4,800)
- Category: Implementation Integrity
- Impact: Six made-up businesses with fake prices, fake addresses and a fake customer name ("Will Carter, 1820 8th St"). Anyone who searches one finds nothing, and the "no templates" claim is contradicted by six panels sharing one layout.
- Recommendation: Delete the whole section. PRODUCT.md bans invented businesses.
- Suggested command: /impeccable distill (handled by the Step 3 rebuild)

**[P1] Mobile page weight 4.5 MB**
- Location: `assets/lemooseproductions-hero.png` (4.0 MB, 2880x1558, downloaded but not visible at 390px), `assets/hero-monitor.png` (3.2 MB, 2336x1744, shown at 390px wide), Google Fonts request for 8 families
- Category: Performance
- Impact: On a phone with average reception this is several seconds of loading, on a site whose pitch includes "0.4s LCP". Lighthouse would also flag it.
- Recommendation: Serve AVIF/WebP at the displayed size with `srcset`, `loading="lazy"` below the fold, and load one or two font families at most.
- Suggested command: /impeccable optimize

**[P1] Text contrast below WCAG AA**
- Location: homepage grey text `#9a9a9e` on `#fcfbf9` (2.7:1) and on `#f2efe7` (2.4:1); dark sections `#6f6b66` on `#0e0e10` (3.6:1), `#44423e` on `#0e0e10` (1.9:1), `#a85063` on `#0e0e10` (3.7:1). `/book`: `#6f6b66` labels and helper text (3.6:1, 24 instances), "Book a call" eyebrow `#a85063` (3.7:1), hover state `#0e0e10` on `#7c2031` (1.9:1).
- Category: Accessibility
- Impact: Hard to read in daylight on a phone, which is exactly how owners will see it. The grey words in the hero headline ("builds", "for small businesses") are part of the main message.
- WCAG: 1.4.3 Contrast (Minimum)
- Recommendation: Body and label text at 4.5:1 or better; don't carry headline meaning in low-contrast grey.
- Suggested command: /impeccable colorize

**[P1] No reduced-motion handling on the homepage**
- Location: `index.html`: 29 transitions, IntersectionObserver-driven reveals, tab and carousel motion; zero `prefers-reduced-motion` rules. (`/book` does have one.)
- Category: Accessibility
- Impact: People with vestibular disorders get every reveal and slide.
- WCAG: 2.3.3 Animation from Interactions (AAA), and PRODUCT.md requires it
- Recommendation: A reduced-motion path that keeps state changes (fade or instant) and drops movement.
- Suggested command: /impeccable animate (Step 7)

**[P1] Calendar days and time chips don't announce date or selection**
- Location: `book.html` `renderCalendar()` (about line 566) and `chip()` (about line 596)
- Category: Accessibility
- Impact: A screen reader hears "25, button" with no month or weekday, and can't tell which day or time is selected (no `aria-pressed` or `aria-current`). Unavailable days are disabled buttons with no explanation.
- WCAG: 4.1.2 Name, Role, Value; 1.3.1 Info and Relationships
- Recommendation: `aria-label="Wednesday, November 25"`, `aria-pressed` on the selected day and time, and a short live-region message when times load.
- Suggested command: /impeccable harden

### P2 Minor

**[P2] Dead links**
- Location: `index.html` line 4611 ("Subscribe for seasonal drops") and line 4710 ("Write to order"), both `href="#"`
- Category: Implementation Integrity
- Impact: A click jumps to the top of the page. It reads as unfinished.
- Recommendation: Removed along with the mock section.
- Suggested command: /impeccable distill

**[P2] Floating "Let's chat" pill covers content**
- Location: `index.html` bottom dock (visible at 1280 and 390)
- Category: Responsive
- Impact: On a phone it sits over the hero image and later over body text, and duplicates the header button.
- Recommendation: One clear booking button. If a sticky one stays, reserve space for it so it never covers text.
- Suggested command: /impeccable adapt

**[P2] Small nav and inline link targets**
- Location: Header nav links are 22px tall at 1280 (Work, What I build, Principles, Contact). "Start a project" is 90x18 and "Back to top" is 84x19.
- Category: Responsive
- Impact: Below the 24px WCAG minimum, so they're hard to hit on touch screens.
- WCAG: 2.5.8 Target Size (Minimum)
- Recommendation: Pad link hit areas to at least 24px, and ideally 44px on mobile.
- Suggested command: /impeccable adapt

**[P2] Weak keyboard focus indicator**
- Location: Both pages use the browser's default 1px auto outline. The `/book` "Book" brand link shows no ring at all. `book.html` line 285 sets `outline: none` on form fields.
- Category: Accessibility
- Impact: Keyboard users lose their place, especially on the dark booking page.
- WCAG: 2.4.7 Focus Visible
- Recommendation: A visible `:focus-visible` ring in the brand color, at 3:1 or better against both backgrounds.
- Suggested command: /impeccable polish

**[P2] `/book` has no landmarks**
- Location: `book.html`: no `<main>`, `<header>` or `<form>` landmark wrapping the flow, and two `<h1>` elements (the form state and the success state).
- Category: Accessibility
- Impact: Screen reader users can't jump to the form.
- Recommendation: Wrap the flow in `<main>`. Keep one `h1` visible at a time and move focus to the success heading on confirm.
- Suggested command: /impeccable harden

**[P2] Booking business types still list the old six industries**
- Location: `book.html` "Business type" select
- Category: Implementation Integrity
- Impact: The categories (Restaurants, Barbershops & salons, Photographers, Florists, Lawn care, Retail) don't match the new shops-and-trades offer.
- Recommendation: Align with PRODUCT.md (shops; trades and crews; other). María should own this list.
- Suggested command: /impeccable clarify

### P3 Polish

**[P3] Infinite shimmer on loading skeletons**
- Location: `book.html` `.skel::after`, "skel-shimmer" animation
- Category: Performance
- Impact: Minor. It is already disabled under reduced motion.
- Recommendation: Fine to keep; just stop it as soon as data arrives.
- Suggested command: /impeccable animate

**[P3] Eyebrow above heading on `/book`**
- Location: "Book a call" above "15-minute call", "You're booked" above "See you soon."
- Category: Implementation Integrity
- Impact: A stock pattern that makes the page feel templated. Each pair repeats itself.
- Recommendation: One heading per state.
- Suggested command: /impeccable distill

## Patterns & Systemic Issues

- **Grey as hierarchy.** Low-contrast grey (#9a9a9e, #6f6b66, #44423e) does the work of secondary text across both pages, and fails contrast every time.
- **Mocks outweigh the studio.** About 3,800 of the homepage's 5,130 lines, most of its hard-coded colors and six of its eight font families exist only for the fake business mocks.
- **Unoptimized PNGs.** Both large images ship at 2x to 7x their displayed size, with no responsive sources and no lazy loading.

## Positive Findings

- **The `/book` form is solid.** Every field has a real `<label>`, `required` is set, and `autocomplete` (name, email, organization) is wired. Disabled days really are disabled buttons, and keyboard order runs in a logical sequence: Back, month, days, times, form.
- **`/book` already respects reduced motion.** Keep that pattern.
- **Tokens exist.** 55 CSS custom properties used 552 times on the homepage. The new design should start from a token set too.
- **Semantics are mostly there.** One `h1`, `<nav>`, `<footer>`, `<button>`s used for buttons (no clickable divs), `aria-expanded` on tabs, and alt text on every image.
- **No horizontal scroll** at 390px on either page.

## Recommended Actions

1. **[P1] `/impeccable distill`**: Remove the six-business mock section, the "principles" section, the dead links and the hero placeholder image. This is the Step 3 rebuild.
2. **[P1] `/impeccable optimize`**: Resize and convert the two big PNGs, add `srcset` and lazy loading, and cut fonts to one or two families. This is what keeps Lighthouse at 95 or above.
3. **[P1] `/impeccable colorize`**: A new palette where secondary text still passes 4.5:1 on both light and dark grounds.
4. **[P1] `/impeccable harden`**: Calendar day and time labels and selected states, landmarks and focus management on `/book`.
5. **[P1] `/impeccable animate`**: A reduced-motion path for every homepage reveal (Step 7).
6. **[P2] `/impeccable adapt`**: Touch target sizes and the floating pill.
7. **[P2] `/impeccable clarify`**: Booking business types matched to shops and trades.
8. **`/impeccable polish`**: Focus rings and the final pass (Step 8).
