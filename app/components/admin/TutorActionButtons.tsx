"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Ban,
  CheckCircle,
  XCircle,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

type AccountStatus = "active" | "suspended" | "deactivated" | "pending_review";

interface TutorActionButtonsProps {
  tutorId: string;
  currentStatus: AccountStatus;
  tutorName: string;
  onStatusChange?: (newStatus: AccountStatus) => void;
}

export function TutorActionButtons({
  tutorId,
  currentStatus,
  tutorName,
  onStatusChange,
}: TutorActionButtonsProps) {
  const [dialogType, setDialogType] = useState<"suspend" | "reactivate" | "deactivate" | null>(null);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAction = async () => {
    if (!dialogType) return;

    setLoading(true);
    setError(null);

    const statusMap: Record<string, AccountStatus> = {
      suspend: "suspended",
      reactivate: "active",
      deactivate: "deactivated",
    };

    try {
      const response = await fetch(`/api/admin/tutors/${tutorId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: statusMap[dialogType],
          reason: reason.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update status");
      }

      onStatusChange?.(statusMap[dialogType]);
      setDialogType(null);
      setReason("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const closeDialog = () => {
    setDialogType(null);
    setReason("");
    setError(null);
  };

  return (
    <>
      <div className="flex items-center gap-2">
        {currentStatus === "active" && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDialogType("suspend")}
              className="text-yellow-600 border-yellow-300 hover:bg-yellow-50"
            >
              <Ban className="mr-2 h-4 w-4" />
              Suspend
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDialogType("deactivate")}
              className="text-red-600 border-red-300 hover:bg-red-50"
            >
              <XCircle className="mr-2 h-4 w-4" />
              Deactivate
            </Button>
          </>
        )}

        {currentStatus === "suspended" && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDialogType("reactivate")}
              className="text-green-600 border-green-300 hover:bg-green-50"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Reactivate
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDialogType("deactivate")}
              className="text-red-600 border-red-300 hover:bg-red-50"
            >
              <XCircle className="mr-2 h-4 w-4" />
              Deactivate
            </Button>
          </>
        )}

        {currentStatus === "deactivated" && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDialogType("reactivate")}
            className="text-green-600 border-green-300 hover:bg-green-50"
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Reactivate
          </Button>
        )}

        {currentStatus === "pending_review" && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDialogType("reactivate")}
              className="text-green-600 border-green-300 hover:bg-green-50"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Approve
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDialogType("suspend")}
              className="text-yellow-600 border-yellow-300 hover:bg-yellow-50"
            >
              <Ban className="mr-2 h-4 w-4" />
              Suspend
            </Button>
          </>
        )}
      </div>

      {/* Suspend Dialog */}
      <AlertDialog open={dialogType === "suspend"} onOpenChange={(open) => !open && closeDialog()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Ban className="h-5 w-5 text-yellow-600" />
              Suspend Tutor Account
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to suspend <strong>{tutorName}</strong>&apos;s account?
              They will be unable to access their dashboard, accept bookings, or communicate with students.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-2 py-4">
            <Label htmlFor="suspend-reason">Reason (optional)</Label>
            <Textarea
              id="suspend-reason"
              placeholder="Enter the reason for suspension..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              This reason will be included in the notification email to the tutor.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              {error}
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleAction();
              }}
              disabled={loading}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Suspending...
                </>
              ) : (
                "Suspend Account"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reactivate Dialog */}
      <AlertDialog open={dialogType === "reactivate"} onOpenChange={(open) => !open && closeDialog()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Reactivate Tutor Account
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reactivate <strong>{tutorName}</strong>&apos;s account?
              They will regain full access to their dashboard and be able to accept bookings.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm flex items-center gap-2 my-4">
              <AlertTriangle className="h-4 w-4" />
              {error}
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleAction();
              }}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Reactivating...
                </>
              ) : (
                "Reactivate Account"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Deactivate Dialog */}
      <AlertDialog open={dialogType === "deactivate"} onOpenChange={(open) => !open && closeDialog()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              Deactivate Tutor Account
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate <strong>{tutorName}</strong>&apos;s account?
              This is a more permanent action than suspension. The tutor will need to contact support to reactivate.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-2 py-4">
            <Label htmlFor="deactivate-reason">Reason (optional)</Label>
            <Textarea
              id="deactivate-reason"
              placeholder="Enter the reason for deactivation..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              {error}
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleAction();
              }}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deactivating...
                </>
              ) : (
                "Deactivate Account"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function AccountStatusBadge({ status }: { status: AccountStatus }) {
  const statusStyles: Record<AccountStatus, { bg: string; text: string; label: string }> = {
    active: { bg: "bg-green-100", text: "text-green-700", label: "Active" },
    suspended: { bg: "bg-yellow-100", text: "text-yellow-700", label: "Suspended" },
    deactivated: { bg: "bg-red-100", text: "text-red-700", label: "Deactivated" },
    pending_review: { bg: "bg-blue-100", text: "text-blue-700", label: "Pending Review" },
  };

  const style = statusStyles[status] || statusStyles.active;

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        style.bg,
        style.text
      )}
    >
      {style.label}
    </span>
  );
}
