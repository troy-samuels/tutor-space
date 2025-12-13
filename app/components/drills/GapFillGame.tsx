"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

export function GapFillGame({
  data,
  onChange,
}: {
  data: { sentence: string; answer: string; options: string[] };
  onChange?: (selection: string | null) => void;
}) {
  const [selection, setSelection] = useState<string | null>(null);

  useEffect(() => {
    setSelection(null);
    onChange?.(null);
  }, [data.answer, data.options, data.sentence, onChange]);

  const parts = useMemo(() => {
    const split = data.sentence.split("___");
    if (split.length >= 2) {
      return { before: split[0], after: split.slice(1).join("___") };
    }
    return { before: data.sentence, after: "" };
  }, [data.sentence]);

  const handleSelect = (option: string) => {
    setSelection(option);
    onChange?.(option);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-muted/50 p-4">
        <p className="text-lg font-semibold leading-relaxed text-foreground">
          {parts.before}
          <span className="inline-flex items-center justify-center align-middle px-3 py-2 mx-1 min-w-[48px] border border-dashed border-slate-400 rounded-lg bg-white/70 text-base font-semibold">
            {selection ?? "____"}
          </span>
          {parts.after}
        </p>
      </div>

      <div className="space-y-3">
        {data.options.map((option) => {
          const isSelected = selection === option;
          return (
            <button
              key={option}
              type="button"
              onClick={() => handleSelect(option)}
              className={cn(
                "w-full rounded-xl border px-4 py-3 text-lg text-left font-semibold touch-action-manipulation",
                isSelected
                  ? "bg-emerald-50 border-emerald-300 text-emerald-800 shadow-sm"
                  : "bg-white border-border hover:border-emerald-200 hover:shadow-sm"
              )}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}
