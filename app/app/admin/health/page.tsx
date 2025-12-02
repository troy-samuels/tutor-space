"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Activity,
  CheckCircle,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Loader2,
  Clock,
  Zap,
  AlertCircle,
  Database,
  CreditCard,
  Mail,
  HardDrive,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ServiceStatus {
  id: string;
  status: "operational" | "degraded" | "outage" | "unknown";
  message: string | null;
  last_check_at: string | null;
  last_error: string | null;
  consecutive_failures: number;
}

interface HealthData {
  overall_status: "operational" | "degraded" | "outage";
  services: ServiceStatus[];
  last_check: string;
  error_count_24h: number;
  metrics_summary: {
    api_requests_24h: number;
    avg_response_time_ms: number;
    error_rate_percent: number;
  };
}

const serviceIcons: Record<string, React.ElementType> = {
  database: Database,
  stripe: CreditCard,
  resend: Mail,
  storage: HardDrive,
  google_calendar: Calendar,
  outlook_calendar: Calendar,
};

const serviceLabels: Record<string, string> = {
  database: "Database",
  stripe: "Stripe Payments",
  resend: "Email (Resend)",
  storage: "File Storage",
  google_calendar: "Google Calendar",
  outlook_calendar: "Outlook Calendar",
};

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case "operational":
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case "degraded":
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    case "outage":
      return <XCircle className="h-5 w-5 text-red-500" />;
    default:
      return <AlertCircle className="h-5 w-5 text-gray-400" />;
  }
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, { bg: string; text: string }> = {
    operational: { bg: "bg-green-100", text: "text-green-700" },
    degraded: { bg: "bg-yellow-100", text: "text-yellow-700" },
    outage: { bg: "bg-red-100", text: "text-red-700" },
    unknown: { bg: "bg-gray-100", text: "text-gray-700" },
  };

  const style = styles[status] || styles.unknown;

  return (
    <Badge className={cn(style.bg, style.text, "capitalize")}>
      {status}
    </Badge>
  );
}

function formatTimeAgo(dateString: string | null): string {
  if (!dateString) return "Never";
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString();
}

function ServiceCard({ service }: { service: ServiceStatus }) {
  const Icon = serviceIcons[service.id] || Activity;
  const label = serviceLabels[service.id] || service.id;

  return (
    <Card className={cn(
      "transition-colors",
      service.status === "outage" && "border-red-200 bg-red-50",
      service.status === "degraded" && "border-yellow-200 bg-yellow-50"
    )}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-lg",
              service.status === "operational" && "bg-green-100",
              service.status === "degraded" && "bg-yellow-100",
              service.status === "outage" && "bg-red-100",
              service.status === "unknown" && "bg-gray-100"
            )}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-medium">{label}</h3>
              <p className="text-sm text-muted-foreground">
                {service.message || "No additional info"}
              </p>
            </div>
          </div>
          <StatusBadge status={service.status} />
        </div>

        {service.last_error && (
          <div className="mt-3 p-2 bg-red-100 rounded text-sm text-red-700">
            {service.last_error}
          </div>
        )}

        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          Last checked: {formatTimeAgo(service.last_check_at)}
        </div>
      </CardContent>
    </Card>
  );
}

function MetricCard({
  title,
  value,
  icon: Icon,
  description,
  status,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  description?: string;
  status?: "good" | "warning" | "bad";
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className={cn(
          "h-4 w-4",
          status === "good" && "text-green-500",
          status === "warning" && "text-yellow-500",
          status === "bad" && "text-red-500",
          !status && "text-muted-foreground"
        )} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function AdminHealthPage() {
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = async () => {
    try {
      const response = await fetch("/api/admin/health");
      if (!response.ok) throw new Error("Failed to fetch health status");
      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleManualCheck = async () => {
    setChecking(true);
    try {
      const response = await fetch("/api/admin/health", { method: "POST" });
      if (!response.ok) throw new Error("Health check failed");
      // Refresh the data
      await fetchHealth();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Health check failed");
    } finally {
      setChecking(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">System Health</h1>
            <p className="text-muted-foreground">
              Monitor platform services and performance
            </p>
          </div>
        </div>
        <LoadingSkeleton />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">System Health</h1>
            <p className="text-muted-foreground">
              Monitor platform services and performance
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-600">{error}</p>
            <Button onClick={fetchHealth} className="mt-4" variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">System Health</h1>
            <p className="text-muted-foreground">
              Monitor platform services and performance
            </p>
          </div>
          {data && (
            <StatusBadge status={data.overall_status} />
          )}
        </div>
        <Button
          onClick={handleManualCheck}
          disabled={checking}
          variant="outline"
        >
          {checking ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Checking...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Run Health Check
            </>
          )}
        </Button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* Metrics Overview */}
      {data && (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <MetricCard
              title="Overall Status"
              value={data.overall_status}
              icon={Activity}
              description={`Last check: ${formatTimeAgo(data.last_check)}`}
              status={
                data.overall_status === "operational"
                  ? "good"
                  : data.overall_status === "degraded"
                    ? "warning"
                    : "bad"
              }
            />
            <MetricCard
              title="API Requests (24h)"
              value={data.metrics_summary.api_requests_24h.toLocaleString()}
              icon={Zap}
              description="Total requests"
            />
            <MetricCard
              title="Avg Response Time"
              value={`${data.metrics_summary.avg_response_time_ms}ms`}
              icon={Clock}
              description="Last 24 hours"
              status={
                data.metrics_summary.avg_response_time_ms < 200
                  ? "good"
                  : data.metrics_summary.avg_response_time_ms < 500
                    ? "warning"
                    : "bad"
              }
            />
            <MetricCard
              title="Errors (24h)"
              value={data.error_count_24h}
              icon={AlertTriangle}
              description={`${data.metrics_summary.error_rate_percent}% error rate`}
              status={
                data.error_count_24h === 0
                  ? "good"
                  : data.error_count_24h < 10
                    ? "warning"
                    : "bad"
              }
            />
          </div>

          {/* Service Status Cards */}
          <Card>
            <CardHeader>
              <CardTitle>Service Status</CardTitle>
              <CardDescription>
                Current status of all platform services
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {data.services.map((service) => (
                  <ServiceCard key={service.id} service={service} />
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
