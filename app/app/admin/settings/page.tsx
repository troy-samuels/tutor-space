"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Settings,
  DollarSign,
  ToggleLeft,
  Gauge,
  Bell,
  AlertCircle,
  Save,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfigEntry {
  key: string;
  value: unknown;
  description: string | null;
  category: "general" | "payments" | "features" | "limits" | "notifications";
  updated_at: string;
}

type ConfigState = Record<string, unknown>;

const categoryInfo: Record<string, { title: string; description: string; icon: React.ElementType }> = {
  general: {
    title: "General Settings",
    description: "Core platform settings and access control",
    icon: Settings,
  },
  payments: {
    title: "Payment Settings",
    description: "Stripe, fees, and currency configuration",
    icon: DollarSign,
  },
  features: {
    title: "Feature Flags",
    description: "Enable or disable platform features",
    icon: ToggleLeft,
  },
  limits: {
    title: "Plan Limits",
    description: "Student and service limits per plan",
    icon: Gauge,
  },
  notifications: {
    title: "Notification Settings",
    description: "Email and reminder configuration",
    icon: Bell,
  },
};

function ConfigSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center justify-between py-3 border-b">
          <div className="space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-64" />
          </div>
          <Skeleton className="h-6 w-12" />
        </div>
      ))}
    </div>
  );
}

function BooleanConfigItem({
  configKey,
  description,
  value,
  onChange,
  disabled,
}: {
  configKey: string;
  description: string | null;
  value: boolean;
  onChange: (key: string, value: boolean) => void;
  disabled?: boolean;
}) {
  const label = configKey
    .replace(/_/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());

  return (
    <div className="flex items-center justify-between py-3 border-b last:border-0">
      <div className="space-y-0.5">
        <Label htmlFor={configKey} className="text-sm font-medium">
          {label}
        </Label>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      <Switch
        id={configKey}
        checked={value}
        onCheckedChange={(checked) => onChange(configKey, checked)}
        disabled={disabled}
      />
    </div>
  );
}

function NumberConfigItem({
  configKey,
  description,
  value,
  onChange,
  disabled,
  min = 0,
  max,
}: {
  configKey: string;
  description: string | null;
  value: number;
  onChange: (key: string, value: number) => void;
  disabled?: boolean;
  min?: number;
  max?: number;
}) {
  const label = configKey
    .replace(/_/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());

  return (
    <div className="flex items-center justify-between py-3 border-b last:border-0">
      <div className="space-y-0.5 flex-1">
        <Label htmlFor={configKey} className="text-sm font-medium">
          {label}
        </Label>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      <Input
        id={configKey}
        type="number"
        value={value}
        onChange={(e) => onChange(configKey, parseInt(e.target.value) || 0)}
        disabled={disabled}
        min={min}
        max={max}
        className="w-24 text-right"
      />
    </div>
  );
}

function StringConfigItem({
  configKey,
  description,
  value,
  onChange,
  disabled,
}: {
  configKey: string;
  description: string | null;
  value: string;
  onChange: (key: string, value: string) => void;
  disabled?: boolean;
}) {
  const label = configKey
    .replace(/_/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());

  return (
    <div className="flex items-center justify-between py-3 border-b last:border-0">
      <div className="space-y-0.5 flex-1 mr-4">
        <Label htmlFor={configKey} className="text-sm font-medium">
          {label}
        </Label>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      <Input
        id={configKey}
        type="text"
        value={value}
        onChange={(e) => onChange(configKey, e.target.value)}
        disabled={disabled}
        className="w-48"
      />
    </div>
  );
}

function ArrayConfigItem({
  configKey,
  description,
  value,
  onChange,
  disabled,
}: {
  configKey: string;
  description: string | null;
  value: string[];
  onChange: (key: string, value: string[]) => void;
  disabled?: boolean;
}) {
  const label = configKey
    .replace(/_/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());

  return (
    <div className="py-3 border-b last:border-0">
      <div className="space-y-0.5 mb-2">
        <Label htmlFor={configKey} className="text-sm font-medium">
          {label}
        </Label>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      <Input
        id={configKey}
        type="text"
        value={value.join(", ")}
        onChange={(e) =>
          onChange(
            configKey,
            e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
          )
        }
        disabled={disabled}
        placeholder="Comma-separated values"
        className="w-full"
      />
    </div>
  );
}

function ConfigCategory({
  category,
  entries,
  values,
  onChange,
  saving,
}: {
  category: string;
  entries: ConfigEntry[];
  values: ConfigState;
  onChange: (key: string, value: unknown) => void;
  saving: boolean;
}) {
  const info = categoryInfo[category];
  const Icon = info?.icon || Settings;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Icon className="h-5 w-5" />
          {info?.title || category}
        </CardTitle>
        <CardDescription>{info?.description}</CardDescription>
      </CardHeader>
      <CardContent>
        {entries.map((entry) => {
          const value = values[entry.key] ?? entry.value;

          if (typeof value === "boolean") {
            return (
              <BooleanConfigItem
                key={entry.key}
                configKey={entry.key}
                description={entry.description}
                value={value}
                onChange={(k, v) => onChange(k, v)}
                disabled={saving}
              />
            );
          }

          if (typeof value === "number") {
            return (
              <NumberConfigItem
                key={entry.key}
                configKey={entry.key}
                description={entry.description}
                value={value}
                onChange={(k, v) => onChange(k, v)}
                disabled={saving}
              />
            );
          }

          if (Array.isArray(value)) {
            return (
              <ArrayConfigItem
                key={entry.key}
                configKey={entry.key}
                description={entry.description}
                value={value as string[]}
                onChange={(k, v) => onChange(k, v)}
                disabled={saving}
              />
            );
          }

          // Default to string
          return (
            <StringConfigItem
              key={entry.key}
              configKey={entry.key}
              description={entry.description}
              value={String(value)}
              onChange={(k, v) => onChange(k, v)}
              disabled={saving}
            />
          );
        })}
      </CardContent>
    </Card>
  );
}

export default function AdminSettingsPage() {
  const [config, setConfig] = useState<ConfigEntry[]>([]);
  const [values, setValues] = useState<ConfigState>({});
  const [originalValues, setOriginalValues] = useState<ConfigState>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function fetchConfig() {
      try {
        const response = await fetch("/api/admin/config");
        if (!response.ok) {
          throw new Error("Failed to fetch configuration");
        }
        const data = await response.json();
        setConfig(data.config);

        // Initialize values from config
        const initialValues: ConfigState = {};
        for (const entry of data.config) {
          initialValues[entry.key] = entry.value;
        }
        setValues(initialValues);
        setOriginalValues(initialValues);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchConfig();
  }, []);

  const handleChange = (key: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setSuccess(false);
  };

  const hasChanges = () => {
    for (const key of Object.keys(values)) {
      if (JSON.stringify(values[key]) !== JSON.stringify(originalValues[key])) {
        return true;
      }
    }
    return false;
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      // Find changed values
      const updates: Array<{ key: string; value: unknown }> = [];
      for (const key of Object.keys(values)) {
        if (JSON.stringify(values[key]) !== JSON.stringify(originalValues[key])) {
          updates.push({ key, value: values[key] });
        }
      }

      if (updates.length === 0) {
        setSuccess(true);
        return;
      }

      const response = await fetch("/api/admin/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save configuration");
      }

      setOriginalValues({ ...values });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setValues({ ...originalValues });
    setSuccess(false);
    setError(null);
  };

  // Group config by category
  const configByCategory = config.reduce(
    (acc, entry) => {
      if (!acc[entry.category]) {
        acc[entry.category] = [];
      }
      acc[entry.category].push(entry);
      return acc;
    },
    {} as Record<string, ConfigEntry[]>
  );

  const categories = Object.keys(configByCategory);

  if (error && loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Platform Settings</h1>
          <p className="text-muted-foreground">
            Configure platform-wide settings, feature flags, and limits
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges() && (
            <Button variant="outline" onClick={handleReset} disabled={saving}>
              Reset
            </Button>
          )}
          <Button
            onClick={handleSave}
            disabled={saving || !hasChanges()}
            className={cn(success && "bg-green-600 hover:bg-green-700")}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : success ? (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Saved
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      {error && !loading && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-6">
          <ConfigSkeleton />
          <ConfigSkeleton />
        </div>
      ) : (
        <Tabs defaultValue={categories[0]} className="space-y-4">
          <TabsList>
            {categories.map((category) => {
              const info = categoryInfo[category];
              const Icon = info?.icon || Settings;
              return (
                <TabsTrigger key={category} value={category} className="gap-2">
                  <Icon className="h-4 w-4" />
                  {info?.title || category}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {categories.map((category) => (
            <TabsContent key={category} value={category}>
              <ConfigCategory
                category={category}
                entries={configByCategory[category]}
                values={values}
                onChange={handleChange}
                saving={saving}
              />
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}
