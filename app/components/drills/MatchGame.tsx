"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

type MatchCard = {
  id: string;
  text: string;
  side: "left" | "right";
};

export function MatchGame({
  data,
  onStateChange,
}: {
  data: { pairs: Array<{ id: string; left: string; right: string }> };
  onStateChange?: (remaining: number) => void;
}) {
  const initialCards = useMemo<MatchCard[]>(() => {
    const left = data.pairs.map((p) => ({ id: p.id, text: p.left, side: "left" as const }));
    const right = data.pairs.map((p) => ({ id: p.id, text: p.right, side: "right" as const }));
    const shuffle = (arr: MatchCard[]) => [...arr].sort(() => Math.random() - 0.5);
    return [...shuffle(left), ...shuffle(right)];
  }, [data.pairs]);

  const [cards, setCards] = useState<MatchCard[]>(initialCards);
  const [selection, setSelection] = useState<MatchCard[]>([]);

  useEffect(() => {
    setCards(initialCards);
    setSelection([]);
    onStateChange?.(data.pairs.length);
  }, [data.pairs.length, initialCards, onStateChange]);

  const handleSelect = (card: MatchCard) => {
    if (selection.find((c) => c.id === card.id && c.side === card.side)) return;
    const nextSelection = [...selection, card].slice(-2);
    setSelection(nextSelection);

    if (nextSelection.length === 2) {
      const [a, b] = nextSelection;
      if (a.id === b.id && a.side !== b.side) {
        const matchedId = a.id;
        setTimeout(() => {
          setCards((prev) => prev.filter((c) => c.id !== matchedId));
          setSelection([]);
        }, 120);
      } else if (a.side !== b.side) {
        setTimeout(() => setSelection([]), 260);
      } else {
        setTimeout(() => setSelection([card]), 120);
      }
    }
  };

  const remainingPairs = useMemo(() => {
    return new Set(cards.map((c) => c.id)).size;
  }, [cards]);

  useEffect(() => {
    onStateChange?.(remainingPairs);
  }, [remainingPairs, onStateChange]);

  return (
    <div className="grid grid-cols-2 gap-4">
      <AnimatePresence initial={false}>
        {cards.map((card) => {
          const isSelected = selection.some((c) => c.id === card.id && c.side === card.side);
          return (
            <motion.button
              key={`${card.side}-${card.id}-${card.text}`}
              layout
              onClick={() => handleSelect(card)}
              className={cn(
                "aspect-[4/3] rounded-2xl border text-center flex items-center justify-center text-lg font-semibold",
                "touch-action-manipulation transition",
                isSelected
                  ? "bg-emerald-50 border-emerald-300 text-emerald-800 shadow-sm"
                  : "bg-white border-border hover:border-emerald-200 hover:shadow"
              )}
              whileTap={{ scale: 0.98 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <span className="px-2">{card.text}</span>
            </motion.button>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
