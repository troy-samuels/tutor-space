"use client";

import { useState, useEffect } from "react";
import { TrendingUp, Info } from "lucide-react";
import { getDemandHeatmap } from "@/lib/actions/analytics-demand";
import type { DemandSlot } from "@/lib/actions/types";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS = Array.from({ length: 16 }, (_, i) => i + 6); // 6 AM to 9 PM

const DEMAND_COLORS: Record<string, string> = {
  none: "bg-gray-100",
  low: "bg-emerald-100",
  medium: "bg-emerald-300",
  high: "bg-emerald-500",
  very_high: "bg-emerald-700",
};

const DEMAND_TEXT_COLORS: Record<string, string> = {
  none: "text-gray-400",
  low: "text-emerald-700",
  medium: "text-emerald-800",
  high: "text-white",
  very_high: "text-white",
};

const DEMAND_LABELS: Record<string, string> = {
  none: "No bookings",
  low: "Low demand",
  medium: "Moderate",
  high: "Popular",
  very_high: "Peak time",
};

type DemandHeatmapProps = {
  className?: string;
  compact?: boolean;
};

export function DemandHeatmap({ className = "", compact = false }: DemandHeatmapProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<DemandSlot[]>([]);
  const [daysBack, setDaysBack] = useState(90);
  const [hoveredSlot, setHoveredSlot] = useState<DemandSlot | null>(null);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const result = await getDemandHeatmap(daysBack);
      if (result.data) {
        setData(result.data);
      }
      setIsLoading(false);
    }
    loadData();
  }, [daysBack]);

  const getSlotData = (day: number, hour: number): DemandSlot | undefined => {
    return data.find((d) => d.dayOfWeek === day && d.hourOfDay === hour);
  };

  const formatHour = (hour: number): string => {
    if (hour === 0) return "12am";
    if (hour === 12) return "12pm";
    if (hour < 12) return `${hour}am`;
    return `${hour - 12}pm`;
  };

  if (isLoading) {
    return (
      <div className={`rounded-xl border bg-card ${className}`}>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 w-48 bg-muted rounded" />
            <div className="h-64 bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border bg-card ${className}`}>
      <div className="border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
              Booking Demand
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              See which times are most popular with your students
            </p>
          </div>
          <select
            value={daysBack}
            onChange={(e) => setDaysBack(Number(e.target.value))}
            className="rounded-lg border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value={30}>Last 30 days</option>
            <option value={60}>Last 60 days</option>
            <option value={90}>Last 90 days</option>
            <option value={180}>Last 6 months</option>
          </select>
        </div>
      </div>

      <div className="p-6">
        {/* Heatmap Grid */}
        <div className="overflow-x-auto">
          <div className="min-w-[600px]">
            {/* Header Row - Hours */}
            <div className="flex">
              <div className="w-12 shrink-0" />
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  className="flex-1 text-center text-[10px] font-medium text-muted-foreground pb-2"
                >
                  {formatHour(hour)}
                </div>
              ))}
            </div>

            {/* Day Rows */}
            {DAYS.map((day, dayIndex) => (
              <div key={day} className="flex items-center">
                <div className="w-12 shrink-0 text-xs font-medium text-muted-foreground pr-2 text-right">
                  {day}
                </div>
                <div className="flex flex-1 gap-0.5">
                  {HOURS.map((hour) => {
                    const slot = getSlotData(dayIndex, hour);
                    const demandLevel = slot?.demandLevel || "none";
                    const bookingCount = slot?.bookingCount || 0;

                    return (
                      <div
                        key={`${dayIndex}-${hour}`}
                        className={`
                          relative flex-1 aspect-square rounded-sm cursor-pointer transition-all
                          ${DEMAND_COLORS[demandLevel]}
                          ${hoveredSlot?.dayOfWeek === dayIndex && hoveredSlot?.hourOfDay === hour ? "ring-2 ring-primary ring-offset-1" : ""}
                          hover:scale-110 hover:z-10
                        `}
                        onMouseEnter={() => setHoveredSlot(slot || null)}
                        onMouseLeave={() => setHoveredSlot(null)}
                      >
                        {!compact && bookingCount > 0 && (
                          <span
                            className={`absolute inset-0 flex items-center justify-center text-[8px] font-bold ${DEMAND_TEXT_COLORS[demandLevel]}`}
                          >
                            {bookingCount}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tooltip / Details */}
        {hoveredSlot && (
          <div className="mt-4 flex items-center gap-4 rounded-lg bg-muted/50 px-4 py-3 text-sm">
            <div className="font-medium">
              {DAYS[hoveredSlot.dayOfWeek]} at {formatHour(hoveredSlot.hourOfDay)}
            </div>
            <div className="text-muted-foreground">
              {hoveredSlot.bookingCount} booking{hoveredSlot.bookingCount !== 1 ? "s" : ""} •{" "}
              <span
                className={`font-medium ${
                  hoveredSlot.demandLevel === "very_high"
                    ? "text-emerald-700"
                    : hoveredSlot.demandLevel === "high"
                      ? "text-emerald-600"
                      : ""
                }`}
              >
                {DEMAND_LABELS[hoveredSlot.demandLevel]}
              </span>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="mt-6 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Info className="h-3.5 w-3.5" />
            Based on historical booking patterns
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Demand:</span>
            {["none", "low", "medium", "high", "very_high"].map((level) => (
              <div key={level} className="flex items-center gap-1">
                <div className={`h-3 w-3 rounded-sm ${DEMAND_COLORS[level]}`} />
                <span className="text-muted-foreground capitalize">
                  {level === "very_high" ? "Peak" : level === "none" ? "None" : level}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Insights */}
        {data.length > 0 && (
          <DemandInsights data={data} />
        )}
      </div>
    </div>
  );
}

function DemandInsights({ data }: { data: DemandSlot[] }) {
  // Find peak times
  const peakSlots = data
    .filter((d) => d.demandLevel === "very_high" || d.demandLevel === "high")
    .sort((a, b) => b.bookingCount - a.bookingCount)
    .slice(0, 3);

  // Find low demand times that could be promoted
  const lowSlots = data
    .filter((d) => d.demandLevel === "low" || d.demandLevel === "none")
    .filter((d) => d.hourOfDay >= 9 && d.hourOfDay <= 20); // Reasonable hours

  if (peakSlots.length === 0 && lowSlots.length === 0) {
    return null;
  }

  const formatSlot = (slot: DemandSlot): string => {
    const day = DAYS[slot.dayOfWeek];
    const hour = slot.hourOfDay;
    const time = hour === 0 ? "12am" : hour === 12 ? "12pm" : hour < 12 ? `${hour}am` : `${hour - 12}pm`;
    return `${day} ${time}`;
  };

  return (
    <div className="mt-6 rounded-lg bg-gradient-to-r from-emerald-50 to-blue-50 p-4">
      <h3 className="text-sm font-semibold text-foreground mb-2">Insights</h3>
      <div className="space-y-2 text-sm text-muted-foreground">
        {peakSlots.length > 0 && (
          <p>
            <span className="font-medium text-emerald-700">Peak times:</span>{" "}
            {peakSlots.map((s) => formatSlot(s)).join(", ")}
            {" — "}
            <span className="text-foreground">Consider premium pricing</span>
          </p>
        )}
        {lowSlots.length > 5 && (
          <p>
            <span className="font-medium text-blue-700">Growth opportunity:</span>{" "}
            You have {lowSlots.length} time slots with low demand.{" "}
            <span className="text-foreground">Offer discounts to fill these</span>
          </p>
        )}
      </div>
    </div>
  );
}
