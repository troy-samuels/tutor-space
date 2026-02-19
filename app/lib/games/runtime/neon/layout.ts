export interface NeonLayoutConfig {
  width: number;
  height: number;
  laneCount?: number;
}

export interface NeonLaneLayout {
  x: number;
  width: number;
}

export interface NeonRuntimeLayout {
  topBandTop: number;
  topBandBottom: number;
  spawnBandTop: number;
  spawnBandBottom: number;
  playfieldTop: number;
  playfieldBottom: number;
  optionBaselineY: number;
  dropStartY: number;
  dropEndY: number;
  laneHeight: number;
  lanes: NeonLaneLayout[];
}

const DEFAULT_LANE_COUNT = 3;
const OUTER_PADDING = 28;
const TOP_BAND_HEIGHT = 40;
const GAP_TOP_TO_SPAWN = 12;
const SPAWN_BAND_HEIGHT = 52;
const GAP_SPAWN_TO_PLAYFIELD = 12;
const FOOTER_SAFE_HEIGHT = 120;
const DROP_END_SAFE_GAP = 24;
const LANE_GAP = 12;

export function buildNeonLayout(config: NeonLayoutConfig): NeonRuntimeLayout {
  const laneCount = config.laneCount ?? DEFAULT_LANE_COUNT;
  const topBandTop = 16;
  const topBandBottom = topBandTop + TOP_BAND_HEIGHT;

  const spawnBandTop = topBandBottom + GAP_TOP_TO_SPAWN;
  const spawnBandBottom = spawnBandTop + SPAWN_BAND_HEIGHT;

  const playfieldTop = spawnBandBottom + GAP_SPAWN_TO_PLAYFIELD;
  const playfieldBottom = Math.max(playfieldTop + 160, config.height - FOOTER_SAFE_HEIGHT);
  const laneHeight = playfieldBottom - playfieldTop;

  const optionBaselineY = config.height - 44;
  const dropStartY = Math.round((spawnBandTop + spawnBandBottom) / 2);
  const dropEndY = Math.min(playfieldBottom - DROP_END_SAFE_GAP, optionBaselineY - 42);

  const innerWidth = config.width - OUTER_PADDING * 2;
  const laneWidth = (innerWidth - LANE_GAP * (laneCount - 1)) / laneCount;
  const lanes: NeonLaneLayout[] = Array.from({ length: laneCount }, (_, i) => ({
    x: OUTER_PADDING + laneWidth / 2 + i * (laneWidth + LANE_GAP),
    width: laneWidth,
  }));

  const layout: NeonRuntimeLayout = {
    topBandTop,
    topBandBottom,
    spawnBandTop,
    spawnBandBottom,
    playfieldTop,
    playfieldBottom,
    optionBaselineY,
    dropStartY,
    dropEndY,
    laneHeight,
    lanes,
  };

  validateNeonLayout(layout);
  return layout;
}

export function validateNeonLayout(layout: NeonRuntimeLayout): void {
  if (layout.spawnBandBottom > layout.playfieldTop - 12) {
    throw new Error("Invalid neon layout: spawn band overlaps playfield.");
  }

  if (layout.dropStartY < layout.spawnBandTop || layout.dropStartY > layout.spawnBandBottom) {
    throw new Error("Invalid neon layout: drop start must stay inside spawn band.");
  }

  if (layout.dropEndY >= layout.optionBaselineY - 12) {
    throw new Error("Invalid neon layout: drop end must stay above options baseline.");
  }

  if (layout.dropEndY <= layout.dropStartY + 40) {
    throw new Error("Invalid neon layout: drop travel distance too short.");
  }
}
