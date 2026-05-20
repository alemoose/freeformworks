/* global React */

// ─────────────────────────────────────────────────────────────────────
// DIRECTION 03 — Marquee
// Near-black + ivory + amber. Italic Cormorant display. Letterboxed
// title-card composition — closing-credits register.
// 1440 × 2200
// ─────────────────────────────────────────────────────────────────────

function Direction03() {
  return (
    <div className="d3" style={{ width: 1440, height: 2200, position: "relative", overflow: "hidden" }}>

      {/* ─── TOP NAV — frosted marquee bar ────────────────────────── */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 64,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 56px",
        borderBottom: "1px solid var(--rule-soft)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <img src="assets/fw-mark-light.png" alt="" style={{ width: 28, height: 28, objectFit: "contain", opacity: 0.95 }} />
          <span className="mono" style={{ fontSize: 11 }}>FREEFORM&nbsp;&nbsp;WORKS</span>
        </div>
        <div className="mono" style={{ fontSize: 11, display: "flex", gap: 36, color: "var(--muted)" }}>
          <span>I. Index</span>
          <span>II. Work</span>
          <span>III. Make</span>
          <span>IV. About</span>
          <span style={{ color: "var(--ink)" }}>V. Contact</span>
        </div>
        <span className="mono" style={{ fontSize: 11, color: "var(--accent)" }}>BOOKING · MMXXVI</span>
      </div>

      {/* ─── HERO MARQUEE ─────────────────────────────────────────── */}
      <div style={{ position: "absolute", top: 64, left: 0, right: 0, height: 1000, padding: "0 56px" }}>

        {/* Letterbox top */}
        <div style={{ height: 1, background: "var(--rule)", marginTop: 36 }} />

        {/* Reel label row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", paddingTop: 18 }}>
          <span className="mono" style={{ fontSize: 11, color: "var(--accent)" }}>[ I ] &nbsp; A studio in feature presentation</span>
          <span className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>REEL 01 / 05 &nbsp;·&nbsp; 1.85 : 1</span>
        </div>

        {/* Centered display block */}
        <div style={{ paddingTop: 130, textAlign: "center" }}>
          <span className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>
            ⸺ &nbsp;A TUSCALOOSA PRACTICE &nbsp;⸺
          </span>

          <h1 className="display" style={{
            fontSize: 152, fontStyle: "italic", margin: "30px 0 0",
            lineHeight: 0.95, whiteSpace: "nowrap",
          }}>
            Custom websites,<br/>
            <span style={{ fontStyle: "normal" }}>with the lights on.</span>
          </h1>

          <p style={{
            fontSize: 17, lineHeight: 1.55, margin: "44px auto 0",
            maxWidth: 620, color: "var(--muted)",
          }}>
            Editorial, performance-first sites for photographers, florists,
            and videographers. Real custom code. No templates. No drag-and-drop.
          </p>

          {/* Twin CTA */}
          <div style={{ marginTop: 44, display: "inline-flex", gap: 0, border: "1px solid var(--ink)" }}>
            <a style={{
              padding: "16px 28px", textDecoration: "none", color: "var(--paper)",
              background: "var(--ink)",
              display: "flex", alignItems: "center", gap: 14,
            }}>
              <span className="mono" style={{ fontSize: 11 }}>BOOK A CALL</span>
              <span>↗</span>
            </a>
            <a style={{
              padding: "16px 28px", textDecoration: "none", color: "var(--ink)",
              borderLeft: "1px solid var(--ink)",
              display: "flex", alignItems: "center", gap: 14,
            }}>
              <span className="mono" style={{ fontSize: 11 }}>SEE THE WORK</span>
              <span>↓</span>
            </a>
          </div>
        </div>

        {/* Footer credit row of the marquee */}
        <div style={{ position: "absolute", left: 56, right: 56, bottom: 28, display: "flex", justifyContent: "space-between", alignItems: "baseline", paddingTop: 18, borderTop: "1px solid var(--rule-soft)" }}>
          <div className="mono" style={{ fontSize: 11, color: "var(--muted)", display: "flex", gap: 28 }}>
            <span>DESIGN · BUILD · MAINTAIN</span>
            <span>—</span>
            <span>EST. 2026</span>
          </div>
          <div className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>
            HELLO@FREEFORMWORKS.COM
          </div>
        </div>
      </div>

      {/* ─── SECTION TRANSITION — marquee divider ─────────────────── */}
      <div style={{ position: "absolute", top: 1090, left: 0, right: 0 }}>
        <div style={{ height: 1, background: "var(--rule)" }} />
        <div style={{ background: "var(--paper-2)", borderBottom: "1px solid var(--rule)", padding: "18px 56px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span className="mono" style={{ fontSize: 11, color: "var(--accent)" }}>
            [ II ] &nbsp; WORK
          </span>
          <span className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>
            NOW SHOWING &nbsp;·&nbsp; ONE FEATURE
          </span>
          <span className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>
            01 / 01
          </span>
        </div>
      </div>

      {/* ─── WORK · Lemoose title card ───────────────────────────── */}
      <div style={{ position: "absolute", top: 1180, left: 0, right: 0, padding: "0 56px" }}>

        {/* Title card — letterboxed screenshot */}
        <div style={{ position: "relative", marginTop: 36 }}>
          <div className="placeholder" style={{
            width: "100%", height: 560,
            "--ph-bg": "#1a1612", "--ph-stripe": "rgba(239,230,215,0.04)", "--ph-fg": "rgba(239,230,215,0.4)",
          }} data-corner="lemoose.com · 21:9 ▸ live">
            screenshot · halftone hero, ivory marquee
          </div>

          {/* Corner brackets */}
          {[
            { top: -8, left: -8, borderTop: "1px solid var(--accent)", borderLeft: "1px solid var(--accent)" },
            { top: -8, right: -8, borderTop: "1px solid var(--accent)", borderRight: "1px solid var(--accent)" },
            { bottom: -8, left: -8, borderBottom: "1px solid var(--accent)", borderLeft: "1px solid var(--accent)" },
            { bottom: -8, right: -8, borderBottom: "1px solid var(--accent)", borderRight: "1px solid var(--accent)" },
          ].map((s, i) => (
            <div key={i} style={{ position: "absolute", width: 24, height: 24, ...s }} />
          ))}
        </div>

        {/* Credit block — film closing-credits */}
        <div style={{ paddingTop: 56, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80 }}>

          {/* Left — title */}
          <div>
            <span className="mono" style={{ fontSize: 11, color: "var(--accent)" }}>
              A FREEFORM WORKS PRODUCTION
            </span>
            <h2 className="display" style={{ fontSize: 96, margin: "20px 0 0", fontStyle: "italic", lineHeight: 0.92 }}>
              Lemoose<br/>Productions
            </h2>
            <p style={{ fontSize: 15.5, lineHeight: 1.55, marginTop: 28, maxWidth: 480, color: "var(--muted)" }}>
              An editorial portfolio for a Tuscaloosa portrait and lifestyle
              photographer. Halftone hero, ivory marquee capsule, full-bleed
              imagery, frosted-glass nav.
            </p>
          </div>

          {/* Right — credits block */}
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {[
              ["DIRECTED &amp; BUILT BY", "Freeform Works"],
              ["FOR", "Lemoose Productions"],
              ["YEAR", "MMXXVI"],
              ["LIGHTHOUSE", "98 / 100"],
              ["LCP", "0.4 s"],
              ["NOW PLAYING AT", "lemoose.com ↗"],
            ].map(([k, v], i) => (
              <div key={i} style={{
                display: "flex", justifyContent: "space-between", alignItems: "baseline",
                padding: "14px 0",
                borderBottom: "1px solid var(--rule-soft)",
              }}>
                <span className="mono" style={{ fontSize: 11, color: "var(--muted)" }} dangerouslySetInnerHTML={{ __html: k }} />
                <span style={{ fontSize: 17 }}>{v}</span>
              </div>
            ))}

            <a style={{
              marginTop: 28, padding: "16px 22px",
              background: "var(--accent)", color: "var(--paper)", textDecoration: "none",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <span className="mono" style={{ fontSize: 11 }}>VIEW THE FEATURE</span>
              <span>↗</span>
            </a>
          </div>
        </div>
      </div>

      {/* ─── Vignette wash to add cinematic depth ─────────────────── */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse at 50% 35%, transparent 40%, rgba(0,0,0,0.35) 100%)",
      }} />
    </div>
  );
}

window.Direction03 = Direction03;
