"use client";

import * as React from "react";

interface MetaProfile {
  tokens: number;
  unlockedNodes: string[];
  xp: number;
}

const DEFAULT_PROFILE: MetaProfile = {
  tokens: 0,
  unlockedNodes: ["byte-choice"],
  xp: 0,
};

const NODES = [
  { id: "byte-choice", title: "Byte Choice", href: "/games/byte-choice" },
  { id: "pixel-pairs", title: "Pixel Pairs", href: "/games/pixel-pairs" },
  { id: "relay-sprint", title: "Relay Sprint", href: "/games/relay-sprint" },
] as const;

export default function WorldMap() {
  const [profile, setProfile] = React.useState<MetaProfile>(DEFAULT_PROFILE);

  React.useEffect(() => {
    let mounted = true;

    void fetch("/api/games/meta/profile")
      .then((res) => res.json())
      .then((json) => {
        if (!mounted || !json?.success) return;
        setProfile({
          tokens: Number(json.profile?.tokens ?? 0),
          unlockedNodes: Array.isArray(json.profile?.unlockedNodes)
            ? json.profile.unlockedNodes
            : ["byte-choice"],
          xp: Number(json.profile?.xp ?? 0),
        });
      })
      .catch(() => {
        // keep defaults on local mode
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section
      style={{
        borderRadius: 16,
        border: "1px solid #E2D8CA",
        background: "#F7F3EE",
        padding: 16,
        boxShadow: "0 8px 20px rgba(30, 43, 54, 0.06)",
      }}
    >
      <header style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
        <h2 style={{ margin: 0, color: "#1E2B36", fontSize: 24, fontWeight: 800 }}>World Map</h2>
        <p style={{ margin: 0, color: "#3E4E5C", fontWeight: 700 }}>Tokens {profile.tokens}</p>
      </header>

      <p style={{ margin: "8px 0 16px", color: "#697B89", fontWeight: 600 }}>
        Unlock new language zones by finishing runs.
      </p>

      <div style={{ display: "grid", gap: 12 }}>
        {NODES.map((node, index) => {
          const unlocked = profile.unlockedNodes.includes(node.id);
          const isNext = !unlocked && index > 0 && profile.unlockedNodes.includes(NODES[index - 1].id);
          return (
            <a
              key={node.id}
              href={unlocked ? node.href : undefined}
              style={{
                minHeight: 64,
                borderRadius: 12,
                border: `1px solid ${unlocked ? "#24577A" : "#D0C4B1"}`,
                background: unlocked ? "#EFE8DE" : "#E2D8CA",
                color: unlocked ? "#1E2B36" : "#697B89",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 12px",
                pointerEvents: unlocked ? "auto" : "none",
              }}
            >
              <span style={{ fontWeight: 800 }}>{node.title}</span>
              <span style={{ fontSize: 12, fontWeight: 700 }}>
                {unlocked ? "Open" : isNext ? "Need 30 tokens" : "Locked"}
              </span>
            </a>
          );
        })}
      </div>
    </section>
  );
}
