import type { Metadata } from "next";
import WorldMap from "@/components/games-v3/world-map/WorldMap";

export const metadata: Metadata = {
  title: "World Map | TutorLingua Retro Reboot",
  description: "Unlock language zones, earn power tokens, and track progress across the retro trilogy.",
};

export default function WorldMapPage() {
  return (
    <main style={{ minHeight: "100dvh", background: "#F7F3EE", padding: 16 }}>
      <div style={{ maxWidth: 640, margin: "0 auto", display: "grid", gap: 12 }}>
        <h1 style={{ margin: 0, color: "#1E2B36", fontSize: 34, fontWeight: 800 }}>Retro World Map</h1>
        <p style={{ margin: 0, color: "#3E4E5C", fontWeight: 600 }}>
          Start simple. Grow complexity. Keep language flow alive.
        </p>
        <WorldMap />
      </div>
    </main>
  );
}
