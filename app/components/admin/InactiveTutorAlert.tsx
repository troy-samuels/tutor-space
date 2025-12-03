"use client";

import { AlertTriangle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface InactiveTutorAlertProps {
  count: number;
  onViewClick: () => void;
}

export function InactiveTutorAlert({ count, onViewClick }: InactiveTutorAlertProps) {
  if (count === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h3 className="font-semibold text-amber-900">
              Tutor Inactivity Alert
            </h3>
            <p className="text-sm text-amber-700">
              {count} {count === 1 ? "tutor has" : "tutors have"} not logged in
              for 14+ days
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onViewClick}
          className="border-amber-300 bg-white text-amber-700 hover:bg-amber-100 hover:text-amber-800"
        >
          View Inactive Tutors
          <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
