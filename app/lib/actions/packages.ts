"use server";

import { createServiceRoleClient } from "@/lib/supabase/admin";

export type SessionPackage = {
  id: string;
  template_id: string;
  tutor_id: string;
  student_id: string;
  total_minutes: number;
  remaining_minutes: number;
  status: "active" | "paused" | "completed" | "refunded" | "expired";
  expires_at: string | null;
  purchased_at: string;
  template?: {
    name: string;
    description: string | null;
  };
};

type PackageRow = {
  id: string;
  template_id: string;
  tutor_id: string;
  student_id: string;
  total_minutes: number;
  remaining_minutes: number;
  status: SessionPackage["status"];
  expires_at: string | null;
  purchased_at: string;
  session_package_templates: {
    name: string;
    description: string | null;
  } | null;
};

/**
 * Get active packages for a student with a specific tutor
 */
export async function getActivePackages(
  studentId: string,
  tutorId: string
): Promise<SessionPackage[]> {
  const adminClient = createServiceRoleClient();

  if (!adminClient) {
    return [];
  }

  const now = new Date().toISOString();

  const { data, error } = await adminClient
    .from("session_package_purchases")
    .select(
      `
      id,
      template_id,
      tutor_id,
      student_id,
      total_minutes,
      remaining_minutes,
      status,
      expires_at,
      purchased_at,
      session_package_templates (
        name,
        description
      )
    `
    )
    .eq("student_id", studentId)
    .eq("tutor_id", tutorId)
    .eq("status", "active")
    .gt("remaining_minutes", 0)
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .order("expires_at", { ascending: true, nullsFirst: false });

  if (error) {
    console.error("Error fetching active packages:", error);
    return [];
  }

  return (
    data?.map((pkg) => {
      const record = pkg as PackageRow;
      return {
        id: record.id,
        template_id: record.template_id,
        tutor_id: record.tutor_id,
        student_id: record.student_id,
        total_minutes: record.total_minutes,
        remaining_minutes: record.remaining_minutes,
        status: record.status,
        expires_at: record.expires_at,
        purchased_at: record.purchased_at,
        template: record.session_package_templates || undefined,
      };
    }) || []
  );
}

/**
 * Redeem minutes from a package for a booking
 * Returns success status and new remaining minutes
 */
export async function redeemPackageMinutes(params: {
  packageId: string;
  bookingId: string;
  minutesToRedeem: number;
  tutorId: string;
}): Promise<{ success: boolean; error?: string; remainingMinutes?: number }> {
  const adminClient = createServiceRoleClient();

  if (!adminClient) {
    return { success: false, error: "Service unavailable" };
  }

  try {
    // 1. Get package and verify it has enough minutes
    const { data: packageData, error: packageError } = await adminClient
      .from("session_package_purchases")
      .select("id, remaining_minutes, status, expires_at, tutor_id")
      .eq("id", params.packageId)
      .eq("tutor_id", params.tutorId)
      .single();

    if (packageError || !packageData) {
      return { success: false, error: "Package not found" };
    }

    if (packageData.status !== "active") {
      return { success: false, error: "Package is not active" };
    }

    if (packageData.expires_at) {
      const expiryDate = new Date(packageData.expires_at);
      if (expiryDate < new Date()) {
        return { success: false, error: "Package has expired" };
      }
    }

    if (packageData.remaining_minutes < params.minutesToRedeem) {
      return {
        success: false,
        error: `Insufficient minutes. Package has ${packageData.remaining_minutes} minutes remaining.`,
      };
    }

    // 2. Create redemption record
    const { error: redemptionError } = await adminClient
      .from("session_package_redemptions")
      .insert({
        purchase_id: params.packageId,
        booking_id: params.bookingId,
        minutes_redeemed: params.minutesToRedeem,
        source: "booking",
        status: "applied",
      });

    if (redemptionError) {
      console.error("Error creating redemption record:", redemptionError);
      return { success: false, error: "Failed to create redemption record" };
    }

    // 3. Deduct minutes from package
    const newRemainingMinutes =
      packageData.remaining_minutes - params.minutesToRedeem;

    const { error: updateError } = await adminClient
      .from("session_package_purchases")
      .update({
        remaining_minutes: newRemainingMinutes,
        status: newRemainingMinutes === 0 ? "completed" : "active",
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.packageId)
      .eq("tutor_id", params.tutorId);

    if (updateError) {
      console.error("Error updating package minutes:", updateError);
      return { success: false, error: "Failed to update package" };
    }

    return {
      success: true,
      remainingMinutes: newRemainingMinutes,
    };
  } catch (error) {
    console.error("Error in redeemPackageMinutes:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Check if a student can use a package for a booking
 */
export async function canUsePackage(
  studentId: string,
  tutorId: string,
  durationMinutes: number
): Promise<{ canUse: boolean; packageId?: string; packageName?: string }> {
  const packages = await getActivePackages(studentId, tutorId);

  // Find first package with enough minutes
  const suitablePackage = packages.find(
    (pkg) => pkg.remaining_minutes >= durationMinutes
  );

  if (suitablePackage) {
    return {
      canUse: true,
      packageId: suitablePackage.id,
      packageName: suitablePackage.template?.name || "Session Package",
    };
  }

  return { canUse: false };
}

/**
 * Refund package minutes (e.g., when booking is cancelled)
 */
export async function refundPackageMinutes(
  bookingId: string
): Promise<{ success: boolean; error?: string }> {
  const adminClient = createServiceRoleClient();

  if (!adminClient) {
    return { success: false, error: "Service unavailable" };
  }

  try {
    // 1. Find redemption record for this booking
    const { data: redemption, error: redemptionError } = await adminClient
      .from("session_package_redemptions")
      .select("id, purchase_id, minutes_redeemed, status")
      .eq("booking_id", bookingId)
      .eq("status", "applied")
      .single();

    if (redemptionError || !redemption) {
      // No redemption found - booking wasn't paid with package
      return { success: true };
    }

    // 2. Get package
    const { data: packageData, error: packageError } = await adminClient
      .from("session_package_purchases")
      .select("id, remaining_minutes, status")
      .eq("id", redemption.purchase_id)
      .single();

    if (packageError || !packageData) {
      return { success: false, error: "Package not found" };
    }

    // 3. Return minutes to package
    const newRemainingMinutes =
      packageData.remaining_minutes + redemption.minutes_redeemed;

    const { error: updateError } = await adminClient
      .from("session_package_purchases")
      .update({
        remaining_minutes: newRemainingMinutes,
        status: packageData.status === "completed" ? "active" : packageData.status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", redemption.purchase_id);

    if (updateError) {
      console.error("Error refunding minutes:", updateError);
      return { success: false, error: "Failed to refund minutes" };
    }

    // 4. Mark redemption as refunded
    const { error: refundError } = await adminClient
      .from("session_package_redemptions")
      .update({ status: "refunded" })
      .eq("id", redemption.id);

    if (refundError) {
      console.error("Error marking redemption as refunded:", refundError);
    }

    return { success: true };
  } catch (error) {
    console.error("Error in refundPackageMinutes:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
