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

// Hex positions for 19-hex honeycomb
const HEX_POSITIONS = [
  // Center hex (0)
  { x: 50, y: 50 },
  // Inner ring (1-6)
  { x: 50, y: 30 },
  { x: 65, y: 40 },
  { x: 65, y: 60 },
  { x: 50, y: 70 },
  { x: 35, y: 60 },
  { x: 35, y: 40 },
  // Outer ring (7-18)
  { x: 50, y: 10 },
  { x: 65, y: 20 },
  { x: 80, y: 30 },
  { x: 80, y: 50 },
  { x: 80, y: 70 },
  { x: 65, y: 80 },
  { x: 50, y: 90 },
  { x: 35, y: 80 },
  { x: 20, y: 70 },
  { x: 20, y: 50 },
  { x: 20, y: 30 },
  { x: 35, y: 20 },
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
    <div className="relative aspect-square w-full max-w-sm mx-auto select-none">
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
          const isTappable = !isUsed;

          let fillColor = 'var(--tg-theme-secondary-bg-color, #2c2c2c)';
          let strokeColor = 'var(--tg-theme-hint-color, #7a7a7a)';
          let textColor = 'var(--tg-theme-text-color, #ffffff)';
          let letterOpacity = 1;

          if (isUsed) {
            fillColor = 'var(--tg-theme-secondary-bg-color, #2c2c2c)';
            strokeColor = 'var(--tg-theme-secondary-bg-color, #2c2c2c)';
            textColor = 'var(--tg-theme-hint-color, #7a7a7a)';
            letterOpacity = 0.4;
          } else if (isSelected) {
            fillColor = 'var(--tg-theme-button-color, #8774e1)';
            strokeColor = 'var(--tg-theme-button-color, #8774e1)';
            textColor = 'var(--tg-theme-button-text-color, #ffffff)';
          } else if (isCenter) {
            fillColor = '#F59E0B';
            strokeColor = '#F59E0B';
            textColor = '#ffffff';
          }

          return (
            <g
              key={i}
              onClick={() => handleHexClick(i)}
              style={{ cursor: isTappable ? 'pointer' : 'default' }}
            >
              <motion.polygon
                points={getHexPoints(pos.x, pos.y, 6)}
                fill={fillColor}
                stroke={strokeColor}
                strokeWidth={isUsed ? '0.2' : '0.5'}
                initial={{ scale: 0 }}
                animate={{ scale: isSelected ? 1.1 : 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              />
              <text
                x={pos.x}
                y={pos.y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="6"
                fontWeight="bold"
                fill={textColor}
                opacity={letterOpacity}
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
