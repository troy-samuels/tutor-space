"use client";

import { useState, useEffect, useCallback } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Flag,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Star,
  User,
  Globe,
  Package,
  Loader2,
} from "lucide-react";

interface ContentReport {
  id: string;
  reporter_id: string | null;
  reporter_role: string | null;
  content_type: string;
  content_id: string;
  content_preview: string | null;
  reported_user_id: string | null;
  reported_user_role: string | null;
  reason: string;
  description: string | null;
  status: string;
  priority: string;
  resolution_action: string | null;
  resolution_notes: string | null;
  resolved_at: string | null;
  created_at: string;
  resolved_admin: {
    id: string;
    email: string;
    full_name: string | null;
  } | null;
}

interface Stats {
  pending: number;
  reviewing: number;
  urgent: number;
  today: number;
}

export default function AdminModerationPage() {
  const [reports, setReports] = useState<ContentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    pending: 0,
    reviewing: 0,
    urgent: 0,
    today: 0,
  });
  const [statusFilter, setStatusFilter] = useState("pending");
  const [contentTypeFilter, setContentTypeFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const perPage = 20;

  const [selectedReport, setSelectedReport] = useState<ContentReport | null>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<"resolve" | "dismiss" | null>(null);
  const [resolutionAction, setResolutionAction] = useState("");
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: perPage.toString(),
        status: statusFilter,
        content_type: contentTypeFilter,
        priority: priorityFilter,
      });

      const response = await fetch(`/api/admin/moderation?${params.toString()}`);
      const data = await response.json();

      setReports(data.reports || []);
      setTotal(data.total || 0);
      setStats(data.stats || { pending: 0, reviewing: 0, urgent: 0, today: 0 });
    } catch (error) {
      console.error("Failed to fetch reports:", error);
    } finally {
      setLoading(false);
    }
  }, [page, perPage, statusFilter, contentTypeFilter, priorityFilter]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  async function handleAction(action: string, value?: string, notes?: string) {
    if (!selectedReport) return;

    setActionLoading(true);
    try {
      const response = await fetch("/api/admin/moderation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId: selectedReport.id,
          action,
          value,
          notes,
        }),
      });

      if (response.ok) {
        fetchReports();
        setActionDialogOpen(false);
        setSelectedReport(null);
        setResolutionAction("");
        setResolutionNotes("");
      }
    } catch (error) {
      console.error("Failed to perform action:", error);
    } finally {
      setActionLoading(false);
    }
  }

  function getContentTypeIcon(type: string) {
    switch (type) {
      case "message":
        return <MessageSquare className="h-4 w-4" />;
      case "review":
        return <Star className="h-4 w-4" />;
      case "profile":
        return <User className="h-4 w-4" />;
      case "tutor_site":
        return <Globe className="h-4 w-4" />;
      case "digital_product":
        return <Package className="h-4 w-4" />;
      default:
        return <Flag className="h-4 w-4" />;
    }
  }

  function getPriorityBadge(priority: string) {
    switch (priority) {
      case "urgent":
        return <Badge className="bg-red-100 text-red-800">Urgent</Badge>;
      case "high":
        return <Badge className="bg-orange-100 text-orange-800">High</Badge>;
      case "normal":
        return <Badge className="bg-blue-100 text-blue-800">Normal</Badge>;
      case "low":
        return <Badge className="bg-gray-100 text-gray-800">Low</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case "reviewing":
        return <Badge className="bg-blue-100 text-blue-800">Reviewing</Badge>;
      case "resolved":
        return <Badge className="bg-green-100 text-green-800">Resolved</Badge>;
      case "dismissed":
        return <Badge className="bg-gray-100 text-gray-800">Dismissed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  }

  function getReasonLabel(reason: string) {
    const labels: Record<string, string> = {
      spam: "Spam",
      harassment: "Harassment",
      inappropriate: "Inappropriate Content",
      scam: "Scam/Fraud",
      impersonation: "Impersonation",
      copyright: "Copyright Violation",
      other: "Other",
    };
    return labels[reason] || reason;
  }

  const totalPages = Math.ceil(total / perPage);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Content Moderation</h1>
        <p className="text-muted-foreground">
          Review and take action on reported content
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <span className="text-2xl font-bold">{stats.pending}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Under Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-blue-600" />
              <span className="text-2xl font-bold">{stats.reviewing}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Urgent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <span className="text-2xl font-bold">{stats.urgent}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Flag className="h-5 w-5 text-purple-600" />
              <span className="text-2xl font-bold">{stats.today}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Reports Queue</CardTitle>
          <CardDescription>
            {total.toLocaleString()} total reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-6">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="reviewing">Reviewing</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="dismissed">Dismissed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={contentTypeFilter} onValueChange={setContentTypeFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Content Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="message">Messages</SelectItem>
                <SelectItem value="review">Reviews</SelectItem>
                <SelectItem value="profile">Profiles</SelectItem>
                <SelectItem value="tutor_site">Tutor Sites</SelectItem>
                <SelectItem value="digital_product">Products</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reports List */}
          <div className="space-y-4">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="border rounded-lg p-4">
                  <Skeleton className="h-4 w-48 mb-2" />
                  <Skeleton className="h-3 w-full mb-2" />
                  <Skeleton className="h-3 w-32" />
                </div>
              ))
            ) : reports.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                <p className="text-lg font-medium">All clear!</p>
                <p className="text-sm">No reports match your filters.</p>
              </div>
            ) : (
              reports.map((report) => (
                <div
                  key={report.id}
                  className={`border rounded-lg p-4 ${
                    report.priority === "urgent"
                      ? "border-red-200 bg-red-50/50"
                      : report.priority === "high"
                        ? "border-orange-200 bg-orange-50/50"
                        : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getContentTypeIcon(report.content_type)}
                        <span className="font-medium capitalize">
                          {report.content_type.replace("_", " ")}
                        </span>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-sm text-muted-foreground">
                          {getReasonLabel(report.reason)}
                        </span>
                        {getPriorityBadge(report.priority)}
                        {getStatusBadge(report.status)}
                      </div>

                      {report.content_preview && (
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                          &ldquo;{report.content_preview}&rdquo;
                        </p>
                      )}

                      {report.description && (
                        <p className="text-sm mb-2">
                          <span className="font-medium">Description:</span>{" "}
                          {report.description}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>
                          Reported{" "}
                          {new Date(report.created_at).toLocaleDateString()} at{" "}
                          {new Date(report.created_at).toLocaleTimeString()}
                        </span>
                        {report.resolved_at && report.resolved_admin && (
                          <span>
                            Resolved by {report.resolved_admin.full_name || report.resolved_admin.email}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {report.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedReport(report);
                              handleAction("update_status", "reviewing");
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Review
                          </Button>
                        </>
                      )}

                      {(report.status === "pending" || report.status === "reviewing") && (
                        <>
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => {
                              setSelectedReport(report);
                              setActionType("resolve");
                              setActionDialogOpen(true);
                            }}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Resolve
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedReport(report);
                              setActionType("dismiss");
                              setActionDialogOpen(true);
                            }}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Dismiss
                          </Button>
                        </>
                      )}

                      {(report.status === "resolved" || report.status === "dismissed") && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedReport(report);
                            handleAction("reopen");
                          }}
                        >
                          Reopen
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-muted-foreground">
                Showing {(page - 1) * perPage + 1} to{" "}
                {Math.min(page * perPage, total)} of {total} reports
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "resolve" ? "Resolve Report" : "Dismiss Report"}
            </DialogTitle>
            <DialogDescription>
              {actionType === "resolve"
                ? "Choose an action to take and add any notes."
                : "Add a reason for dismissing this report."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {actionType === "resolve" && (
              <div className="space-y-2">
                <Label>Action Taken</Label>
                <Select value={resolutionAction} onValueChange={setResolutionAction}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no_action">No Action Required</SelectItem>
                    <SelectItem value="warning_issued">Warning Issued</SelectItem>
                    <SelectItem value="content_removed">Content Removed</SelectItem>
                    <SelectItem value="user_suspended">User Suspended</SelectItem>
                    <SelectItem value="user_banned">User Banned</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Add notes about your decision..."
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setActionDialogOpen(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (actionType === "resolve") {
                  handleAction("resolve", resolutionAction, resolutionNotes);
                } else {
                  handleAction("dismiss", undefined, resolutionNotes);
                }
              }}
              disabled={actionLoading || (actionType === "resolve" && !resolutionAction)}
            >
              {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {actionType === "resolve" ? "Resolve" : "Dismiss"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
