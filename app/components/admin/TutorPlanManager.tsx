"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Crown,
  Plus,
  History,
  AlertCircle,
  CheckCircle,
  Loader2,
  XCircle,
} from "lucide-react";
import { format } from "date-fns";

interface PlanOverride {
  id: string;
  tutor_id: string;
  override_type: string;
  plan_name: string | null;
  original_plan: string | null;
  max_students: number | null;
  features_enabled: string[] | null;
  starts_at: string;
  expires_at: string | null;
  is_active: boolean;
  reason: string | null;
  notes: string | null;
  created_at: string;
  created_by_admin?: {
    id: string;
    email: string;
    full_name: string | null;
  } | null;
}

interface PlanHistory {
  id: string;
  tutor_id: string;
  previous_plan: string | null;
  new_plan: string | null;
  change_type: string;
  notes: string | null;
  created_at: string;
}

interface TutorPlanManagerProps {
  tutorId: string;
  currentPlan: string;
  onPlanChange?: () => void;
}

const PLAN_OPTIONS = [
  { value: "professional", label: "Legacy free", limit: 20 },
  { value: "growth", label: "All-access ($29/mo or $199/yr)", limit: "Unlimited" },
  { value: "studio", label: "Custom (legacy/enterprise)", limit: "Unlimited" },
];

const OVERRIDE_TYPES = [
  { value: "upgrade", label: "Upgrade Plan" },
  { value: "downgrade", label: "Downgrade Plan" },
  { value: "extend_trial", label: "Extend Trial" },
  { value: "custom_limit", label: "Custom Student Limit" },
  { value: "feature_grant", label: "Grant Feature Access" },
];

export function TutorPlanManager({
  tutorId,
  currentPlan,
  onPlanChange,
}: TutorPlanManagerProps) {
  const [overrides, setOverrides] = useState<PlanOverride[]>([]);
  const [history, setHistory] = useState<PlanHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [overrideType, setOverrideType] = useState("");
  const [planName, setPlanName] = useState("");
  const [maxStudents, setMaxStudents] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    fetchData();
  }, [tutorId]);

  async function fetchData() {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/plans?tutor_id=${tutorId}`);
      const data = await response.json();
      setOverrides(data.overrides || []);
      setHistory(data.history || []);
    } catch (error) {
      console.error("Failed to fetch plan data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    if (!overrideType) return;

    setSubmitting(true);
    try {
      const response = await fetch("/api/admin/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tutorId,
          overrideType,
          planName: planName || null,
          maxStudents: maxStudents ? parseInt(maxStudents) : null,
          expiresAt: expiresAt || null,
          reason,
          notes,
        }),
      });

      if (response.ok) {
        fetchData();
        setDialogOpen(false);
        resetForm();
        onPlanChange?.();
      }
    } catch (error) {
      console.error("Failed to create override:", error);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeactivate(overrideId: string) {
    try {
      const response = await fetch("/api/admin/plans", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          overrideId,
          action: "deactivate",
        }),
      });

      if (response.ok) {
        fetchData();
        onPlanChange?.();
      }
    } catch (error) {
      console.error("Failed to deactivate override:", error);
    }
  }

  function resetForm() {
    setOverrideType("");
    setPlanName("");
    setMaxStudents("");
    setExpiresAt("");
    setReason("");
    setNotes("");
  }

  const activeOverride = overrides.find((o) => o.is_active);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5" />
              Plan Management
            </CardTitle>
            <CardDescription>
              Manage subscription plan and overrides
            </CardDescription>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Override
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Plan Status */}
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div>
            <p className="text-sm text-muted-foreground">Current Plan</p>
            <p className="font-medium capitalize text-lg">{currentPlan}</p>
          </div>
          {activeOverride && (
            <Badge className="bg-purple-100 text-purple-800">
              Override Active
            </Badge>
          )}
        </div>

        {/* Active Overrides */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {activeOverride && (
              <div className="border rounded-lg p-4 border-purple-200 bg-purple-50/50">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="font-medium">Active Override</span>
                      <Badge variant="outline" className="capitalize">
                        {activeOverride.override_type.replace("_", " ")}
                      </Badge>
                    </div>
                    {activeOverride.plan_name && (
                      <p className="text-sm">
                        Plan: <span className="font-medium capitalize">{activeOverride.plan_name}</span>
                      </p>
                    )}
                    {activeOverride.max_students && (
                      <p className="text-sm">
                        Student Limit: <span className="font-medium">{activeOverride.max_students}</span>
                      </p>
                    )}
                    {activeOverride.expires_at && (
                      <p className="text-sm text-muted-foreground">
                        Expires: {format(new Date(activeOverride.expires_at), "MMM d, yyyy")}
                      </p>
                    )}
                    {activeOverride.reason && (
                      <p className="text-sm mt-2 text-muted-foreground italic">
                        &quot;{activeOverride.reason}&quot;
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDeactivate(activeOverride.id)}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Deactivate
                  </Button>
                </div>
              </div>
            )}

            {/* Plan History */}
            {history.length > 0 && (
              <div>
                <h4 className="font-medium flex items-center gap-2 mb-3">
                  <History className="h-4 w-4" />
                  Plan History
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between text-sm p-2 rounded bg-muted/30"
                    >
                      <div>
                        <span className="capitalize">{item.change_type.replace("_", " ")}</span>
                        {item.previous_plan && item.new_plan && item.previous_plan !== item.new_plan && (
                          <span className="text-muted-foreground ml-2">
                            {item.previous_plan} → {item.new_plan}
                          </span>
                        )}
                      </div>
                      <span className="text-muted-foreground">
                        {format(new Date(item.created_at), "MMM d, yyyy")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>

      {/* Add Override Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Plan Override</DialogTitle>
            <DialogDescription>
              Create a temporary or permanent plan modification for this tutor.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Override Type</Label>
              <Select value={overrideType} onValueChange={setOverrideType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {OVERRIDE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {(overrideType === "upgrade" || overrideType === "downgrade") && (
              <div className="space-y-2">
                <Label>Plan</Label>
                <Select value={planName} onValueChange={setPlanName}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {PLAN_OPTIONS.map((plan) => (
                      <SelectItem key={plan.value} value={plan.value}>
                        {plan.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {overrideType === "custom_limit" && (
              <div className="space-y-2">
                <Label>Max Students</Label>
                <Input
                  type="number"
                  value={maxStudents}
                  onChange={(e) => setMaxStudents(e.target.value)}
                  placeholder="e.g., 50"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Expires At (optional)</Label>
              <Input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Leave empty for permanent override
              </p>
            </div>

            <div className="space-y-2">
              <Label>Reason</Label>
              <Input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Why is this override being applied?"
              />
            </div>

            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting || !overrideType}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Override
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
