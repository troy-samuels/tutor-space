import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { requireAdmin, logAdminAction, getClientIP } from "@/lib/admin/auth";

export async function GET(request: NextRequest) {
  try {
    const adminSession = await requireAdmin(request);

    const supabase = createServiceRoleClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Service unavailable" },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const tutorId = searchParams.get("tutorId");

    // Build query for paid bookings
    let query = supabase
      .from("bookings")
      .select(`
        id,
        datetime,
        duration_minutes,
        amount,
        currency,
        payment_status,
        status,
        created_at,
        tutor_id,
        student_id,
        service_id,
        profiles!tutor_id (
          full_name,
          email,
          username
        ),
        students!student_id (
          full_name,
          email
        ),
        services!service_id (
          name
        )
      `)
      .eq("payment_status", "paid")
      .order("datetime", { ascending: false });

    if (startDate) {
      query = query.gte("datetime", startDate);
    }

    if (endDate) {
      query = query.lte("datetime", endDate);
    }

    if (tutorId) {
      query = query.eq("tutor_id", tutorId);
    }

    const { data: bookings, error } = await query;

    if (error) throw error;

    // Generate CSV
    const headers = [
      "Booking ID",
      "Date/Time",
      "Duration (min)",
      "Amount",
      "Currency",
      "Payment Status",
      "Booking Status",
      "Created At",
      "Tutor ID",
      "Tutor Name",
      "Tutor Email",
      "Student Name",
      "Student Email",
      "Service Name",
    ];

    const rows = (bookings || []).map((booking) => {
      const tutorRaw = Array.isArray(booking.profiles) ? booking.profiles[0] : booking.profiles;
      const studentRaw = Array.isArray(booking.students) ? booking.students[0] : booking.students;
      const serviceRaw = Array.isArray(booking.services) ? booking.services[0] : booking.services;

      const tutor = tutorRaw
        ? {
            full_name: tutorRaw.full_name ?? null,
            email: tutorRaw.email ?? "",
            username: tutorRaw.username ?? null,
          }
        : null;
      const student = studentRaw
        ? {
            full_name: studentRaw.full_name ?? null,
            email: studentRaw.email ?? "",
          }
        : null;
      const service = serviceRaw
        ? {
            name: serviceRaw.name ?? "",
          }
        : null;
      return [
        booking.id,
        booking.datetime ? new Date(booking.datetime).toISOString() : "",
        booking.duration_minutes || "",
        booking.amount ? (booking.amount / 100).toFixed(2) : "0.00",
        booking.currency || "usd",
        booking.payment_status || "",
        booking.status || "",
        booking.created_at ? new Date(booking.created_at).toISOString() : "",
        booking.tutor_id,
        tutor?.full_name || "",
        tutor?.email || "",
        student?.full_name || "",
        student?.email || "",
        service?.name || "",
      ];
    });

    const csv = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    // Calculate totals for the log
    const totalAmount = (bookings || []).reduce(
      (sum, b) => sum + (b.amount || 0),
      0
    );

    // Log the export action
    await logAdminAction(adminSession.adminId, "export_revenue", {
      metadata: {
        count: bookings?.length || 0,
        totalAmount: totalAmount / 100,
        startDate: startDate || "all",
        endDate: endDate || "all",
        tutorId: tutorId || "all",
      },
      ipAddress: getClientIP(request),
      userAgent: request.headers.get("user-agent") || undefined,
    });

    // Return CSV file
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="revenue-export-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error("Export revenue error:", error);

    if (error instanceof Error && error.message.includes("authentication")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Failed to export revenue" },
      { status: 500 }
    );
  }
}
