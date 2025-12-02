import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, logAdminAction, getClientIP } from "@/lib/admin/auth";
import {
  getAllConfig,
  getConfigByCategory,
  updateConfig,
  updateConfigs,
} from "@/lib/services/platform-config";

/**
 * GET /api/admin/config
 * Get all platform configuration or filter by category
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") as
      | "general"
      | "payments"
      | "features"
      | "limits"
      | "notifications"
      | null;

    const config = category
      ? await getConfigByCategory(category)
      : await getAllConfig();

    return NextResponse.json({ config });
  } catch (error) {
    console.error("Error fetching config:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch config" },
      { status: error instanceof Error && error.message.includes("authentication") ? 401 : 500 }
    );
  }
}

/**
 * PATCH /api/admin/config
 * Update one or more config values
 * Body: { updates: [{ key: string, value: unknown }] }
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAdmin(request);

    const body = await request.json();
    const { updates } = body as { updates: Array<{ key: string; value: unknown }> };

    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json(
        { error: "updates array is required" },
        { status: 400 }
      );
    }

    // Validate each update
    for (const update of updates) {
      if (!update.key || update.value === undefined) {
        return NextResponse.json(
          { error: `Invalid update: key and value are required` },
          { status: 400 }
        );
      }
    }

    // If single update, use updateConfig
    let result;
    if (updates.length === 1) {
      result = await updateConfig(updates[0].key, updates[0].value, session.adminId);
    } else {
      result = await updateConfigs(updates, session.adminId);
    }

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    // Log the action
    await logAdminAction(session.adminId, "update_config", {
      targetType: "platform_config",
      metadata: {
        updates: updates.map((u) => ({ key: u.key, newValue: u.value })),
      },
      ipAddress: getClientIP(request),
      userAgent: request.headers.get("user-agent") || undefined,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating config:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update config" },
      { status: error instanceof Error && error.message.includes("authentication") ? 401 : 500 }
    );
  }
}
