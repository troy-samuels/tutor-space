"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  CreditCard,
  Receipt,
  Package,
  BookOpen,
  ShoppingBag,
  DollarSign,
  Calendar,
  Clock,
  Download,
} from "lucide-react";
import {
  type PaymentRecord,
  type PackagePurchaseRecord,
  type BillingSummary,
  formatCurrency,
} from "@/lib/actions/student-billing";
import { format } from "date-fns";

interface StudentBillingClientProps {
  payments: PaymentRecord[];
  packages: PackagePurchaseRecord[];
  summary: BillingSummary;
}

export function StudentBillingClient({
  payments,
  packages,
  summary,
}: StudentBillingClientProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Billing & Payments</h1>
        <p className="text-muted-foreground">
          View your payment history and manage your purchases
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Spent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <span className="text-2xl font-bold">
                {formatCurrency(summary.totalSpent, summary.currency)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Lessons Purchased
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-600" />
              <span className="text-2xl font-bold">{summary.lessonsPurchased}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Products Purchased
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-purple-600" />
              <span className="text-2xl font-bold">{summary.productsPurchased}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Packages Purchased
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-orange-600" />
              <span className="text-2xl font-bold">{summary.packagesPurchased}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different payment types */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Payments ({payments.length})</TabsTrigger>
          <TabsTrigger value="packages">
            Packages ({packages.length})
          </TabsTrigger>
        </TabsList>

        {/* All Payments Tab */}
        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Payment History
              </CardTitle>
              <CardDescription>All your lesson and product purchases</CardDescription>
            </CardHeader>
            <CardContent>
              {payments.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No payments yet</p>
                  <p className="text-sm mt-1">
                    Your payment history will appear here
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Tutor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(payment.created_at), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {payment.booking ? (
                              <>
                                <BookOpen className="h-4 w-4 text-blue-600" />
                                <div>
                                  <p className="font-medium">
                                    {payment.booking.services?.name || "Lesson"}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {format(
                                      new Date(payment.booking.scheduled_at),
                                      "MMM d, yyyy 'at' h:mm a"
                                    )}{" "}
                                    • {payment.booking.duration_minutes} min
                                  </p>
                                </div>
                              </>
                            ) : payment.digital_product ? (
                              <>
                                <ShoppingBag className="h-4 w-4 text-purple-600" />
                                <div>
                                  <p className="font-medium">
                                    {payment.digital_product.title}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Digital Product
                                  </p>
                                </div>
                              </>
                            ) : (
                              <span className="text-muted-foreground">Payment</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {payment.tutor?.full_name || payment.tutor?.email || "-"}
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-green-100 text-green-800">
                            Paid
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(payment.amount_cents, payment.currency)}
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
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Session Packages
              </CardTitle>
              <CardDescription>Your pre-paid lesson packages</CardDescription>
            </CardHeader>
            <CardContent>
              {packages.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No packages purchased</p>
                  <p className="text-sm mt-1">
                    Purchase lesson packages from your tutor for savings
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {packages.map((pkg) => (
                    <div
                      key={pkg.id}
                      className={`border rounded-lg p-4 ${
                        pkg.status === "active"
                          ? "border-green-200 bg-green-50/50"
                          : "border-gray-200"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">
                              {pkg.session_package_templates?.name || "Session Package"}
                            </h4>
                            <Badge
                              className={
                                pkg.status === "active"
                                  ? "bg-green-100 text-green-800"
                                  : pkg.status === "expired"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-gray-100 text-gray-800"
                              }
                            >
                              {pkg.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {pkg.tutor?.full_name || pkg.tutor?.email}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">
                            {formatCurrency(pkg.total_price_cents, pkg.currency)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(pkg.created_at), "MMM d, yyyy")}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-xs text-muted-foreground">Sessions</p>
                          <p className="font-medium">
                            {pkg.session_package_templates?.session_count || 0}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Remaining</p>
                          <p className="font-medium text-green-600">
                            {Math.floor(pkg.remaining_minutes / 60)}h{" "}
                            {pkg.remaining_minutes % 60}m
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Expires</p>
                          <p className="font-medium">
                            {pkg.expires_at
                              ? format(new Date(pkg.expires_at), "MMM d, yyyy")
                              : "Never"}
                          </p>
                        </div>
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
