"use client";

import Link from "next/link";
import { Lock, Sparkles, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type LockedFeatureCardProps = {
  title: string;
  description: string;
  icon: LucideIcon;
  className?: string;
};

export function LockedFeatureCard({
  title,
  description,
  icon: Icon,
  className,
}: LockedFeatureCardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-purple-200 bg-gradient-to-br from-purple-50 to-white p-5 transition-transform hover:scale-[1.02]",
        className
      )}
    >
      <div className="absolute right-3 top-3">
        <Lock className="h-4 w-4 text-purple-300" />
      </div>
      <div className="mb-2 flex items-center gap-3">
        <div className="rounded-lg bg-purple-100 p-2">
          <Icon className="h-5 w-5 text-purple-600" />
        </div>
        <Badge className="border-0 bg-purple-100 text-xs text-purple-700">
          Studio
        </Badge>
      </div>
      <h4 className="font-semibold text-gray-900">{title}</h4>
      <p className="mt-1 text-sm text-gray-600">{description}</p>
      <Link
        href="/settings/billing?upgrade=studio"
        className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-purple-600 hover:text-purple-800"
      >
        <Sparkles className="h-3.5 w-3.5" />
        Unlock with Studio
      </Link>
    </div>
  );
}
