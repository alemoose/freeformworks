/* global React */

// ─────────────────────────────────────────────────────────────────────
// DIRECTION 02 — Field Notes / Dossier
// Cream + ink + forest. Tabular metadata grid, hairline rules.
// Reads like a studio prospectus or annual report.
// 1440 × 2200
// ─────────────────────────────────────────────────────────────────────

function Direction02() {
  const tableCell = {
    padding: "14px 18px",
    borderRight: "1px solid var(--rule)",
    display: "flex",
    flexDirection: "column",
    gap: 6,
  };
  const tableLabel = {
    fontFamily: '"JetBrains Mono", monospace',
    fontSize: 10,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "var(--muted)",
  };
  const tableValue = {
    fontSize: 15,
  };

  return (
    <div className="d2" style={{ width: 1440, height: 2200, position: "relative", overflow: "hidden" }}>

      {/* ─── PROSPECTUS HEADER ───────────────────────────────────────── */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, padding: "32px 64px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 16 }}>
          <span className="mono" style={{ fontSize: 11 }}>FREEFORM WORKS &nbsp;·&nbsp; FIELD&nbsp;NOTES &nbsp;·&nbsp; VOL.&nbsp;I</span>
          <span className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>FREEFORMWORKS.COM</span>
          <span className="mono" style={{ fontSize: 11 }}>NO.&nbsp;001 &nbsp;·&nbsp; 05.2026</span>
        </div>
        <div style={{ height: 3, background: "var(--ink)" }} />
        <div style={{ height: 1, background: "var(--ink)", marginTop: 4 }} />
      </div>

      {/* ─── HERO METADATA GRID ─────────────────────────────────────── */}
      <div style={{ position: "absolute", top: 110, left: 64, right: 64, border: "1px solid var(--rule)", borderRight: "none" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)" }}>
          <div style={tableCell}>
            <span style={tableLabel}>Studio</span>
            <span style={tableValue}>Freeform Works</span>
          </div>
          <div style={tableCell}>
            <span style={tableLabel}>Discipline</span>
            <span style={tableValue}>Web design &amp; build</span>
          </div>
          <div style={tableCell}>
            <span style={tableLabel}>Based</span>
            <span style={tableValue}>Tuscaloosa, AL</span>
          </div>
          <div style={tableCell}>
            <span style={tableLabel}>Established</span>
            <span style={tableValue}>MMXXVI</span>
          </div>
        </div>
      </div>

      {/* ─── HERO POSITIONING ──────────────────────────────────────── */}
      <div style={{ position: "absolute", top: 256, left: 64, right: 64 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 80, alignItems: "start" }}>
          <div>
            <span className="mono" style={{ fontSize: 11, color: "var(--accent)" }}>§ 01 &nbsp; Statement of practice</span>
            <h1 className="display" style={{ fontSize: 136, margin: "28px 0 0", maxWidth: 920 }}>
              A small, considered practice for the event-services web.
            </h1>
          </div>

          {/* Right column — opening paragraph + CTA stack */}
          <div style={{ paddingTop: 8 }}>
            <div className="mono" style={{ fontSize: 10, color: "var(--muted)", marginBottom: 14 }}>
              ABSTRACT — 64 WORDS
            </div>
            <p style={{ fontSize: 15.5, lineHeight: 1.55, margin: 0 }}>
              Freeform Works designs and builds custom websites for portrait
              photographers, wedding florists and videographers. Real custom
              code, AI-accelerated delivery, no templates and no drag-and-drop.
              Editorial register, performance-first, and quietly maintained
              after launch.
            </p>

            <div style={{ marginTop: 36, display: "flex", flexDirection: "column", gap: 0, border: "1px solid var(--ink)" }}>
              <a style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", textDecoration: "none", color: "var(--ink)", borderBottom: "1px solid var(--ink)" }}>
                <span className="mono" style={{ fontSize: 11 }}>BOOK A 15-MIN INTRO CALL</span>
                <span>↗</span>
              </a>
              <a style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", textDecoration: "none", color: "var(--ink)" }}>
                <span className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>HELLO@FREEFORMWORKS.COM</span>
                <span style={{ color: "var(--muted)" }}>→</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ─── FOOTER COLUMN of the hero — keys & legend ─────────────── */}
      <div style={{ position: "absolute", top: 1020, left: 64, right: 64 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", borderTop: "1px solid var(--rule)", borderBottom: "1px solid var(--rule)" }}>
          {[
            ["§ 01", "Statement"],
            ["§ 02", "Work · 01 file"],
            ["§ 03", "What we make"],
            ["§ 04", "About"],
            ["§ 05", "Contact"],
            ["★", "Booking open"],
          ].map(([k, v], i) => (
            <div key={i} style={{ padding: "14px 16px", borderRight: i < 5 ? "1px solid var(--rule-soft)" : "none" }}>
              <div className="mono" style={{ fontSize: 10, color: i === 5 ? "var(--accent)" : "var(--muted)", marginBottom: 4 }}>{k}</div>
              <div style={{ fontSize: 13 }}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── SECTION TRANSITION — heavy rule + "FILE 002" ──────────── */}
      <div style={{ position: "absolute", top: 1190, left: 64, right: 64 }}>
        <div style={{ height: 1, background: "var(--ink)" }} />
        <div style={{ height: 1, background: "var(--ink)", marginTop: 4 }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", paddingTop: 20 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 24 }}>
            <span className="mono" style={{ fontSize: 11, color: "var(--accent)" }}>§ 02</span>
            <span className="mono" style={{ fontSize: 11 }}>WORK · FILE 001</span>
          </div>
          <span className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>
            FILED 04.2026 &nbsp;·&nbsp; STATUS: LIVE
          </span>
        </div>
      </div>

      {/* ─── WORK · Lemoose dossier ──────────────────────────────── */}
      <div style={{ position: "absolute", top: 1280, left: 64, right: 64 }}>

        <h2 className="display" style={{ fontSize: 88, margin: 0 }}>
          Lemoose Productions
        </h2>

        {/* Metadata strip */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", marginTop: 32, borderTop: "1px solid var(--ink)", borderBottom: "1px solid var(--ink)" }}>
          {[
            ["Client", "Lemoose Productions"],
            ["Sector", "Portrait photography"],
            ["Year", "2026"],
            ["Role", "Design · Code"],
            ["URL", "lemoose.com ↗"],
          ].map(([k, v], i) => (
            <div key={i} style={{ padding: "14px 16px", borderRight: i < 4 ? "1px solid var(--rule)" : "none" }}>
              <div style={tableLabel}>{k}</div>
              <div style={{ fontSize: 15, marginTop: 6 }}>{v}</div>
            </div>
          ))}
        </div>

        {/* Body + KPI sidebar */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 48, marginTop: 36 }}>

          {/* Screenshot panel */}
          <div className="placeholder" style={{
            height: 420,
            "--ph-bg": "#E5DFD2", "--ph-stripe": "rgba(26,24,21,0.06)", "--ph-fg": "rgba(26,24,21,0.5)",
          }} data-corner="FIG. 01 — lemoose.com">
            screenshot · ivory marquee, halftone hero
          </div>

          {/* KPI / Notes sidebar */}
          <div style={{ display: "flex", flexDirection: "column", gap: 0, border: "1px solid var(--rule)" }}>
            {[
              ["LCP", "0.4 s"],
              ["Lighthouse", "98 / 100"],
              ["Page weight", "84 KB"],
              ["Build time", "9 days"],
            ].map(([k, v], i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "16px 18px", borderBottom: i < 3 ? "1px solid var(--rule-soft)" : "none" }}>
                <span style={tableLabel}>{k}</span>
                <span className="display" style={{ fontSize: 28 }}>{v}</span>
              </div>
            ))}
            <div style={{ padding: "16px 18px", background: "var(--accent)", color: "var(--paper)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="mono" style={{ fontSize: 11 }}>VISIT SITE</span>
              <span>↗</span>
            </div>
          </div>
        </div>

        {/* Footer caption */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 24, marginTop: 24, borderTop: "1px solid var(--rule)" }}>
          <span className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>
            FILE 001 · 01 OF 01 · CONTINUED → § 03 / WHAT WE MAKE
          </span>
          <span className="mono" style={{ fontSize: 11 }}>
            “The bar was set higher than I asked for.” — D. Moose
          </span>
        </div>
      </div>
    </div>
  );
}

window.Direction02 = Direction02;
