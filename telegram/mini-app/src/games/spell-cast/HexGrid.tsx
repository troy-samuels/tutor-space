/**
 * HexGrid — Hexagonal grid renderer with touch handling.
 * 19 hexagons in honeycomb pattern (1 + 6 + 12).
 */

import { motion } from 'framer-motion';
import { hapticTap } from '@/lib/haptics';

interface HexGridProps {
  letters: string[];
  selectedIndices: number[];
  usedIndices: Set<number>;
  centerIndex: number;
  onHexTap: (index: number) => void;
}

// Hex positions for 19-hex honeycomb (approximate layout)
const HEX_POSITIONS = [
  // Center hex (0)
  { x: 50, y: 50 },
  // Inner ring (1-6)
  { x: 50, y: 30 }, // top
  { x: 65, y: 40 }, // top-right
  { x: 65, y: 60 }, // bottom-right
  { x: 50, y: 70 }, // bottom
  { x: 35, y: 60 }, // bottom-left
  { x: 35, y: 40 }, // top-left
  // Outer ring (7-18)
  { x: 50, y: 10 }, // top
  { x: 65, y: 20 }, // top-right-1
  { x: 80, y: 30 }, // top-right-2
  { x: 80, y: 50 }, // right
  { x: 80, y: 70 }, // bottom-right-2
  { x: 65, y: 80 }, // bottom-right-1
  { x: 50, y: 90 }, // bottom
  { x: 35, y: 80 }, // bottom-left-1
  { x: 20, y: 70 }, // bottom-left-2
  { x: 20, y: 50 }, // left
  { x: 20, y: 30 }, // top-left-2
  { x: 35, y: 20 }, // top-left-1
];

export function HexGrid({
  letters,
  selectedIndices,
  usedIndices,
  centerIndex,
  onHexTap,
}: HexGridProps) {
  const handleHexClick = (index: number) => {
    if (usedIndices.has(index)) return;
    hapticTap();
    onHexTap(index);
  };

  return (
    <div className="relative aspect-square w-full max-w-sm mx-auto">
      {/* SVG container */}
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 h-full w-full"
        style={{ touchAction: 'none' }}
      >
        {letters.map((letter, i) => {
          const pos = HEX_POSITIONS[i];
          if (!pos) return null;

          const isSelected = selectedIndices.includes(i);
          const isUsed = usedIndices.has(i);
          const isCenter = i === centerIndex;

          let fillColor = 'var(--tg-theme-secondary-bg-color, #2c2c2c)';
          let strokeColor = 'rgba(255, 255, 255, 0.1)';
          let textColor = 'var(--tg-theme-text-color, #ffffff)';

          if (isUsed) {
            fillColor = 'rgba(255, 255, 255, 0.05)';
            textColor = 'rgba(255, 255, 255, 0.3)';
          } else if (isSelected) {
            fillColor = 'var(--tg-theme-button-color, #8774e1)';
            strokeColor = 'var(--tg-theme-button-color, #8774e1)';
            textColor = 'var(--tg-theme-button-text-color, #ffffff)';
          } else if (isCenter) {
            fillColor = '#F59E0B'; // Golden
            strokeColor = '#F59E0B';
          }

          return (
            <g
              key={i}
              onClick={() => handleHexClick(i)}
              style={{ cursor: isUsed ? 'default' : 'pointer' }}
            >
              {/* Hexagon */}
              <motion.polygon
                points={getHexPoints(pos.x, pos.y, 6)}
                fill={fillColor}
                stroke={strokeColor}
                strokeWidth="0.5"
                initial={{ scale: 0 }}
                animate={{ scale: isSelected ? 1.1 : 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              />
              {/* Letter */}
              <text
                x={pos.x}
                y={pos.y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="6"
                fontWeight="bold"
                fill={textColor}
                style={{ pointerEvents: 'none', userSelect: 'none' }}
              >
                {letter}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/**
 * Generate SVG polygon points for a hexagon.
 */
function getHexPoints(cx: number, cy: number, radius: number): string {
  const points: Array<[number, number]> = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 2;
    points.push([
      cx + radius * Math.cos(angle),
      cy + radius * Math.sin(angle),
    ]);
  }
  return points.map((p) => p.join(',')).join(' ');
}
