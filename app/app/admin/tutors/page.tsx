"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  CreditCard,
  AlertCircle,
  Users,
  Mail,
  Clock,
} from "lucide-react";
import { InactiveTutorAlert } from "@/components/admin/InactiveTutorAlert";
import { ReengagementEmailDialog } from "@/components/admin/ReengagementEmailDialog";

interface Tutor {
  id: string;
  email: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  plan: string | null;
  role: string;
  stripe_account_id: string | null;
  stripe_charges_enabled: boolean | null;
  stripe_onboarding_status: string | null;
  onboarding_completed: boolean | null;
  calendar_provider: string | null;
  timezone: string | null;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
  studentCount: number;
  revenue30d: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatRelativeTime(dateString: string | null): string {
  if (!dateString) return "Never";

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
}

function isInactive(lastLoginAt: string | null): boolean {
  if (!lastLoginAt) return true;
  const date = new Date(lastLoginAt);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return diffDays >= 14;
}

function getInitials(name: string | null): string {
  if (!name) return "??";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function PlanBadge({ plan }: { plan: string | null }) {
  const planName = plan || "professional";
  const variants: Record<string, { className: string; label: string }> = {
    professional: { className: "bg-gray-100 text-gray-700", label: "Free" },
    all_access: { className: "bg-blue-100 text-blue-700", label: "All-access" },
    founder_lifetime: { className: "bg-green-100 text-green-700", label: "Lifetime" },
  };
  const { className, label } = variants[planName] || variants.professional;
  return <Badge className={className}>{label}</Badge>;
}

function StripeStatusBadge({
  accountId,
  chargesEnabled,
}: {
  accountId: string | null;
  chargesEnabled: boolean | null;
}) {
  if (!accountId) {
    return (
      <Badge variant="outline" className="text-gray-500">
        Not connected
      </Badge>
    );
  }
  if (chargesEnabled) {
    return (
      <Badge className="bg-green-100 text-green-700">
        <CreditCard className="h-3 w-3 mr-1" />
        Active
      </Badge>
    );
  }
  return (
    <Badge className="bg-yellow-100 text-yellow-700">
      <AlertCircle className="h-3 w-3 mr-1" />
      Pending
    </Badge>
  );
}

function LastLoginCell({ lastLoginAt }: { lastLoginAt: string | null }) {
  const inactive = isInactive(lastLoginAt);

  return (
    <div className="flex items-center gap-1.5">
      <span className={inactive ? "text-amber-600 font-medium" : "text-muted-foreground"}>
        {formatRelativeTime(lastLoginAt)}
      </span>
      {inactive && (
        <Badge variant="secondary" className="bg-amber-100 text-amber-700 text-xs px-1.5 py-0">
          Inactive
        </Badge>
      )}
    </div>
  );
}

function TutorTableSkeleton() {
  return (
    <>
      {Array.from({ length: 10 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell>
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div>
                <Skeleton className="h-4 w-32 mb-1" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-40" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-6 w-16" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-8" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-16" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-6 w-20" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-20" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-16" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-16" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-8 w-20" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

export default function AdminTutorsPage() {
  const searchParams = useSearchParams();

  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inactiveCount, setInactiveCount] = useState(0);

  // Filter states
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [plan, setPlan] = useState(searchParams.get("plan") || "all");
  const [stripeStatus, setStripeStatus] = useState(
    searchParams.get("stripeStatus") || "all"
  );
  const [activity, setActivity] = useState(
    searchParams.get("activity") || "all"
  );

  // Re-engagement email dialog state
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [selectedTutor, setSelectedTutor] = useState<Tutor | null>(null);

  const fetchInactiveCount = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/tutors/inactive");
      if (response.ok) {
        const data = await response.json();
        setInactiveCount(data.inactiveCount || 0);
      }
    } catch {
      // Silently fail - alert is not critical
    }
  }, []);

  const fetchTutors = useCallback(async (page: number = 1) => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    params.set("page", page.toString());
    params.set("limit", "50");
    if (search) params.set("search", search);
    if (plan && plan !== "all") params.set("plan", plan);
    if (stripeStatus && stripeStatus !== "all")
      params.set("stripeStatus", stripeStatus);
    if (activity && activity !== "all") params.set("activity", activity);

    try {
      const response = await fetch(`/api/admin/tutors?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch tutors");

      const data = await response.json();
      setTutors(data.tutors);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [search, plan, stripeStatus, activity]);

  useEffect(() => {
    fetchTutors(1);
    fetchInactiveCount();
  }, [fetchTutors, fetchInactiveCount]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    fetchTutors(1);
  }

  function handlePageChange(newPage: number) {
    fetchTutors(newPage);
  }

  function handleViewInactive() {
    setActivity("inactive");
  }

  function handleOpenEmailDialog(tutor: Tutor) {
    setSelectedTutor(tutor);
    setEmailDialogOpen(true);
  }

  function handleEmailSuccess() {
    // Refresh the tutor list after successful email send
    fetchTutors(pagination.page);
    fetchInactiveCount();
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-600">{error}</p>
          <Button onClick={() => fetchTutors(1)} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tutors</h1>
        <p className="text-muted-foreground">
          Manage and view all tutors on the platform
        </p>
      </div>

      {/* Inactive Tutor Alert */}
      {activity !== "inactive" && inactiveCount > 0 && (
        <InactiveTutorAlert
          count={inactiveCount}
          onViewClick={handleViewInactive}
        />
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <form onSubmit={handleSearch} className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or username..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </form>

        <Select value={plan} onValueChange={(v) => setPlan(v)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All Plans" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Plans</SelectItem>
            <SelectItem value="professional">Free</SelectItem>
            <SelectItem value="all_access">All-access</SelectItem>
            <SelectItem value="founder_lifetime">Lifetime</SelectItem>
          </SelectContent>
        </Select>

        <Select value={stripeStatus} onValueChange={(v) => setStripeStatus(v)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Stripe Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stripe Status</SelectItem>
            <SelectItem value="connected">Connected</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="none">Not Connected</SelectItem>
          </SelectContent>
        </Select>

        <Select value={activity} onValueChange={(v) => setActivity(v)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Activity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Activity</SelectItem>
            <SelectItem value="active">Active (14d)</SelectItem>
            <SelectItem value="inactive">Inactive (14d+)</SelectItem>
            <SelectItem value="never">Never logged in</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        {loading ? (
          <Skeleton className="h-4 w-32" />
        ) : (
          `Showing ${tutors.length} of ${pagination.total} tutors`
        )}
      </div>

      {/* Table */}
      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tutor</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>
                <Users className="h-4 w-4 inline mr-1" />
                Students
              </TableHead>
              <TableHead>Revenue (30d)</TableHead>
              <TableHead>Stripe</TableHead>
              <TableHead>
                <Clock className="h-4 w-4 inline mr-1" />
                Last Login
              </TableHead>
              <TableHead>Calendar</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TutorTableSkeleton />
            ) : tutors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8">
                  <p className="text-muted-foreground">No tutors found</p>
                </TableCell>
              </TableRow>
            ) : (
              tutors.map((tutor) => (
                <TableRow key={tutor.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={tutor.avatar_url || undefined}
                          alt={tutor.full_name || "Tutor avatar"}
                        />
                        <AvatarFallback>
                          {getInitials(tutor.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">
                          {tutor.full_name || "No name"}
                        </div>
                        {tutor.username && (
                          <div className="text-xs text-muted-foreground">
                            @{tutor.username}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {tutor.email}
                  </TableCell>
                  <TableCell>
                    <PlanBadge plan={tutor.plan} />
                  </TableCell>
                  <TableCell>{tutor.studentCount}</TableCell>
                  <TableCell>
                    {tutor.revenue30d > 0
                      ? formatCurrency(tutor.revenue30d)
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <StripeStatusBadge
                      accountId={tutor.stripe_account_id}
                      chargesEnabled={tutor.stripe_charges_enabled}
                    />
                  </TableCell>
                  <TableCell>
                    <LastLoginCell lastLoginAt={tutor.last_login_at} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {tutor.calendar_provider ? tutor.calendar_provider : "Not set"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(tutor.created_at)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Link href={`/admin/tutors/${tutor.id}`}>
                        <Button variant="ghost" size="sm">
                          View
                          <ExternalLink className="ml-1 h-3 w-3" />
                        </Button>
                      </Link>
                      {isInactive(tutor.last_login_at) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEmailDialog(tutor)}
                          className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                        >
                          <Mail className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1 || loading}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages || loading}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Re-engagement Email Dialog */}
      <ReengagementEmailDialog
        tutor={selectedTutor}
        open={emailDialogOpen}
        onOpenChange={setEmailDialogOpen}
        onSuccess={handleEmailSuccess}
      />
    </div>
  );
}
