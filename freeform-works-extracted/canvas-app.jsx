/* global React, ReactDOM, DesignCanvas, DCSection, DCArtboard, Direction01, Direction02, Direction03 */

function PaletteSwatches({ items }) {
  return (
    <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
      {items.map(({ hex, label }, i) => (
        <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 6 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 4, background: hex,
            border: "1px solid rgba(255,255,255,0.08)",
          }} />
          <span style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 9, letterSpacing: "0.06em",
            color: "rgba(255,255,255,0.55)",
          }}>{label}</span>
        </div>
      ))}
    </div>
  );
}

function SpecCard({ name, blurb, type, palette }) {
  return (
    <div style={{
      width: 1440, padding: "28px 32px",
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 8,
      color: "rgba(255,255,255,0.85)",
      fontFamily: "Inter, sans-serif",
      display: "grid", gridTemplateColumns: "260px 1fr 1fr 1fr", gap: 40,
      alignItems: "start",
    }}>
      <div>
        <div style={{
          fontFamily: '"JetBrains Mono", monospace', fontSize: 11,
          letterSpacing: "0.08em", textTransform: "uppercase",
          color: "rgba(255,255,255,0.5)", marginBottom: 8,
        }}>{name.split("·")[0].trim()}</div>
        <div style={{ fontSize: 22, fontFamily: '"Cormorant Garamond", serif', lineHeight: 1.1 }}>
          {name.split("·")[1].trim()}
        </div>
      </div>

      <div>
        <div style={{
          fontFamily: '"JetBrains Mono", monospace', fontSize: 9,
          letterSpacing: "0.08em", textTransform: "uppercase",
          color: "rgba(255,255,255,0.4)", marginBottom: 10,
        }}>Register</div>
        <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55, color: "rgba(255,255,255,0.75)" }}>
          {blurb}
        </p>
      </div>

      <div>
        <div style={{
          fontFamily: '"JetBrains Mono", monospace', fontSize: 9,
          letterSpacing: "0.08em", textTransform: "uppercase",
          color: "rgba(255,255,255,0.4)", marginBottom: 10,
        }}>Type pairing</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {type.map((t, i) => (
            <div key={i} style={{ fontSize: 13, color: "rgba(255,255,255,0.75)" }}>
              <span style={{ fontFamily: t.family, fontSize: 18, fontStyle: t.style || "normal", marginRight: 10 }}>{t.sample}</span>
              <span style={{
                fontFamily: '"JetBrains Mono", monospace', fontSize: 10,
                color: "rgba(255,255,255,0.45)",
              }}>{t.family.replace(/"/g, "")}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div style={{
          fontFamily: '"JetBrains Mono", monospace', fontSize: 9,
          letterSpacing: "0.08em", textTransform: "uppercase",
          color: "rgba(255,255,255,0.4)", marginBottom: 10,
        }}>Palette</div>
        <PaletteSwatches items={palette} />
      </div>
    </div>
  );
}

function App() {
  return (
    <DesignCanvas defaultZoom={0.42} background="#1d1b18">

      {/* ── Title strip ─────────────────────────────────────────── */}
      <DCSection
        id="brief"
        title="Freeform Works · v1"
        subtitle="Three distinct visual directions for the hero + work register. Pick one means rejecting the others."
        gap={64}
      >
        <DCArtboard id="brief-note" label="Brief · how to read" width={1440} height={260}>
          <div style={{
            width: "100%", height: "100%",
            background: "#F1ECE2", color: "#15110D",
            padding: "44px 56px",
            fontFamily: "Inter, sans-serif",
          }}>
            <div style={{
              fontFamily: '"JetBrains Mono", monospace', fontSize: 11,
              letterSpacing: "0.08em", textTransform: "uppercase",
              color: "rgba(21,17,13,0.55)",
            }}>How to read this canvas</div>

            <h1 style={{
              fontFamily: '"Cormorant Garamond", serif', fontWeight: 400,
              fontSize: 56, margin: "12px 0 0", lineHeight: 1.05,
              letterSpacing: "-0.015em",
            }}>
              Three directions, side-by-side. Each sets the register for the whole site through its hero and Lemoose case study.
            </h1>

            <div style={{ display: "flex", gap: 28, marginTop: 22, fontSize: 13, color: "rgba(21,17,13,0.65)" }}>
              <span><b>01 · Editorial Index</b> — ivory + clay, type-led masthead, numbered side-rail.</span>
              <span><b>02 · Field Notes</b> — cream + forest, prospectus dossier, hairline-ruled grid.</span>
              <span><b>03 · Marquee</b> — near-black + amber, italic display, letterboxed title-card.</span>
            </div>
          </div>
        </DCArtboard>
      </DCSection>

      {/* ── The three directions ────────────────────────────────── */}
      <DCSection
        id="directions"
        title="Hero + Work · Three directions"
        subtitle="1440 wide. Hero composition + section transition + Lemoose case study, all in one frame so the register reads end-to-end."
        gap={80}
      >
        <DCArtboard id="d01" label="01 · Editorial Index" width={1440} height={2200}>
          <Direction01 />
        </DCArtboard>

        <DCArtboard id="d02" label="02 · Field Notes" width={1440} height={2200}>
          <Direction02 />
        </DCArtboard>

        <DCArtboard id="d03" label="03 · Marquee" width={1440} height={2200}>
          <Direction03 />
        </DCArtboard>
      </DCSection>

      {/* ── Spec strip — each direction's bones ─────────────────── */}
      <DCSection
        id="specs"
        title="Direction specs"
        subtitle="The bones — register, type, palette — for each direction."
        gap={64}
      >
        <DCArtboard id="s01" label="01 · spec" width={1440} height={220} style={{ background: "transparent" }}>
          <SpecCard
            name="01 · Editorial Index"
            blurb="A literary masthead. Wayfinding via numbered side-rail. Plenty of negative space. Quiet, considered, type-first. The opposite of busy."
            type={[
              { family: '"Cormorant Garamond", serif', sample: "Aa Editorial" },
              { family: '"Cormorant Garamond", serif', style: "italic", sample: "Aa Italic accents" },
              { family: '"Inter", sans-serif', sample: "Aa UI / body" },
              { family: '"JetBrains Mono", monospace', sample: "Aa Mono labels" },
            ]}
            palette={[
              { hex: "#F1ECE2", label: "Paper" },
              { hex: "#E8E1D2", label: "Paper-2" },
              { hex: "#15110D", label: "Ink" },
              { hex: "#9C4A2A", label: "Clay" },
            ]}
          />
        </DCArtboard>

        <DCArtboard id="s02" label="02 · spec" width={1440} height={220} style={{ background: "transparent" }}>
          <SpecCard
            name="02 · Field Notes"
            blurb="A studio prospectus. Tabular metadata, hairline rules, named files. Reads like the printed annual report you keep on the shelf."
            type={[
              { family: '"Cormorant Garamond", serif', sample: "Aa Display" },
              { family: '"Inter Tight", sans-serif', sample: "Aa UI / body" },
              { family: '"JetBrains Mono", monospace', sample: "Aa Metadata" },
            ]}
            palette={[
              { hex: "#EFEAE0", label: "Cream" },
              { hex: "#E5DFD2", label: "Cream-2" },
              { hex: "#1A1815", label: "Ink" },
              { hex: "#2E4A3A", label: "Forest" },
            ]}
          />
        </DCArtboard>

        <DCArtboard id="s03" label="03 · spec" width={1440} height={220} style={{ background: "transparent" }}>
          <SpecCard
            name="03 · Marquee"
            blurb="A title sequence. Centered composition, italic display, letterboxed case studies. The boldest of the three — flips paper to film."
            type={[
              { family: '"Cormorant Garamond", serif', style: "italic", sample: "Aa Italic display" },
              { family: '"Cormorant Garamond", serif', sample: "Aa Roman accents" },
              { family: '"Inter", sans-serif', sample: "Aa UI / body" },
              { family: '"JetBrains Mono", monospace', sample: "Aa Credits" },
            ]}
            palette={[
              { hex: "#0E0C0A", label: "Ink" },
              { hex: "#16130F", label: "Ink-2" },
              { hex: "#EFE6D7", label: "Ivory" },
              { hex: "#C28A3A", label: "Amber" },
            ]}
          />
        </DCArtboard>
      </DCSection>

    </DesignCanvas>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
