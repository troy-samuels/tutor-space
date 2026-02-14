"use client";

import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SiteConfig } from "@/lib/types/site";

type ServiceOffering = {
  id: string;
  name: string;
  duration_minutes?: number | null;
  price?: number | null; // cents
  price_amount?: number | null; // legacy cents
  price_cents?: number | null; // cents
  currency?: string | null;
};

type ProductOffering = {
  id: string;
  title: string;
  price_cents?: number | null;
  currency?: string | null;
};

type OfferingStackProps = {
  services: ServiceOffering[];
  products: ProductOffering[];
  config: SiteConfig;
  className?: string;
  onServiceSelect?: (service: ServiceOffering) => void;
  onProductSelect?: (product: ProductOffering) => void;
};

export function OfferingStack({
  services,
  products,
  config,
  className,
  onServiceSelect,
  onProductSelect,
}: OfferingStackProps) {
  const servicesBlock = config.blocks.find((b) => b.type === "services");
  const productsBlock = config.blocks.find((b) => b.type === "products");

  const servicesEnabled = config.servicesEnabled ? new Set(config.servicesEnabled) : null;
  const productsEnabled = config.productsEnabled ? new Set(config.productsEnabled) : null;

  const visibleServices =
    servicesBlock?.isVisible === false
      ? []
      : services.filter((svc) => !servicesEnabled || servicesEnabled.has(svc.id));

  const visibleProducts =
    productsBlock?.isVisible === false
      ? []
      : products.filter((prod) => !productsEnabled || productsEnabled.has(prod.id));

  const items: Array<
    | { type: "service"; order: number; data: ServiceOffering }
    | { type: "product"; order: number; data: ProductOffering }
  > = [
    ...visibleServices.map((svc) => ({ type: "service" as const, order: servicesBlock?.order ?? 0, data: svc })),
    ...visibleProducts.map((prod) => ({ type: "product" as const, order: productsBlock?.order ?? 1, data: prod })),
  ].sort((a, b) => a.order - b.order);

  if (items.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-3", className)}>
      {items.map((item) => {
        const isService = item.type === "service";
        const title = isService ? (item.data as ServiceOffering).name : (item.data as ProductOffering).title;
        const meta = isService ? formatServiceMeta(item.data as ServiceOffering) : formatProductMeta(item.data as ProductOffering);

        return (
          <button
            key={`${item.type}-${item.data.id}`}
            type="button"
            onClick={() => {
              if (isService) {
                onServiceSelect?.(item.data as ServiceOffering);
              } else {
                onProductSelect?.(item.data as ProductOffering);
              }
            }}
            className="flex w-full items-center justify-between rounded-[var(--radius-card)] border border-black/5 bg-white/80 p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex flex-col gap-1">
              <span className="text-lg font-medium text-neutral-900" style={{ fontFamily: "var(--font-heading)" }}>
                {title}
              </span>
              {meta ? <span className="text-sm text-neutral-500">{meta}</span> : null}
            </div>
            <ArrowRight className="h-4 w-4 text-neutral-400" />
          </button>
        );
      })}
    </div>
  );
}

function formatServiceMeta(service: ServiceOffering) {
  const duration = service.duration_minutes ? `${service.duration_minutes} min` : null;
  const price = formatPrice(service.price_amount ?? service.price ?? service.price_cents, service.currency);
  if (duration && price) return `${duration} • ${price}`;
  if (duration) return duration;
  if (price) return price;
  return null;
}

function formatProductMeta(product: ProductOffering) {
  const price = formatPrice(product.price_cents, product.currency);
  return price ?? null;
}

function formatPrice(amount: number | null | undefined, currency?: string | null) {
  if (amount === null || amount === undefined) return null;
  const cents = amount;
  const localeCurrency = (currency || "USD").toUpperCase();
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: localeCurrency,
      minimumFractionDigits: 2,
    }).format(cents / 100);
  } catch {
    return `$${(cents / 100).toFixed(2)}`;
  }
}

export default OfferingStack;
