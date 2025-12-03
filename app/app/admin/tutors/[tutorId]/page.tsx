"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  CreditCard,
  Users,
  Calendar,
  DollarSign,
  ExternalLink,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  UserCog,
  ShieldAlert,
} from "lucide-react";
import { TutorActionButtons, AccountStatusBadge } from "@/components/admin/TutorActionButtons";

type AccountStatus = "active" | "suspended" | "deactivated" | "pending_review";

interface TutorDetail {
  tutor: {
    id: string;
    email: string;
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
    plan: string | null;
    bio: string | null;
    tagline: string | null;
    timezone: string | null;
    stripe_account_id: string | null;
    stripe_charges_enabled: boolean | null;
    stripe_onboarding_status: string | null;
    onboarding_completed: boolean | null;
    account_status: AccountStatus | null;
    suspended_at: string | null;
    suspension_reason: string | null;
    created_at: string;
    updated_at: string;
  };
  students: {
    list: Array<{
      id: string;
      full_name: string;
      email: string;
      status: string;
      created_at: string;
    }>;
    total: number;
  };
  bookings: {
    stats: {
      total: number;
      completed: number;
      confirmed: number;
      cancelled: number;
      pending: number;
      thisMonth: number;
    };
    recent: Array<{
      id: string;
      scheduled_at: string;
      duration_minutes: number;
      status: string;
      payment_status: string;
      payment_amount: number;
      currency: string;
      students: { full_name: string; email: string };
    }>;
  };
  services: Array<{
    id: string;
    name: string;
    duration_minutes: number;
    price: number;
    currency: string;
    is_active: boolean;
  }>;
  revenue: {
    total: number;
    thisMonth: number;
    last30Days: number;
  };
}

function formatCurrency(cents: number, currency: string = "usd"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
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

function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
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

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case "completed":
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case "confirmed":
      return <Clock className="h-4 w-4 text-blue-500" />;
    case "cancelled":
      return <XCircle className="h-4 w-4 text-red-500" />;
    default:
      return <AlertCircle className="h-4 w-4 text-yellow-500" />;
  }
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-20 w-20 rounded-full" />
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
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
    </div>
  );
}

export default function TutorDetailPage() {
  const { tutorId } = useParams();
  const [data, setData] = useState<TutorDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accountStatus, setAccountStatus] = useState<AccountStatus>("active");

  useEffect(() => {
    async function fetchTutor() {
      try {
        const response = await fetch(`/api/admin/tutors/${tutorId}`);
        if (!response.ok) throw new Error("Failed to fetch tutor");
        const result = await response.json();
        setData(result);
        setAccountStatus(result.tutor.account_status || "active");
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    if (tutorId) fetchTutor();
  }, [tutorId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Link href="/admin/tutors">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tutors
          </Button>
        </Link>
        <LoadingSkeleton />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <Link href="/admin/tutors">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tutors
          </Button>
        </Link>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-600">{error || "Tutor not found"}</p>
          </div>
        </div>
      </div>
    );
  }

  const { tutor, students, bookings, services, revenue } = data;

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link href="/admin/tutors">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Tutors
        </Button>
      </Link>

      {/* Tutor Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarImage
              src={tutor.avatar_url || undefined}
              alt={tutor.full_name || "Tutor avatar"}
            />
            <AvatarFallback className="text-2xl">
              {getInitials(tutor.full_name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">
                {tutor.full_name || "No name"}
              </h1>
              <AccountStatusBadge status={accountStatus} />
            </div>
            <p className="text-muted-foreground">{tutor.email}</p>
            {tutor.username && (
              <p className="text-sm text-muted-foreground">@{tutor.username}</p>
            )}
            <div className="flex gap-2 mt-2">
              <Badge
                className={
                  tutor.plan === "growth" || tutor.plan === "founder_lifetime"
                    ? "bg-blue-100 text-blue-700"
                    : tutor.plan === "studio"
                      ? "bg-purple-100 text-purple-700"
                      : "bg-gray-100 text-gray-700"
                }
              >
                {tutor.plan === "founder_lifetime" ? "Founder lifetime" : tutor.plan || "Legacy Free"}
              </Badge>
              {tutor.stripe_charges_enabled && (
                <Badge className="bg-green-100 text-green-700">
                  <CreditCard className="h-3 w-3 mr-1" />
                  Stripe Connected
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-3">
          <div className="flex gap-2">
            {tutor.username && (
              <Link href={`/${tutor.username}`} target="_blank">
                <Button variant="outline" size="sm">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Public Page
                </Button>
              </Link>
            )}
            <Link href={`/admin/impersonate?tutorId=${tutor.id}`}>
              <Button variant="outline" size="sm">
                <UserCog className="h-4 w-4 mr-2" />
                Impersonate
              </Button>
            </Link>
          </div>
          <TutorActionButtons
            tutorId={tutor.id}
            currentStatus={accountStatus}
            tutorName={tutor.full_name || tutor.email}
            onStatusChange={setAccountStatus}
          />
        </div>
      </div>

      {/* Suspension Notice */}
      {accountStatus === "suspended" && tutor.suspension_reason && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div>
            <p className="font-medium text-yellow-800">Account Suspended</p>
            <p className="text-sm text-yellow-700">{tutor.suspension_reason}</p>
            {tutor.suspended_at && (
              <p className="text-xs text-yellow-600 mt-1">
                Suspended on {formatDate(tutor.suspended_at)}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Students
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Bookings
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bookings.stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {bookings.stats.completed} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Revenue (30d)
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(revenue.last30Days)}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(revenue.total)} lifetime
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              This Month
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {bookings.stats.thisMonth} bookings
            </div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(revenue.thisMonth)} revenue
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Bookings */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Bookings</CardTitle>
            <CardDescription>Last 10 bookings for this tutor</CardDescription>
          </CardHeader>
          <CardContent>
            {bookings.recent.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No bookings yet
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.recent.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell className="font-medium">
                        {booking.students?.full_name || "Unknown"}
                      </TableCell>
                      <TableCell>
                        {formatDateTime(booking.scheduled_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <StatusIcon status={booking.status} />
                          <span className="capitalize">{booking.status}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {booking.payment_amount
                          ? formatCurrency(
                              booking.payment_amount,
                              booking.currency
                            )
                          : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Students */}
        <Card>
          <CardHeader>
            <CardTitle>Students ({students.total})</CardTitle>
            <CardDescription>Recent students for this tutor</CardDescription>
          </CardHeader>
          <CardContent>
            {students.list.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No students yet
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.list.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">
                        {student.full_name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {student.email}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {student.status || "active"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(student.created_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Services */}
        <Card>
          <CardHeader>
            <CardTitle>Services</CardTitle>
            <CardDescription>Lesson types offered</CardDescription>
          </CardHeader>
          <CardContent>
            {services.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No services created
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {services.map((service) => (
                    <TableRow key={service.id}>
                      <TableCell className="font-medium">
                        {service.name}
                      </TableCell>
                      <TableCell>{service.duration_minutes} min</TableCell>
                      <TableCell>
                        {formatCurrency(service.price, service.currency)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={service.is_active ? "default" : "secondary"}
                        >
                          {service.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Profile Info */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Tagline
              </p>
              <p>{tutor.tagline || "Not set"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Bio</p>
              <p className="text-sm">
                {tutor.bio
                  ? tutor.bio.length > 200
                    ? `${tutor.bio.slice(0, 200)}...`
                    : tutor.bio
                  : "Not set"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Timezone
              </p>
              <p>{tutor.timezone || "Not set"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Joined
              </p>
              <p>{formatDate(tutor.created_at)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Onboarding
              </p>
              <p>
                {tutor.onboarding_completed ? (
                  <Badge className="bg-green-100 text-green-700">
                    Completed
                  </Badge>
                ) : (
                  <Badge className="bg-yellow-100 text-yellow-700">
                    Incomplete
                  </Badge>
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
