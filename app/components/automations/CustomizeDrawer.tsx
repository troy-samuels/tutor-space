"use client";

import { useState, useEffect, useTransition } from "react";
import { X, Loader2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetOverlay } from "@/components/ui/sheet";
import {
  updateAutomationRuleById,
  deleteAutomationRuleById,
  getStudentsForSelector,
} from "@/lib/actions/automations";
import type { AutomationRule, TriggerSettings, AutomationTriggerType } from "@/lib/actions/automations";

// Trigger-specific settings configuration
const TRIGGER_SETTINGS_CONFIG: Record<
  AutomationTriggerType,
  {
    fields: { key: keyof TriggerSettings; label: string; type: "number"; unit?: string }[];
    colorClass: string;
  }
> = {
  lesson_completed: {
    fields: [
      { key: "cooldown_hours", label: "Cooldown", type: "number", unit: "hours" },
    ],
    colorClass: "amber",
  },
  student_inactive: {
    fields: [
      { key: "days_inactive", label: "Days of inactivity", type: "number", unit: "days" },
      { key: "cooldown_hours", label: "Cooldown", type: "number", unit: "hours" },
    ],
    colorClass: "indigo",
  },
  package_low_balance: {
    fields: [
      { key: "threshold_minutes", label: "Alert threshold", type: "number", unit: "minutes" },
      { key: "cooldown_hours", label: "Cooldown", type: "number", unit: "hours" },
    ],
    colorClass: "emerald",
  },
  trial_completed_no_purchase: {
    fields: [
      { key: "delay_hours", label: "Delay before sending", type: "number", unit: "hours" },
      { key: "cooldown_hours", label: "Cooldown", type: "number", unit: "hours" },
    ],
    colorClass: "purple",
  },
};

interface CustomizeDrawerProps {
  open: boolean;
  onClose: () => void;
  rule: AutomationRule | null;
  onUpdated: (rule: AutomationRule) => void;
  onDeleted: () => void;
}

export function CustomizeDrawer({
  open,
  onClose,
  rule,
  onUpdated,
  onDeleted,
}: CustomizeDrawerProps) {
  const [audienceType, setAudienceType] = useState<"all_students" | "specific_student">(
    rule?.audience_type || "all_students"
  );
  const [targetStudentId, setTargetStudentId] = useState<string | null>(
    rule?.target_student_id || null
  );
  const [messageBody, setMessageBody] = useState(rule?.message_body || "");
  const [triggerSettings, setTriggerSettings] = useState<TriggerSettings>(
    rule?.trigger_settings || {}
  );
  const [students, setStudents] = useState<{ id: string; full_name: string | null }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();

  const triggerType = rule?.trigger_type || "lesson_completed";
  const settingsConfig = TRIGGER_SETTINGS_CONFIG[triggerType];
  const colorClass = settingsConfig?.colorClass || "amber";

  // Load students for selector
  useEffect(() => {
    if (open && audienceType === "specific_student") {
      getStudentsForSelector().then(setStudents);
    }
  }, [open, audienceType]);

  // Sync state when rule changes
  useEffect(() => {
    if (rule) {
      setAudienceType(rule.audience_type);
      setTargetStudentId(rule.target_student_id);
      setMessageBody(rule.message_body);
      setTriggerSettings(rule.trigger_settings || {});
    }
  }, [rule]);

  const handleSave = () => {
    if (!rule) return;

    setError(null);
    startTransition(async () => {
      const result = await updateAutomationRuleById(rule.id, {
        message_body: messageBody,
        audience_type: audienceType,
        target_student_id: audienceType === "specific_student" ? targetStudentId : null,
        trigger_settings: triggerSettings,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      if (result.rule) {
        onUpdated(result.rule);
      }
    });
  };

  const handleDelete = () => {
    if (!rule) return;
    if (!confirm("Are you sure you want to delete this automation rule?")) {
      return;
    }

    startDeleteTransition(async () => {
      const result = await deleteAutomationRuleById(rule.id);
      if (result.error) {
        setError(result.error);
        return;
      }
      onDeleted();
    });
  };

  const handleClose = () => {
    setError(null);
    onClose();
  };

  const updateTriggerSetting = (key: keyof TriggerSettings, value: number) => {
    setTriggerSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Sheet open={open} onOpenChange={handleClose} side="right">
      <SheetOverlay onClick={handleClose} />
      <SheetContent className="w-full max-w-md p-0 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Customize rule</h2>
          <button
            onClick={handleClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Audience selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Audience
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="audience"
                  value="all_students"
                  checked={audienceType === "all_students"}
                  onChange={() => setAudienceType("all_students")}
                  className={cn(
                    "h-4 w-4 border-gray-300",
                    `text-${colorClass}-500 focus:ring-${colorClass}-500`
                  )}
                />
                <span className="text-sm text-gray-700">All students</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="audience"
                  value="specific_student"
                  checked={audienceType === "specific_student"}
                  onChange={() => setAudienceType("specific_student")}
                  className={cn(
                    "h-4 w-4 border-gray-300",
                    `text-${colorClass}-500 focus:ring-${colorClass}-500`
                  )}
                />
                <span className="text-sm text-gray-700">Specific student</span>
              </label>
            </div>

            {/* Student selector */}
            {audienceType === "specific_student" && (
              <div className="mt-3">
                <select
                  value={targetStudentId || ""}
                  onChange={(e) => setTargetStudentId(e.target.value || null)}
                  className={cn(
                    "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm",
                    "focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  )}
                >
                  <option value="">Select a student...</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.full_name || "Unnamed student"}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Trigger Settings */}
          {settingsConfig && settingsConfig.fields.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Settings
              </label>
              <div className="space-y-3">
                {settingsConfig.fields.map((field) => (
                  <div key={field.key} className="flex items-center gap-3">
                    <label
                      htmlFor={`setting-${field.key}`}
                      className="flex-1 text-sm text-gray-700"
                    >
                      {field.label}
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        id={`setting-${field.key}`}
                        type="number"
                        min="1"
                        value={(triggerSettings[field.key] as number) || ""}
                        onChange={(e) =>
                          updateTriggerSetting(field.key, parseInt(e.target.value, 10) || 0)
                        }
                        className={cn(
                          "w-20 rounded-lg border border-gray-200 px-2 py-1.5 text-sm text-right",
                          `focus:border-${colorClass}-500 focus:ring-1 focus:ring-${colorClass}-500`
                        )}
                      />
                      {field.unit && (
                        <span className="text-sm text-gray-500 w-12">{field.unit}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Message body */}
          <div>
            <label
              htmlFor="message-body"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Message
            </label>
            <textarea
              id="message-body"
              rows={4}
              value={messageBody}
              onChange={(e) => setMessageBody(e.target.value)}
              className={cn(
                "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm",
                `focus:border-${colorClass}-500 focus:ring-1 focus:ring-${colorClass}-500`,
                "resize-none"
              )}
              placeholder="Type your message..."
            />
            <div className="mt-1.5 text-xs text-gray-500 space-y-1">
              <p>Available variables:</p>
              <ul className="ml-2 space-y-0.5">
                <li><code className="bg-gray-100 px-1 rounded">{"{{student_name}}"}</code> - Student&apos;s name</li>
                <li><code className="bg-gray-100 px-1 rounded">{"{{tutor_name}}"}</code> - Your name</li>
                {triggerType === "student_inactive" && (
                  <li><code className="bg-gray-100 px-1 rounded">{"{{lesson_date}}"}</code> - Last lesson date</li>
                )}
                {triggerType === "package_low_balance" && (
                  <li><code className="bg-gray-100 px-1 rounded">{"{{package_remaining}}"}</code> - Minutes left</li>
                )}
                <li><code className="bg-gray-100 px-1 rounded">{"{{booking_link}}"}</code> - Your booking link</li>
              </ul>
            </div>
          </div>

          {/* Danger zone */}
          <div className="border-t border-gray-200 pt-6">
            <p className="text-sm font-medium text-gray-700 mb-3">Danger zone</p>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium",
                "text-red-600 hover:bg-red-50",
                "border border-red-200",
                "focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-offset-2",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "transition-colors"
              )}
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Delete rule
            </button>
          </div>

          {/* Error message */}
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
          <button
            onClick={handleClose}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-medium",
              "text-gray-700 hover:bg-gray-50",
              "border border-gray-200",
              "transition-colors"
            )}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isPending || !messageBody.trim()}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium",
              "text-white shadow-sm",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "transition-colors",
              colorClass === "amber" && "bg-amber-500 hover:bg-amber-600 focus:ring-amber-500",
              colorClass === "indigo" && "bg-indigo-500 hover:bg-indigo-600 focus:ring-indigo-500",
              colorClass === "emerald" && "bg-emerald-500 hover:bg-emerald-600 focus:ring-emerald-500",
              colorClass === "purple" && "bg-purple-500 hover:bg-purple-600 focus:ring-purple-500",
              "focus:outline-none focus:ring-2 focus:ring-offset-2"
            )}
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Save
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
