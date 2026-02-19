"use client";

import * as React from "react";

interface GhostHandOverlayProps {
  visible: boolean;
  hint: string;
}

export default function GhostHandOverlay({ visible, hint }: GhostHandOverlayProps) {
  if (!visible) return null;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "grid",
        placeItems: "center",
        background: "rgba(247, 243, 238, 0.74)",
        borderRadius: 12,
        pointerEvents: "none",
      }}
      aria-hidden
    >
      <div style={{ display: "grid", gap: 8, justifyItems: "center" }}>
        <div style={{ fontSize: 30, animation: "v3-hand-pulse 900ms ease-in-out infinite" }}>☞</div>
        <p style={{ margin: 0, fontWeight: 700, color: "#3E4E5C", fontSize: 12 }}>{hint}</p>
      </div>
    </div>
  );
}
