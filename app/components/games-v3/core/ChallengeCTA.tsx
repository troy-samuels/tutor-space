"use client";

import * as React from "react";
import { createChallenge } from "@/lib/games/v3/share/challenge";

interface ChallengeCTAProps {
  gameSlug: string;
  seed: number;
  mode: "daily" | "practice";
  difficultyBand: number;
  uiVersion: string;
  curveVersion: string;
  stumbleText?: string | null;
  onCreated: (url: string) => void;
}

export default function ChallengeCTA({
  gameSlug,
  seed,
  mode,
  difficultyBand,
  uiVersion,
  curveVersion,
  stumbleText,
  onCreated,
}: ChallengeCTAProps) {
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleCreate = React.useCallback(async () => {
    setBusy(true);
    setError(null);

    try {
      const result = await createChallenge({
        gameSlug,
        seed,
        difficultyBand,
        mode,
        uiVersion,
        curveVersion,
        stumbleText,
      });
      onCreated(result.url);
    } catch {
      setError("Challenge link failed");
    } finally {
      setBusy(false);
    }
  }, [curveVersion, difficultyBand, gameSlug, mode, onCreated, seed, stumbleText, uiVersion]);

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <button
        type="button"
        onPointerDown={handleCreate}
        disabled={busy}
        style={{
          minHeight: 48,
          borderRadius: 8,
          border: "1px solid #24577A",
          background: busy ? "#D0D8E0" : "#24577A",
          color: "#F7F3EE",
          fontWeight: 700,
        }}
      >
        {busy ? "Building challenge..." : "Create Challenge Link"}
      </button>
      {error ? <p style={{ margin: 0, fontSize: 12, color: "#A34C44" }}>{error}</p> : null}
    </div>
  );
}
