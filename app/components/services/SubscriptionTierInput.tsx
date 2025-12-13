"use client";

import { SUBSCRIPTION_TIERS, type TemplateTier } from "@/lib/subscription";

export type TierPricing = {
  tier_id: TemplateTier;
  price: number | null; // In dollars, null means disabled
};

type Props = {
  values: TierPricing[];
  currency: string;
  onChange: (values: TierPricing[]) => void;
  disabled?: boolean;
};

const TIER_ORDER: { key: keyof typeof SUBSCRIPTION_TIERS; tier_id: TemplateTier }[] = [
  { key: "TWO_LESSONS", tier_id: "2_lessons" },
  { key: "FOUR_LESSONS", tier_id: "4_lessons" },
  { key: "EIGHT_LESSONS", tier_id: "8_lessons" },
];

export function SubscriptionTierInput({ values, currency, onChange, disabled }: Props) {
  const getTierValue = (tier_id: TemplateTier) => {
    return values.find((v) => v.tier_id === tier_id)?.price ?? null;
  };

  const handleTierChange = (tier_id: TemplateTier, price: number | null) => {
    const newValues = [...values];
    const existing = newValues.find((v) => v.tier_id === tier_id);
    if (existing) {
      existing.price = price;
    } else {
      newValues.push({ tier_id, price });
    }
    onChange(newValues);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">
          Monthly subscription tiers
        </span>
        <span className="text-xs text-muted-foreground">
          Leave empty to disable a tier
        </span>
      </div>

      <div className="space-y-2">
        {TIER_ORDER.map(({ key, tier_id }) => {
          const tier = SUBSCRIPTION_TIERS[key];
          const value = getTierValue(tier_id);

          return (
            <div
              key={tier_id}
              className="flex items-center gap-3 rounded-xl border border-border bg-background p-3"
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground">
                  {tier.label}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {tier.description}
                </div>
              </div>

              <div className="relative flex-shrink-0 w-28">
                <span className="absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">
                  {currency}
                </span>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={value ?? ""}
                  onChange={(e) => {
                    const val = e.target.value === "" ? null : parseFloat(e.target.value);
                    handleTierChange(tier_id, val);
                  }}
                  disabled={disabled}
                  placeholder="—"
                  className="w-full rounded-lg border border-input bg-background py-2 pl-12 pr-3 text-sm text-right shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                />
              </div>

              <span className="text-xs text-muted-foreground flex-shrink-0">
                /mo
              </span>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        Students subscribe monthly with unused lessons rolling over (max 1 month).
      </p>
    </div>
  );
}
