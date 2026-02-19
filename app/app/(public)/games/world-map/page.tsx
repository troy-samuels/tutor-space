import type { Metadata } from "next";
import WorldMap from "@/components/games-v3/world-map/WorldMap";

export const metadata: Metadata = {
  title: "World Map | TutorLingua",
  description:
    "Track your language learning journey. Explore zones, build streaks, and master vocabulary games.",
};

export default function WorldMapPage() {
  return (
    <main
      style={{
        minHeight: "100dvh",
        background:
          "radial-gradient(120% 80% at 50% -10%, rgba(77, 120, 151, 0.14), rgba(247, 243, 238, 0) 55%), #F7F3EE",
        padding: "16px 16px 96px",
      }}
    >
      <div style={{ maxWidth: 640, margin: "0 auto", display: "grid", gap: 16 }}>
        {/* Header */}
        <header style={{ display: "grid", gap: 4 }}>
          <h1
            style={{
              margin: 0,
              color: "#1E2B36",
              fontSize: 34,
              fontFamily: "'Mansalva', cursive",
            }}
          >
            World Map
          </h1>
          <p style={{ margin: 0, color: "#3E4E5C", fontWeight: 600, fontSize: 14 }}>
            Explore zones. Build streaks. Master vocabulary.
          </p>
        </header>

        <WorldMap />
      </div>
    </main>
  );
}
