"use client";

import { useState } from "react";
import { Copy, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

type BookingLinkCopyProps = {
  bookingUrl: string;
};

export function BookingLinkCopy({ bookingUrl }: BookingLinkCopyProps) {
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

  const handlePreview = () => {
    window.open(bookingUrl, "_blank", "noopener,noreferrer");
  };

  // Display a shorter version of the URL
  const displayUrl = bookingUrl.replace(/^https?:\/\//, "");

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">Your booking link</p>
      <div className="flex items-center gap-2">
        <div className="flex-1 truncate rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-foreground">
          {displayUrl}
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleCopy}
          className="shrink-0"
        >
          {copied ? (
            <>
              <Check className="mr-1.5 h-3.5 w-3.5 text-green-600" />
              <span className="text-green-600">Copied</span>
            </>
          ) : (
            <>
              <Copy className="mr-1.5 h-3.5 w-3.5" />
              Copy
            </>
          )}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={handlePreview}
          className="shrink-0"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          <span className="sr-only">Preview</span>
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Share with students from Preply, iTalki, or your social media.
      </p>
    </div>
  );
}
