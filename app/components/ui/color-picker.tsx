"use client";

import * as React from "react";
import { useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

// Default preset colors (balanced light/dark palette)
const DEFAULT_PRESETS = [
  "#FFFFFF", "#F1F5F9", "#FAF7F5", "#FAF5FF", "#FEF3C7",
  "#0F172A", "#1E40AF", "#C2410C", "#7C3AED", "#059669",
];

type ColorPickerProps = {
  value: string;
  onChange: (color: string) => void;
  presets?: string[];
  label?: string;
  className?: string;
};

export function ColorPicker({
  value,
  onChange,
  presets = DEFAULT_PRESETS,
  label,
  className,
}: ColorPickerProps) {
  const [open, setOpen] = useState(false);
  const [hexInput, setHexInput] = useState(value.replace("#", "").toUpperCase());

  // Sync hex input when value changes externally
  React.useEffect(() => {
    setHexInput(value.replace("#", "").toUpperCase());
  }, [value]);

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value.replace("#", "").toUpperCase();
    // Only allow valid hex characters
    const sanitized = input.replace(/[^0-9A-F]/gi, "").slice(0, 6);
    setHexInput(sanitized);

    // Apply color if valid 6-char hex
    if (sanitized.length === 6) {
      onChange(`#${sanitized}`);
    }
  };

  const handlePresetClick = (color: string) => {
    onChange(color);
    setHexInput(color.replace("#", "").toUpperCase());
    setOpen(false);
  };

  const isLightColor = (hex: string) => {
    const c = hex.replace("#", "");
    const r = parseInt(c.substring(0, 2), 16);
    const g = parseInt(c.substring(2, 4), 16);
    const b = parseInt(c.substring(4, 6), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 155;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "h-8 w-8 rounded-lg border border-border/50 cursor-pointer transition-all",
            "hover:ring-2 hover:ring-primary hover:ring-offset-2",
            "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
            className
          )}
          style={{ backgroundColor: value }}
          aria-label={label || "Pick a color"}
        />
      </PopoverTrigger>

      <PopoverContent className="w-56 p-3" align="start">
        {/* Label */}
        {label && (
          <p className="text-xs font-medium text-muted-foreground mb-2">
            {label}
          </p>
        )}

        {/* Preset Color Grid */}
        <div className="grid grid-cols-5 gap-1.5">
          {presets.map((color) => {
            const isSelected = value.toUpperCase() === color.toUpperCase();
            const isLight = isLightColor(color);

            return (
              <button
                key={color}
                type="button"
                onClick={() => handlePresetClick(color)}
                className={cn(
                  "h-8 w-8 rounded-md transition-all flex items-center justify-center",
                  "hover:scale-110 hover:ring-2 hover:ring-primary hover:ring-offset-1",
                  isSelected && "ring-2 ring-primary ring-offset-1 scale-110"
                )}
                style={{ backgroundColor: color }}
                title={color}
              >
                {isSelected && (
                  <Check
                    className={cn(
                      "h-4 w-4",
                      isLight ? "text-gray-800" : "text-white"
                    )}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Divider */}
        <div className="border-t border-border/50 mt-3 pt-3">
          {/* Hex Input */}
          <div className="flex items-center gap-2">
            <div
              className="h-7 w-7 rounded-md border border-border/50 shrink-0"
              style={{ backgroundColor: value }}
            />
            <div className="flex items-center flex-1 h-8 px-2 rounded-md border border-border/50 bg-muted/30">
              <span className="text-xs text-muted-foreground">#</span>
              <input
                type="text"
                value={hexInput}
                onChange={handleHexChange}
                className="flex-1 bg-transparent text-xs font-mono uppercase outline-none ml-1 w-full"
                placeholder="FFFFFF"
                maxLength={6}
              />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
