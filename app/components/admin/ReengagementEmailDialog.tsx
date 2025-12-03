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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Mail, Clock, AlertCircle, CheckCircle2 } from "lucide-react";

interface Tutor {
  id: string;
  email: string;
  full_name: string | null;
  last_login_at: string | null;
}

interface ReengagementEmailDialogProps {
  tutor: Tutor | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

type TemplateId = "friendly_checkin" | "feature_highlight" | "account_status";

const templates: { id: TemplateId; label: string; description: string }[] = [
  {
    id: "friendly_checkin",
    label: "Friendly Check-in",
    description: "Soft, welcoming tone — \"We miss you at TutorLingua!\"",
  },
  {
    id: "feature_highlight",
    label: "Feature Highlight",
    description: "Value-focused — \"New features waiting for you\"",
  },
  {
    id: "account_status",
    label: "Account Status",
    description: "Urgent tone — \"Your account needs attention\"",
  },
];

function formatRelativeTime(dateString: string | null): string {
  if (!dateString) return "Never";

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

export function ReengagementEmailDialog({
  tutor,
  open,
  onOpenChange,
  onSuccess,
}: ReengagementEmailDialogProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>("friendly_checkin");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [cooldownInfo, setCooldownInfo] = useState<{
    isInCooldown: boolean;
    cooldownRemaining: number;
    lastTemplateId?: string;
    lastSentAt?: string;
  } | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Fetch email history when dialog opens
  useEffect(() => {
    if (open && tutor) {
      setLoadingHistory(true);
      setError(null);
      setSuccess(false);
      setCooldownInfo(null);

      fetch(`/api/admin/tutors/reengagement?tutorId=${tutor.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.error) {
            setError(data.error);
          } else {
            setCooldownInfo({
              isInCooldown: data.isInCooldown,
              cooldownRemaining: data.cooldownRemaining,
              lastTemplateId: data.emails?.[0]?.template_id,
              lastSentAt: data.emails?.[0]?.sent_at,
            });
          }
        })
        .catch(() => {
          setError("Failed to load email history");
        })
        .finally(() => {
          setLoadingHistory(false);
        });
    }
  }, [open, tutor]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedTemplate("friendly_checkin");
      setError(null);
      setSuccess(false);
      setCooldownInfo(null);
    }
  }, [open]);

  async function handleSend() {
    if (!tutor) return;

    setSending(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch("/api/admin/tutors/reengagement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tutorId: tutor.id,
          templateId: selectedTemplate,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to send email");
        if (data.cooldownRemaining) {
          setCooldownInfo({
            isInCooldown: true,
            cooldownRemaining: data.cooldownRemaining,
            lastTemplateId: data.lastTemplateId,
            lastSentAt: data.lastSentAt,
          });
        }
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onOpenChange(false);
      }, 1500);
    } catch {
      setError("Failed to send email. Please try again.");
    } finally {
      setSending(false);
    }
  }

  if (!tutor) return null;

  const daysSinceLogin = tutor.last_login_at
    ? Math.floor(
        (Date.now() - new Date(tutor.last_login_at).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : null;

  const selectedTemplateInfo = templates.find((t) => t.id === selectedTemplate);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Send Re-engagement Email
          </DialogTitle>
          <DialogDescription>
            Send a re-engagement email to encourage this tutor to return.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Success Message */}
          {success && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <p className="text-sm font-medium text-green-800">
                  Email sent successfully!
                </p>
              </div>
            </div>
          )}

          {/* Tutor Info */}
          <div className="rounded-lg bg-muted/50 p-3">
            <div className="font-medium">{tutor.full_name || "No name"}</div>
            <div className="text-sm text-muted-foreground">{tutor.email}</div>
            <div className="mt-2 flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>
                Last login:{" "}
                <span className="font-medium">
                  {formatRelativeTime(tutor.last_login_at)}
                </span>
                {daysSinceLogin !== null && daysSinceLogin >= 14 && (
                  <Badge variant="secondary" className="ml-2 bg-amber-100 text-amber-700">
                    {daysSinceLogin} days inactive
                  </Badge>
                )}
              </span>
            </div>
          </div>

          {/* Cooldown Warning */}
          {cooldownInfo?.isInCooldown && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800">
                    Cooldown Active
                  </p>
                  <p className="text-sm text-amber-700">
                    A re-engagement email was sent{" "}
                    {cooldownInfo.lastSentAt
                      ? formatRelativeTime(cooldownInfo.lastSentAt)
                      : "recently"}
                    . Please wait {cooldownInfo.cooldownRemaining} more day(s)
                    before sending another.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Template Selection */}
          <div className="space-y-3">
            <Label>Select Email Template</Label>
            <Select
              value={selectedTemplate}
              onValueChange={(value) => setSelectedTemplate(value as TemplateId)}
              disabled={sending || cooldownInfo?.isInCooldown || success}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a template" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedTemplateInfo && (
              <p className="text-sm text-muted-foreground">
                {selectedTemplateInfo.description}
              </p>
            )}
          </div>

          {/* Error Message */}
          {error && !cooldownInfo?.isInCooldown && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={sending}
          >
            {success ? "Close" : "Cancel"}
          </Button>
          {!success && (
            <Button
              onClick={handleSend}
              disabled={sending || loadingHistory || cooldownInfo?.isInCooldown}
            >
              {sending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Send Email
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
