import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin/auth";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    const supabase = createServiceRoleClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Service unavailable" },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "7");
    const path = searchParams.get("path") || "";

    const startDate = new Date(
      Date.now() - days * 24 * 60 * 60 * 1000
    ).toISOString();

    // Get page view counts by day
    let query = supabase
      .from("page_views")
      .select("page_path, created_at, device_type, user_type")
      .gte("created_at", startDate)
      .order("created_at", { ascending: false });

    if (path) {
      query = query.ilike("page_path", `%${path}%`);
    }

    const { data: pageViews, error } = await query.limit(10000);

    if (error) {
      console.error("Error fetching page views:", error);
      return NextResponse.json(
        { error: "Failed to fetch page views" },
        { status: 500 }
      );
    }

    // Aggregate data
    const views = pageViews || [];

    // Views by day
    const viewsByDay: Record<string, number> = {};
    const uniqueSessionsByDay: Record<string, Set<string>> = {};

    // Views by path
    const viewsByPath: Record<string, number> = {};

    // Views by device
    const viewsByDevice: Record<string, number> = {
      desktop: 0,
      mobile: 0,
      tablet: 0,
      unknown: 0,
    };

    // Views by user type
    const viewsByUserType: Record<string, number> = {
      tutor: 0,
      student: 0,
      anonymous: 0,
    };

    views.forEach((view) => {
      // By day
      const day = view.created_at.split("T")[0];
      viewsByDay[day] = (viewsByDay[day] || 0) + 1;

      // By path
      viewsByPath[view.page_path] = (viewsByPath[view.page_path] || 0) + 1;

      // By device
      const device = view.device_type || "unknown";
      viewsByDevice[device] = (viewsByDevice[device] || 0) + 1;

      // By user type
      const userType = view.user_type || "anonymous";
      viewsByUserType[userType] = (viewsByUserType[userType] || 0) + 1;
    });

    // Sort paths by count and get top 20
    const topPaths = Object.entries(viewsByPath)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20)
      .map(([path, count]) => ({ path, count }));

    // Convert views by day to array sorted by date
    const dailyViews = Object.entries(viewsByDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));

    return NextResponse.json({
      summary: {
        total: views.length,
        uniquePaths: Object.keys(viewsByPath).length,
        period: {
          start: startDate,
          end: new Date().toISOString(),
          days,
        },
      },
      dailyViews,
      topPaths,
      byDevice: viewsByDevice,
      byUserType: viewsByUserType,
    });
  } catch (error) {
    console.error("Admin page views API error:", error);

    if (error instanceof Error && error.message.includes("authentication")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
