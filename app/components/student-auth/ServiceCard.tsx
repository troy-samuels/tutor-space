"use client";

import { Clock, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Service = {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price_amount: number;
  price_currency: string;
};

type ServiceCardProps = {
  service: Service;
  isSelected: boolean;
  onSelect: () => void;
  hasPackageCredit?: boolean;
  hasSubscriptionCredit?: boolean;
  disabled?: boolean;
};

function formatPrice(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount / 100);
}

export function ServiceCard({
  service,
  isSelected,
  onSelect,
  hasPackageCredit = false,
  hasSubscriptionCredit = false,
  disabled = false,
}: ServiceCardProps) {
  const hasCredit = hasPackageCredit || hasSubscriptionCredit;

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className={cn(
        "flex w-full items-center justify-between rounded-xl border p-4 text-left transition",
        isSelected
          ? "border-primary bg-primary/5 ring-1 ring-primary/20"
          : "border-border bg-white hover:border-primary/40 hover:bg-muted/20",
        disabled && "opacity-60 cursor-not-allowed"
      )}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-foreground truncate">{service.name}</p>
          {isSelected && (
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary">
              <Check className="h-3 w-3 text-primary-foreground" />
            </div>
          )}
        </div>
        {service.description && (
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
            {service.description}
          </p>
        )}
        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          <span>{service.duration_minutes} minutes</span>
        </div>
      </div>

      <div className="ml-4 flex flex-col items-end gap-1.5 shrink-0">
        {hasCredit ? (
          <Badge
            variant="secondary"
            className={cn(
              "font-medium",
              hasSubscriptionCredit
                ? "bg-blue-100 text-blue-700 hover:bg-blue-100"
                : "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
            )}
          >
            {hasSubscriptionCredit ? "Use Subscription" : "Use Package"}
          </Badge>
        ) : (
          <p className="text-base font-semibold text-foreground">
            {formatPrice(service.price_amount, service.price_currency)}
          </p>
        )}
        {hasCredit && (
          <p className="text-xs text-muted-foreground line-through">
            {formatPrice(service.price_amount, service.price_currency)}
          </p>
        )}
      </div>
    </button>
  );
}
