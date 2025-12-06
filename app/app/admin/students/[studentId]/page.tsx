"use client";

import { useState, useEffect, use, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  User,
  Mail,
  Phone,
  Globe,
  Calendar,
  DollarSign,
  MessageSquare,
  GraduationCap,
  Link as LinkIcon,
  CheckCircle,
} from "lucide-react";

interface StudentDetail {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  timezone: string | null;
  status: string | null;
  calendar_access_status: string | null;
  source: string | null;
  learning_goals: string | null;
  native_language: string | null;
  proficiency_level: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  user_id: string | null;
  profiles: {
    id: string;
    full_name: string | null;
    email: string;
    username: string | null;
    avatar_url: string | null;
  } | null;
  stats: {
    completed_bookings: number;
    upcoming_bookings: number;
    total_spent_cents: number;
    message_count: number;
  };
}

interface Booking {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  payment_status: string;
  payment_amount: number | null;
  currency: string | null;
  services: { name: string } | null;
}

interface PackagePurchase {
  id: string;
  remaining_minutes: number;
  expires_at: string | null;
  status: string;
  created_at: string;
  session_package_templates: {
    name: string;
    session_count: number;
    total_minutes: number;
  } | null;
}

interface Connection {
  id: string;
  status: string;
  created_at: string;
  profiles: {
    id: string;
    full_name: string | null;
    email: string;
    username: string | null;
  } | null;
}

export default function AdminStudentDetailPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [packages, setPackages] = useState<PackagePurchase[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);

  const fetchStudentDetail = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/students/${studentId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch student");
      }
      const data = await response.json();
      setStudent(data.student);
      setBookings(data.bookings || []);
      setPackages(data.packages || []);
      setConnections(data.connections || []);
    } catch (error) {
      console.error("Failed to fetch student:", error);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    fetchStudentDetail();
  }, [fetchStudentDetail]);

  function getStatusBadge(status: string | null) {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case "trial":
        return <Badge className="bg-blue-100 text-blue-800">Trial</Badge>;
      case "paused":
        return <Badge className="bg-yellow-100 text-yellow-800">Paused</Badge>;
      case "alumni":
        return <Badge className="bg-gray-100 text-gray-800">Alumni</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  }

  function getBookingStatusBadge(status: string) {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-green-100 text-green-800">Confirmed</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case "completed":
        return <Badge className="bg-blue-100 text-blue-800">Completed</Badge>;
      case "cancelled":
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  }

  function formatCurrency(cents: number, currency: string = "USD") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(cents / 100);
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Student not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <GraduationCap className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">
                {student.full_name || "No name"}
              </h1>
              <p className="text-muted-foreground">{student.email}</p>
            </div>
            {getStatusBadge(student.status)}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completed Lessons
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-2xl font-bold">
                {student.stats.completed_bookings}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Upcoming Lessons
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <span className="text-2xl font-bold">
                {student.stats.upcoming_bookings}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Spent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-emerald-600" />
              <span className="text-2xl font-bold">
                {formatCurrency(student.stats.total_spent_cents)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Messages Sent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-purple-600" />
              <span className="text-2xl font-bold">
                {student.stats.message_count}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Details Tabs */}
      <Tabs defaultValue="info" className="space-y-4">
        <TabsList>
          <TabsTrigger value="info">Information</TabsTrigger>
          <TabsTrigger value="bookings">
            Bookings ({bookings.length})
          </TabsTrigger>
          <TabsTrigger value="packages">
            Packages ({packages.length})
          </TabsTrigger>
          <TabsTrigger value="connections">
            Connections ({connections.length})
          </TabsTrigger>
        </TabsList>

        {/* Info Tab */}
        <TabsContent value="info">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{student.email}</span>
                </div>
                {student.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{student.phone}</span>
                  </div>
                )}
                {student.timezone && (
                  <div className="flex items-center gap-3">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span>{student.timezone}</span>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    Joined {new Date(student.created_at).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Learning Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {student.native_language && (
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Native Language
                    </p>
                    <p className="font-medium">{student.native_language}</p>
                  </div>
                )}
                {student.proficiency_level && (
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Proficiency Level
                    </p>
                    <p className="font-medium capitalize">
                      {student.proficiency_level}
                    </p>
                  </div>
                )}
                {student.learning_goals && (
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Learning Goals
                    </p>
                    <p className="font-medium">{student.learning_goals}</p>
                  </div>
                )}
                {student.source && (
                  <div>
                    <p className="text-sm text-muted-foreground">Source</p>
                    <p className="font-medium capitalize">{student.source}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {student.profiles && (
              <Card>
                <CardHeader>
                  <CardTitle>Primary Tutor</CardTitle>
                </CardHeader>
                <CardContent>
                  <Link
                    href={`/admin/tutors/${student.profiles.id}`}
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted transition-colors"
                  >
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {student.profiles.full_name || "No name"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {student.profiles.email}
                      </p>
                    </div>
                    <LinkIcon className="h-4 w-4 ml-auto text-muted-foreground" />
                  </Link>
                </CardContent>
              </Card>
            )}

            {student.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{student.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Bookings Tab */}
        <TabsContent value="bookings">
          <Card>
            <CardHeader>
              <CardTitle>Lesson History</CardTitle>
              <CardDescription>
                All bookings for this student
              </CardDescription>
            </CardHeader>
            <CardContent>
              {bookings.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  No bookings found
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Service</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell className="font-medium">
                          {booking.services?.name || "Unknown"}
                        </TableCell>
                        <TableCell>
                          {new Date(booking.scheduled_at).toLocaleDateString()}{" "}
                          {new Date(booking.scheduled_at).toLocaleTimeString(
                            [],
                            { hour: "2-digit", minute: "2-digit" }
                          )}
                        </TableCell>
                        <TableCell>{booking.duration_minutes} min</TableCell>
                        <TableCell>
                          {getBookingStatusBadge(booking.status)}
                        </TableCell>
                        <TableCell>
                          {booking.payment_status === "paid" ? (
                            <Badge className="bg-green-100 text-green-800">
                              Paid
                            </Badge>
                          ) : (
                            <Badge className="bg-yellow-100 text-yellow-800">
                              Unpaid
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {booking.payment_amount
                            ? formatCurrency(
                                booking.payment_amount,
                                booking.currency || "USD"
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
        </TabsContent>

        {/* Packages Tab */}
        <TabsContent value="packages">
          <Card>
            <CardHeader>
              <CardTitle>Session Packages</CardTitle>
              <CardDescription>
                Purchased lesson packages
              </CardDescription>
            </CardHeader>
            <CardContent>
              {packages.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  No packages purchased
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Package</TableHead>
                      <TableHead>Sessions</TableHead>
                      <TableHead>Remaining</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {packages.map((pkg) => (
                      <TableRow key={pkg.id}>
                        <TableCell className="font-medium">
                          {pkg.session_package_templates?.name || "Unknown"}
                        </TableCell>
                        <TableCell>
                          {pkg.session_package_templates?.session_count || 0}{" "}
                          sessions
                        </TableCell>
                        <TableCell>{pkg.remaining_minutes} min</TableCell>
                        <TableCell>
                          {pkg.expires_at
                            ? new Date(pkg.expires_at).toLocaleDateString()
                            : "Never"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              pkg.status === "active"
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }
                          >
                            {pkg.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Connections Tab */}
        <TabsContent value="connections">
          <Card>
            <CardHeader>
              <CardTitle>Tutor Connections</CardTitle>
              <CardDescription>
                All tutors this student is connected to
              </CardDescription>
            </CardHeader>
            <CardContent>
              {connections.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  No tutor connections
                </p>
              ) : (
                <div className="space-y-3">
                  {connections.map((conn) => (
                    <div
                      key={conn.id}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {conn.profiles?.full_name || "Unknown"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {conn.profiles?.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge
                          className={
                            conn.status === "approved"
                              ? "bg-green-100 text-green-800"
                              : conn.status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                          }
                        >
                          {conn.status}
                        </Badge>
                        {conn.profiles && (
                          <Link
                            href={`/admin/tutors/${conn.profiles.id}`}
                            className="text-primary hover:underline text-sm"
                          >
                            View Tutor
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
