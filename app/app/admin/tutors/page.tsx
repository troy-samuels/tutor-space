"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
} from "lucide-react";

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
  timezone: string | null;
  created_at: string;
  updated_at: string;
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
    growth: { className: "bg-blue-100 text-blue-700", label: "Growth" },
    studio: { className: "bg-purple-100 text-purple-700", label: "Studio" },
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
            <Skeleton className="h-8 w-16" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

export default function AdminTutorsPage() {
  const router = useRouter();
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

  // Filter states
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [plan, setPlan] = useState(searchParams.get("plan") || "all");
  const [stripeStatus, setStripeStatus] = useState(
    searchParams.get("stripeStatus") || "all"
  );

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
  }, [search, plan, stripeStatus]);

  useEffect(() => {
    fetchTutors(1);
  }, [fetchTutors]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    fetchTutors(1);
  }

  function handlePageChange(newPage: number) {
    fetchTutors(newPage);
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
            <SelectItem value="professional">Professional</SelectItem>
            <SelectItem value="growth">Growth</SelectItem>
            <SelectItem value="studio">Studio</SelectItem>
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
              <TableHead>Joined</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TutorTableSkeleton />
            ) : tutors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
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
                  <TableCell className="text-muted-foreground">
                    {formatDate(tutor.created_at)}
                  </TableCell>
                  <TableCell>
                    <Link href={`/admin/tutors/${tutor.id}`}>
                      <Button variant="ghost" size="sm">
                        View
                        <ExternalLink className="ml-1 h-3 w-3" />
                      </Button>
                    </Link>
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
    </div>
  );
}
