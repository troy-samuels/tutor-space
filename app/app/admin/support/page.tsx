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
import {
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Inbox,
  User,
  Mail,
} from "lucide-react";
import {
  getAllSupportTickets,
  getSupportStats,
  updateTicketStatus,
  type SupportTicket,
} from "@/lib/actions/support";
import { formatDistanceToNow, format } from "date-fns";

const STATUS_CONFIG = {
  open: { label: "Open", icon: AlertCircle, color: "bg-yellow-100 text-yellow-700" },
  in_progress: { label: "In Progress", icon: Clock, color: "bg-blue-100 text-blue-700" },
  closed: { label: "Resolved", icon: CheckCircle, color: "bg-emerald-100 text-emerald-700" },
};

const CATEGORIES: Record<string, string> = {
  general: "General Question",
  billing: "Billing & Payments",
  technical: "Technical Issue",
  feature: "Feature Request",
  account: "Account & Settings",
  other: "Other",
};

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ open: 0, in_progress: 0, closed_today: 0, total: 0 });
  const [statusFilter, setStatusFilter] = useState("open");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const perPage = 20;

  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [updating, setUpdating] = useState(false);

  const fetchTickets = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent ?? false;
    if (!silent) {
      setLoading(true);
    }
    const result = await getAllSupportTickets({
      status: statusFilter === "all" ? undefined : statusFilter,
      limit: perPage,
      offset: (page - 1) * perPage,
    });
    setTickets(result.tickets);
    setTotal(result.total);
    if (!silent) {
      setLoading(false);
    }
  }, [statusFilter, page]);

  const fetchStats = useCallback(async () => {
    const result = await getSupportStats();
    if (!result.error) {
      setStats(result);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
    fetchStats();
  }, [fetchTickets, fetchStats]);

  async function handleStatusChange(ticketId: string, newStatus: "open" | "in_progress" | "closed") {
    setUpdating(true);
    const result = await updateTicketStatus(ticketId, newStatus);
    if (!result.error) {
      const resolvedAt = newStatus === "closed" ? new Date().toISOString() : null;
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket((prev) =>
          prev ? { ...prev, status: newStatus, resolved_at: resolvedAt } : null
        );
      }
      await fetchTickets({ silent: true });
      fetchStats();
    }
    setUpdating(false);
  }

  function openDetail(ticket: SupportTicket) {
    setSelectedTicket(ticket);
    setDetailDialogOpen(true);
  }

  const totalPages = Math.ceil(total / perPage);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Support Inbox</h1>
        <p className="text-muted-foreground">
          Manage support requests from tutors and students
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Open</CardDescription>
            <CardTitle className="text-3xl text-yellow-600">{stats.open}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>In Progress</CardDescription>
            <CardTitle className="text-3xl text-blue-600">{stats.in_progress}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Resolved Today</CardDescription>
            <CardTitle className="text-3xl text-emerald-600">{stats.closed_today}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Tickets</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Support Tickets</CardTitle>
              <CardDescription>
                {total} ticket{total !== 1 ? "s" : ""} found
              </CardDescription>
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tickets</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="closed">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="p-4 border rounded-lg space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              ))}
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-12">
              <Inbox className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-lg font-medium text-muted-foreground">No tickets found</p>
              <p className="text-sm text-muted-foreground mt-1">
                {statusFilter !== "all"
                  ? `No ${statusFilter.replace("_", " ")} tickets`
                  : "No support tickets have been submitted yet"}
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {tickets.map((ticket) => {
                  const statusConfig = STATUS_CONFIG[ticket.status];
                  const StatusIcon = statusConfig.icon;
                  return (
                    <button
                      key={ticket.id}
                      type="button"
                      className="w-full p-4 border rounded-lg hover:bg-muted/50 transition-colors text-left"
                      onClick={() => openDetail(ticket)}
                      aria-label={`View support ticket: ${ticket.subject}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium truncate">{ticket.subject}</p>
                            <Badge variant="outline" className="shrink-0 text-xs">
                              {CATEGORIES[ticket.category] || ticket.category}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {ticket.message}
                          </p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {ticket.user_name || "Unknown"}
                            </span>
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {ticket.user_email || "No email"}
                            </span>
                            <span>•</span>
                            <span>
                              {formatDistanceToNow(new Date(ticket.created_at), {
                                addSuffix: true,
                              })}
                            </span>
                          </div>
                        </div>
                        <Badge
                          variant="secondary"
                          className={`shrink-0 ${statusConfig.color}`}
                        >
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusConfig.label}
                        </Badge>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Support Ticket</DialogTitle>
            <DialogDescription>
              View and manage this support request
            </DialogDescription>
          </DialogHeader>

          {selectedTicket && (
            <div className="space-y-4">
              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">Subject</Label>
                  <p className="font-medium mt-0.5">{selectedTicket.subject}</p>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">Message</Label>
                  <p className="mt-0.5 text-sm whitespace-pre-wrap">{selectedTicket.message}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">From</Label>
                    <p className="mt-0.5 text-sm">{selectedTicket.user_name || "Unknown"}</p>
                    <p className="text-xs text-muted-foreground">{selectedTicket.user_email}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">Category</Label>
                    <p className="mt-0.5 text-sm">{CATEGORIES[selectedTicket.category] || selectedTicket.category}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">Submitted</Label>
                    <p className="mt-0.5 text-sm">
                      {format(new Date(selectedTicket.created_at), "PPp")}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">Role</Label>
                    <p className="mt-0.5 text-sm capitalize">{selectedTicket.submitted_by_role}</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide mb-2 block">
                  Update Status
                </Label>
                <div className="flex gap-2">
                  <Button
                    variant={selectedTicket.status === "open" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleStatusChange(selectedTicket.id, "open")}
                    disabled={updating || selectedTicket.status === "open"}
                  >
                    {updating && selectedTicket.status !== "open" && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                    Open
                  </Button>
                  <Button
                    variant={selectedTicket.status === "in_progress" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleStatusChange(selectedTicket.id, "in_progress")}
                    disabled={updating || selectedTicket.status === "in_progress"}
                  >
                    {updating && selectedTicket.status !== "in_progress" && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                    In Progress
                  </Button>
                  <Button
                    variant={selectedTicket.status === "closed" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleStatusChange(selectedTicket.id, "closed")}
                    disabled={updating || selectedTicket.status === "closed"}
                  >
                    {updating && selectedTicket.status !== "closed" && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                    Resolved
                  </Button>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={className}>{children}</p>;
}
