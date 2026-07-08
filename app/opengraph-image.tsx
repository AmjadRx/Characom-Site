import { ImageResponse } from "next/og";

/**
 * Default Open Graph image — ink canvas, gold rule, CHARACOM wordmark.
 * Deliberately static (no content-source reads) so it renders instantly on
 * the edge and never depends on GitHub API availability.
 */

export const runtime = "edge";
export const alt = "Characom Group — We build what outlasts us.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const INK = "#0e1216";
const GOLD = "#c8912d";
const GOLD_BRIGHT = "#e3b75c";
const STONE = "#8a8577";
const PLASTER = "#f7f5f0";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 96px",
          backgroundColor: INK,
          backgroundImage: `radial-gradient(900px 500px at 85% -10%, rgba(200,145,45,0.22), transparent 65%), radial-gradient(700px 420px at -5% 110%, rgba(200,145,45,0.10), transparent 60%)`,
        }}
      >
        {/* kicker */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
            marginBottom: 34,
          }}
        >
          <div style={{ width: 44, height: 2, backgroundColor: GOLD }} />
          <div
            style={{
              fontSize: 22,
              letterSpacing: "0.24em",
              color: STONE,
              textTransform: "uppercase",
            }}
          >
            Characom Group — Cyprus
          </div>
        </div>

        {/* wordmark */}
        <div
          style={{
            fontSize: 148,
            fontWeight: 700,
            letterSpacing: "0.02em",
            color: PLASTER,
            lineHeight: 1,
            display: "flex",
          }}
        >
          CHARACOM
        </div>

        {/* gold rule */}
        <div
          style={{
            width: 220,
            height: 4,
            marginTop: 40,
            marginBottom: 36,
            backgroundImage: `linear-gradient(90deg, ${GOLD}, ${GOLD_BRIGHT})`,
          }}
        />

        {/* tagline */}
        <div
          style={{
            fontSize: 40,
            color: "rgba(247,245,240,0.82)",
            display: "flex",
          }}
        >
          We build what outlasts us.
        </div>

        {/* footer row */}
        <div
          style={{
            position: "absolute",
            bottom: 56,
            left: 96,
            right: 96,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 22,
            color: STONE,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
          }}
        >
          <div style={{ display: "flex" }}>Infrastructure</div>
          <div style={{ display: "flex" }}>Real Estate</div>
          <div style={{ display: "flex" }}>Residential</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
