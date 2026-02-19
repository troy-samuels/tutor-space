"use client";

import * as React from "react";
import type * as PhaserTypes from "phaser";

type PhaserModule = typeof PhaserTypes;

interface PhaserHostProps {
  sceneFactory: (Phaser: PhaserModule) => PhaserTypes.Scene;
  sceneKey: string;
  width: number;
  height: number;
  className?: string;
}

export default function PhaserHost({
  sceneFactory,
  sceneKey,
  width,
  height,
  className,
}: PhaserHostProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    let cancelled = false;
    let game: PhaserTypes.Game | null = null;

    async function boot() {
      const Phaser = await import("phaser");
      if (cancelled || !containerRef.current) return;

      containerRef.current.innerHTML = "";

      game = new Phaser.Game({
        type: Phaser.AUTO,
        width,
        height,
        parent: containerRef.current,
        banner: false,
        backgroundColor: "#00000000",
        autoFocus: true,
        fps: {
          target: 60,
          min: 30,
          forceSetTimeOut: false,
        },
        scene: [sceneFactory(Phaser)],
        render: {
          antialias: true,
          pixelArt: false,
          roundPixels: false,
          powerPreference: "high-performance",
        },
        scale: {
          mode: Phaser.Scale.FIT,
          autoCenter: Phaser.Scale.CENTER_BOTH,
          width,
          height,
        },
      });
    }

    void boot();

    return () => {
      cancelled = true;
      if (game) {
        game.destroy(true);
        game = null;
      }
    };
  }, [sceneFactory, sceneKey, width, height]);

  return <div ref={containerRef} className={className} />;
}
