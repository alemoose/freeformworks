/* global React */

// ─────────────────────────────────────────────────────────────────────
// DIRECTION 01 — Editorial Index
// Ivory + ink + clay. Type-led masthead. Numbered side-rail wayfinding.
// 1440 × 2200
// ─────────────────────────────────────────────────────────────────────

function Direction01() {
  return (
    <div className="d1" style={{ width: 1440, height: 2200, position: "relative", overflow: "hidden" }}>

      {/* Side rail — vertical numbered wayfinding */}
      <div style={{
        position: "absolute", top: 0, bottom: 0, left: 56, width: 80,
        display: "flex", flexDirection: "column", justifyContent: "space-between",
        paddingTop: 56, paddingBottom: 56, zIndex: 5,
        borderRight: "1px solid var(--rule-soft)",
      }}>
        <div className="mono" style={{ fontSize: 11, color: "var(--muted)", display: "flex", flexDirection: "column", gap: 18 }}>
          <div>FW</div>
          <div>—</div>
          <div>TCL · AL</div>
        </div>

        <div className="mono" style={{ fontSize: 11, display: "flex", flexDirection: "column", gap: 22 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ color: "var(--accent)" }}>[01]</span>
            <span style={{ color: "var(--muted)" }}>Index</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span>[02]</span>
            <span style={{ color: "var(--muted)" }}>Work</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, opacity: 0.45 }}>
            <span>[03]</span>
            <span style={{ color: "var(--muted)" }}>Make</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, opacity: 0.45 }}>
            <span>[04]</span>
            <span style={{ color: "var(--muted)" }}>About</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, opacity: 0.45 }}>
            <span>[05]</span>
            <span style={{ color: "var(--muted)" }}>Contact</span>
          </div>
        </div>

        <div className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>
          MMXXVI
        </div>
      </div>

      {/* ─── HERO ─────────────────────────────────────────────────────── */}
      <div style={{ position: "absolute", inset: 0, paddingLeft: 196, paddingRight: 96, paddingTop: 56 }}>

        {/* Top metadata bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", paddingBottom: 18, borderBottom: "1px solid var(--rule)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <img src="assets/fw-mark-dark.png" alt="" style={{ width: 32, height: 32, objectFit: "contain", filter: "invert(1)", mixBlendMode: "multiply" }} />
            <span className="mono" style={{ fontSize: 11 }}>Freeform Works · Est. 2026</span>
          </div>
          <div className="mono" style={{ fontSize: 11, display: "flex", gap: 28, color: "var(--muted)" }}>
            <span>Index · 01</span>
            <span>Work · 02</span>
            <span>Make · 03</span>
            <span>About · 04</span>
            <span style={{ color: "var(--ink)" }}>Contact ↗</span>
          </div>
        </div>

        {/* Masthead positioning */}
        <div style={{ paddingTop: 96, position: "relative" }}>
          <div className="mono" style={{ fontSize: 12, color: "var(--accent)", marginBottom: 28 }}>
            [01] &nbsp; A studio, lately
          </div>

          <h1 className="display" style={{ fontSize: 168, margin: 0, maxWidth: 1120 }}>
            Custom websites<br/>
            <em>for the event-services</em><br/>
            cinema.
          </h1>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", paddingTop: 88, gap: 80 }}>
            <p style={{ fontSize: 17, lineHeight: 1.5, maxWidth: 460, margin: 0, color: "var(--muted)" }}>
              A Tuscaloosa practice making editorial, performance-first
              sites for photographers, florists and videographers.
              Real custom code. No templates, no drag-and-drop.
            </p>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 14 }}>
              <a className="mono" style={{
                fontSize: 12, color: "var(--ink)", textDecoration: "none",
                borderBottom: "1px solid var(--ink)", paddingBottom: 6,
              }}>Book an intro call &nbsp;↗</a>
              <span className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>
                15 min · Calendly
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── TRANSITION ───────────────────────────────────────────────── */}
      <div style={{ position: "absolute", left: 196, right: 96, top: 1120 }}>
        <div className="hairline" />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", paddingTop: 18 }}>
          <span className="mono" style={{ fontSize: 11 }}>
            <span style={{ color: "var(--accent)" }}>[02]</span> &nbsp; Work · One file, in evidence
          </span>
          <span className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>
            Selected · 01 of 01
          </span>
        </div>
      </div>

      {/* ─── WORK · Lemoose case study ───────────────────────────────── */}
      <div style={{ position: "absolute", left: 196, right: 96, top: 1210 }}>

        {/* Headline row */}
        <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 64, paddingTop: 56 }}>
          <div>
            <div className="mono" style={{ fontSize: 11, color: "var(--muted)", marginBottom: 12 }}>Case 01</div>
            <h2 className="display" style={{ fontSize: 64, margin: 0, lineHeight: 0.95 }}>
              Lemoose<br/>Productions
            </h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <p style={{ fontSize: 19, lineHeight: 1.5, margin: 0, maxWidth: 720 }}>
              Editorial portfolio site for a Tuscaloosa portrait and lifestyle
              photographer. Halftone hero, ivory marquee capsule, full-bleed
              imagery, frosted-glass nav. Static HTML, 98 Lighthouse, &lt; 0.4s LCP.
            </p>

            {/* Metadata table */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0, marginTop: 24, borderTop: "1px solid var(--rule)", borderBottom: "1px solid var(--rule)" }}>
              {[
                ["Sector", "Photography"],
                ["Year", "2026"],
                ["Role", "Design · Build"],
                ["Stack", "Static HTML"],
              ].map(([k, v], i) => (
                <div key={i} style={{ padding: "16px 18px 16px 0", borderLeft: i > 0 ? "1px solid var(--rule-soft)" : "none", paddingLeft: i > 0 ? 20 : 0 }}>
                  <div className="mono" style={{ fontSize: 10, color: "var(--muted)", marginBottom: 6 }}>{k}</div>
                  <div style={{ fontSize: 15 }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Screenshot panel */}
        <div className="placeholder" style={{
          marginTop: 56, height: 540, width: "100%",
          "--ph-bg": "#E8E1D2", "--ph-stripe": "rgba(21,17,13,0.05)", "--ph-fg": "rgba(21,17,13,0.5)",
        }} data-corner="lemoose.com · hero ▸ live">
          screenshot · halftone hero, ivory marquee
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 24 }}>
          <span className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>
            FIG. 01 / 04 &nbsp; — &nbsp; lemoose.com
          </span>
          <a className="mono" style={{
            fontSize: 12, color: "var(--accent)", textDecoration: "none",
            borderBottom: "1px solid var(--accent)", paddingBottom: 4,
          }}>Read the case &nbsp;↗</a>
        </div>
      </div>
    </div>
  );
}

window.Direction01 = Direction01;
