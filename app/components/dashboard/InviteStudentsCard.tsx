"use client";

import { useEffect, useRef, useState } from "react";
import {
  Link2,
  Copy,
  Check,
  Share2,
  Globe,
  CalendarPlus,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ServiceInfo = {
  id?: string;
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
  const siteUrl = `${baseUrl}/${username}`;
  const displayUrl = bookingUrl.replace(/^https?:\/\//, "");

  const [copiedItem, setCopiedItem] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; tone: "success" | "warning" } | null>(
    null
  );
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  const showToast = (message: string, tone: "success" | "warning" = "success") => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToast({ message, tone });
    toastTimeoutRef.current = setTimeout(() => setToast(null), 2400);
  };

  const handleCopy = async (url: string, itemId: string) => {
    if (!navigator.clipboard?.writeText) {
      showToast("Copy unavailable. Please copy manually.", "warning");
      return false;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopiedItem(itemId);
      setTimeout(() => setCopiedItem(null), 2000);
      return true;
    } catch (error) {
      console.error("Failed to copy:", error);
      showToast("Couldn't copy. Please try again.", "warning");
      return false;
    }
  };

  const handleShare = async (url: string, title: string, text: string) => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          const copied = await handleCopy(url, "share-fallback");
          if (copied) {
            showToast("Share unavailable. Link copied.");
          }
        }
      }
    } else {
      const copied = await handleCopy(url, "share-fallback");
      if (copied) {
        showToast("Share unavailable. Link copied.");
      }
    }
  };

  const getServiceUrl = (serviceId: string) => `${bookingUrl}?service=${serviceId}`;

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
                key={service.id ?? service.name}
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

        {/* Action buttons with dropdown */}
        <div className="flex gap-2 pt-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                variant="outline"
                aria-label={copiedItem ? "Copied" : "Copy link options"}
                title={copiedItem ? "Copied" : "Copy link options"}
              >
                {copiedItem ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 max-h-72 overflow-y-auto">
              <DropdownMenuItem onClick={() => handleCopy(bookingUrl, "booking")}>
                <CalendarPlus className="mr-2 h-4 w-4" />
                <div className="flex flex-col">
                  <span>Booking page</span>
                  <span className="text-xs text-muted-foreground">/book/{username}</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleCopy(siteUrl, "site")}>
                <Globe className="mr-2 h-4 w-4" />
                <div className="flex flex-col">
                  <span>Public site</span>
                  <span className="text-xs text-muted-foreground">/{username}</span>
                </div>
              </DropdownMenuItem>
              {services.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                    Service links
                  </div>
                  {services.map((service) => (
                    <DropdownMenuItem
                      key={service.id ?? service.name}
                      onClick={() => handleCopy(getServiceUrl(service.id ?? ""), `service-${service.id}`)}
                      disabled={!service.id}
                    >
                      <Link2 className="mr-2 h-4 w-4" />
                      <span className="truncate">{service.name}</span>
                    </DropdownMenuItem>
                  ))}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                variant="default"
                aria-label="Share link options"
                title="Share link options"
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 max-h-72 overflow-y-auto">
              <DropdownMenuItem
                onClick={() =>
                  handleShare(
                    bookingUrl,
                    `Book a lesson with ${tutorName}`,
                    tagline || "Book your language lesson"
                  )
                }
              >
                <CalendarPlus className="mr-2 h-4 w-4" />
                <span>Share booking page</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleShare(siteUrl, tutorName, tagline || "Language tutor")}
              >
                <Globe className="mr-2 h-4 w-4" />
                <span>Share public site</span>
              </DropdownMenuItem>
              {services.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                    Service links
                  </div>
                  {services.map((service) => (
                    <DropdownMenuItem
                      key={service.id ?? service.name}
                      onClick={() =>
                        handleShare(
                          getServiceUrl(service.id ?? ""),
                          `Book ${service.name} with ${tutorName}`,
                          tagline || "Book your language lesson"
                        )
                      }
                      disabled={!service.id}
                    >
                      <Link2 className="mr-2 h-4 w-4" />
                      <span className="truncate">{service.name}</span>
                    </DropdownMenuItem>
                  ))}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {toast && (
          <div
            className={cn(
              "flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium",
              toast.tone === "warning"
                ? "border-amber-200 bg-amber-50 text-amber-900"
                : "border-emerald-200 bg-emerald-50 text-emerald-900"
            )}
            role="status"
            aria-live="polite"
          >
            {toast.tone === "warning" ? (
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
            ) : (
              <Check className="h-3.5 w-3.5 text-emerald-600" />
            )}
            <span>{toast.message}</span>
          </div>
        )}
      </div>
    </div>
  );
}
