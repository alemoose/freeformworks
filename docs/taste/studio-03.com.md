# Design Map

Source: https://studio-03.com/, captured Nov 24, 2026 at 1440x900. The page is 30,406px tall (about 33 screens).

## Spacing Scale
- Base unit 4px. Most common: 32px (51 uses), 24px (37), 16px (29), 12px (18), 10px, 8px.
- Section-level: 44px and 48px gutters. Full-bleed sections with no max-width container.

## Font Hierarchy
- Hero: BDO Grotesk 130px / 700, letter-spacing -2.6px, line-height 143px
- Watermark: Martian Mono ~120px, outlined, low contrast ("WHY/03?")
- Section titles: BDO Grotesk 48px / 500, -0.96px, line-height 1
- Statements and process steps: BDO Grotesk 36 to 44px / 500
- Section labels: Martian Mono 12 to 14px, uppercase, preceded by an orange dot
- Body: BDO Grotesk 16px / 400, 24px line-height
- Weights: 500 most used (199), then 400 (98), 600 (90)

## Color Palette
- #0F0F0F: main dark background (65.7% of surface)
- #090909: deepest background
- #FFFFFF: light sections (27.2%) and text on dark
- #141414 and #222222: card and raised surfaces
- #333333: text on white sections
- rgba(255,255,255,0.5 to 0.7): muted text on dark
- #DB6600: accent, 0.1% of surface (CTAs, label dots, //01 numerals, one highlighted plan)

## Image Ratios
- Hero: full-bleed photo, starts at scale 1.09
- Selected work: 1:1 and 4:5 features, 1:1 / 4:3 / 16:9 thumbnails, scattered off-grid
- Process: 3:4, one image per step, black objects lit orange
- People: 1:1 circles, about 32px

## Component Tokens
- Radius: 0px buttons; 4, 6, 7.2px cards; 10px toggle; 50% avatars
- Shadows: none
- Grid: 2 columns, 524px / 754px, 48px gap (label gutter + content)
- Buttons: 16px, 10px x 12px padding, white fill on dark, orange on hover
- Motion: GSAP + ScrollTrigger, 22 per-section scripts. Hero words rise from masks (1.1s power4.out, 0.15s per row). Button labels roll up 2.6em in 0.3s cubic-bezier(.785,.135,.15,.86). Header hides on scroll down and slides back on scroll up (0.45s cubic-bezier(.22,1,.36,1)). Stats count up over 1.8s. Pinned horizontal gallery. Sticky 7-step process with swapping image. Footer has live clocks for 4 cities. Every script has a reduced-motion branch.
- focus-visible: yes. Reduced motion: yes.

---

# Taste DNA

### Orange lives in the photos, not the interface
- **Trigger**: When choosing how much of the page should carry the brand orange.
- **Decision**: They kept #DB6600 to 0.1% of the interface (CTAs, section dots, //01 numerals) and let orange-lit product photography carry the color, over orange section fills or gradients.
- **Reason**: On a dark page, one rare warm color makes every orange mark read as "press here" or "this matters".
- **Evidence**: #DB6600 covers 0.1% of background area against 65.7% #0F0F0F. The 7 process images are black objects lit orange. The page has zero box-shadows.

### Every section opens with the same mono label
- **Trigger**: When structuring a 30,406px page with 12 sections.
- **Decision**: They used a fixed grammar (orange dot + uppercase Martian Mono label in a left gutter, content in a right column) over centered headings that change per section.
- **Reason**: On a page 33 screens long, a reader needs to know where they are without reading a headline.
- **Evidence**: "OUR MISSION", "SELECTED WORK", "SERVICES", "OUR PROCESS", "FAQS" are all 12 to 14px Martian Mono. 2-column grid at 524px / 754px. Martian Mono appears 129 times against BDO Grotesk's 914.

### A different move for every section
- **Trigger**: When deciding how the page should move.
- **Decision**: They built one purpose-made animation per section (masked word rise, count-up, pinned horizontal gallery, sticky process swap, live clocks) over one shared fade-up reveal.
- **Reason**: For a studio that sells design, the motion is part of the portfolio. How each part behaves is the proof of craft.
- **Evidence**: 25 scripts, 22 of them section-specific. The hero timeline has 6 staggered layers. Every script has a prefers-reduced-motion branch.

### The founders sign the page
- **Trigger**: When establishing trust for a 2-person studio.
- **Decision**: They put named founder faces and bylines at the hero, the mission and the closing CTA, over an anonymous "we" voice.
- **Reason**: Buyers of a tiny studio are hiring the people, so the people show up wherever a decision is asked for.
- **Evidence**: Two 1:1 avatars beside "Team of 2 studio" in the hero. The mission is signed "Stefan Hendrickx, Founder + Brand Dept." The closing CTA carries the same avatar and byline.
