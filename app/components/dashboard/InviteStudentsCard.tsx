"use client";

import { useState } from "react";
import { Link2, Copy, Check, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type ServiceInfo = {
  name: string;
  price_amount: number | null;
  price_currency: string | null;
  duration_minutes: number | null;
};

type InviteStudentsCardProps = {
  username: string;
  tutorName: string;
  tagline?: string;
  services?: ServiceInfo[];
  className?: string;
};

function formatPrice(amount: number | null, currency: string | null): string {
  if (amount === null || amount === 0) return "Free";
  const currencyCode = currency?.toUpperCase() ?? "USD";
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  return formatter.format(amount / 100);
}

export function InviteStudentsCard({
  username,
  tutorName,
  tagline,
  services = [],
  className,
}: InviteStudentsCardProps) {
  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL ?? "https://tutorlingua.co";
  const bookingUrl = `${baseUrl}/book/${username}`;
  const displayUrl = bookingUrl.replace(/^https?:\/\//, "");

  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(bookingUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Book a lesson with ${tutorName}`,
          text: tagline || "Book your language lesson",
          url: bookingUrl,
        });
      } catch (error) {
        // User cancelled or share failed - fallback to copy
        if ((error as Error).name !== "AbortError") {
          handleCopy();
        }
      }
    } else {
      // Fallback to copy on desktop
      handleCopy();
    }
  };

  return (
    <div
      className={cn(
        "rounded-2xl border border-stone-200 bg-white p-5 sm:rounded-3xl sm:p-6",
        className
      )}
    >
      <div className="space-y-4">
        {/* Header with link */}
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Link2 className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Booking Link
            </p>
            <p className="truncate text-sm text-foreground">{displayUrl}</p>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-stone-100" />

        {/* Tutor info */}
        <div className="space-y-1">
          <p className="font-semibold text-foreground">{tutorName}</p>
          {tagline && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {tagline}
            </p>
          )}
        </div>

        {/* Services preview */}
        {services.length > 0 && (
          <div className="space-y-1.5">
            {services.slice(0, 2).map((service) => (
              <div
                key={service.name}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-muted-foreground">{service.name}</span>
                <span className="font-medium text-foreground">
                  {formatPrice(service.price_amount, service.price_currency)}
                </span>
              </div>
            ))}
            {services.length > 2 && (
              <p className="text-xs text-muted-foreground">
                +{services.length - 2} more service
                {services.length - 2 > 1 ? "s" : ""}
              </p>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 pt-1">
          <Button
            size="sm"
            variant={copied ? "ghost" : "outline"}
            onClick={handleCopy}
            className="flex-1"
          >
            {copied ? (
              <>
                <Check className="mr-1.5 h-4 w-4 text-green-600" />
                <span className="text-green-600">Copied</span>
              </>
            ) : (
              <>
                <Copy className="mr-1.5 h-4 w-4" />
                Copy Link
              </>
            )}
          </Button>
          <Button size="sm" variant="default" onClick={handleShare}>
            <Share2 className="mr-1.5 h-4 w-4" />
            Share
          </Button>
        </div>
      </div>
    </div>
  );
}
