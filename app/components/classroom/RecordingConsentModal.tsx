"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Mic, AlertCircle } from "lucide-react";

interface RecordingConsentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (rememberChoice: boolean) => void;
  onCancel: () => void;
}

const CONSENT_STORAGE_KEY = "classroom_recording_consent";

export function RecordingConsentModal({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
}: RecordingConsentModalProps) {
  const [rememberChoice, setRememberChoice] = useState(false);

  const handleConfirm = () => {
    onConfirm(rememberChoice);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-3xl">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-red-50 flex items-center justify-center">
            <Mic className="h-6 w-6 text-red-500" />
          </div>
          <DialogTitle className="text-xl">Record this lesson?</DialogTitle>
          <DialogDescription className="text-muted-foreground pt-2">
            Recording will capture audio from all participants. The
            recording can be used to generate transcripts and practice materials.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl border border-amber-100">
          <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
          <p className="text-sm text-amber-800">
            The student will see a recording indicator and be notified that the
            session is being recorded.
          </p>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <Checkbox
            id="remember"
            checked={rememberChoice}
            onCheckedChange={(checked) => setRememberChoice(checked === true)}
          />
          <label
            htmlFor="remember"
            className="text-sm text-muted-foreground cursor-pointer"
          >
            Don&apos;t ask me again
          </label>
        </div>

        <DialogFooter className="flex gap-3 sm:gap-3 pt-2">
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1 rounded-full"
          >
            Not now
          </Button>
          <Button onClick={handleConfirm} className="flex-1 rounded-full">
            Start Recording
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Hook to check if consent is already given
export function useRecordingConsent() {
  const [hasConsent, setHasConsent] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
    setHasConsent(stored === "true");
  }, []);

  const rememberConsent = () => {
    localStorage.setItem(CONSENT_STORAGE_KEY, "true");
    setHasConsent(true);
  };

  const resetConsent = () => {
    localStorage.removeItem(CONSENT_STORAGE_KEY);
    setHasConsent(false);
  };

  return { hasConsent, rememberConsent, resetConsent };
}
