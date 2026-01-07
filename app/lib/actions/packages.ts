"use server";

import { createServiceRoleClient } from "@/lib/supabase/admin";
import type { ActivePackage } from "@/lib/actions/types";

/**
 * Gets active session packages for a student with a specific tutor.
 * Returns packages that have remaining minutes and haven't expired.
 */
export async function getActivePackages(
  studentId: string,
  tutorId: string
): Promise<ActivePackage[]> {
  const supabase = createServiceRoleClient();

  if (!supabase) {
    console.error("[packages] Failed to create admin client");
    return [];
  }

  try {
    // Get all purchases for this student from this tutor's packages
    // Include redemptions in a single query to avoid N+1
    const { data: purchases, error: purchaseError } = await supabase
      .from("session_package_purchases")
      .select(`
        id,
        remaining_minutes,
        expires_at,
        status,
        package:session_package_templates (
          id,
          name,
          total_minutes,
          tutor_id
        ),
        redemptions:session_package_redemptions (
          minutes_redeemed,
          refunded_at
        )
      `)
      .eq("student_id", studentId)
      .eq("status", "active")
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);

    if (purchaseError) {
      console.error("[packages] Error fetching purchases:", purchaseError);
      return [];
    }

    if (!purchases || purchases.length === 0) {
      return [];
    }

    // Filter to only packages from this tutor and calculate redeemed minutes
    const activePackages: ActivePackage[] = [];

    for (const purchase of purchases) {
      // Supabase returns joined data - handle both single object and array cases
      const pkgData = purchase.package;
      const pkg = Array.isArray(pkgData) ? pkgData[0] : pkgData as {
        id: string;
        name: string;
        total_minutes: number;
        tutor_id: string;
      } | null;

      if (!pkg || pkg.tutor_id !== tutorId) {
        continue;
      }

      // Calculate redeemed minutes from embedded redemptions (excludes refunded)
      const redemptionsData = purchase.redemptions as Array<{
        minutes_redeemed: number | null;
        refunded_at: string | null;
      }> | null;

      const redeemedMinutes = redemptionsData?.reduce(
        (sum, r) => sum + (r.refunded_at === null ? (r.minutes_redeemed || 0) : 0),
        0
      ) || 0;

      const remainingMinutes = pkg.total_minutes - redeemedMinutes;

      if (remainingMinutes > 0) {
        activePackages.push({
          id: pkg.id,
          name: pkg.name,
          remaining_minutes: remainingMinutes,
          expires_at: purchase.expires_at,
          purchase_id: purchase.id,
          total_minutes: pkg.total_minutes,
          redeemed_minutes: redeemedMinutes,
        });
      }
    }

    return activePackages;
  } catch (err) {
    console.error("[packages] Unexpected error in getActivePackages:", err);
    return [];
  }
}

/**
 * Redeems package minutes for a booking.
 * Creates a redemption record and validates sufficient minutes.
 */
export async function redeemPackageMinutes({
  packageId,
  bookingId,
  minutesToRedeem,
  tutorId,
  studentId,
  purchaseId,
}: {
  packageId: string;
  bookingId: string;
  minutesToRedeem: number;
  tutorId: string;
  studentId?: string;
  purchaseId?: string;
}): Promise<{
  success: boolean;
  error?: string;
  redemptionId?: string;
  purchaseId?: string;
  remainingMinutes?: number;
  packageName?: string | null;
  packageTotalMinutes?: number;
  packageSessionCount?: number | null;
}> {
  const supabase = createServiceRoleClient();

  if (!supabase) {
    return { success: false, error: "Service unavailable" };
  }

  if (minutesToRedeem <= 0) {
    return { success: false, error: "Minutes to redeem must be positive" };
  }

  try {
    // If purchaseId not provided, find the best package purchase to use
    let targetPurchaseId = purchaseId;

    if (!targetPurchaseId && studentId) {
      const activePackages = await getActivePackages(studentId, tutorId);
      const suitablePackage = activePackages.find(
        (p) => p.id === packageId && p.remaining_minutes >= minutesToRedeem
      );

      if (!suitablePackage) {
        return {
          success: false,
          error: "No suitable package found with sufficient minutes",
        };
      }

      targetPurchaseId = suitablePackage.purchase_id;
    }

    if (!targetPurchaseId) {
      return { success: false, error: "Package purchase not found" };
    }

    // Verify the purchase exists and has sufficient minutes
    const { data: purchase, error: purchaseError } = await supabase
      .from("session_package_purchases")
      .select(`
        id,
        status,
        expires_at,
        package:session_package_templates (
          id,
          name,
          total_minutes,
          session_count,
          tutor_id
        )
      `)
      .eq("id", targetPurchaseId)
      .single();

    if (purchaseError || !purchase) {
      return { success: false, error: "Package purchase not found" };
    }

    // Supabase returns joined data - handle both single object and array cases
    const pkgData = purchase.package;
    const pkg = Array.isArray(pkgData) ? pkgData[0] : pkgData as {
      id: string;
      name?: string | null;
      total_minutes: number;
      session_count?: number | null;
      tutor_id: string;
    } | null;

    if (!pkg || pkg.tutor_id !== tutorId) {
      return { success: false, error: "Package does not belong to this tutor" };
    }

    if (purchase.status !== "active") {
      return { success: false, error: "Package is not active" };
    }

    if (purchase.expires_at && new Date(purchase.expires_at) < new Date()) {
      return { success: false, error: "Package has expired" };
    }

    // Calculate current remaining minutes
    const { data: existingRedemptions } = await supabase
      .from("session_package_redemptions")
      .select("minutes_redeemed")
      .eq("purchase_id", targetPurchaseId)
      .is("refunded_at", null);

    const totalRedeemed = existingRedemptions?.reduce(
      (sum, r) => sum + (r.minutes_redeemed || 0),
      0
    ) || 0;

    const remainingMinutes = pkg.total_minutes - totalRedeemed;

    if (remainingMinutes < minutesToRedeem) {
      return {
        success: false,
        error: `Insufficient minutes. Available: ${remainingMinutes}, Requested: ${minutesToRedeem}`,
      };
    }

    // Check if this booking already has a redemption (prevent duplicates)
    const { data: existingBookingRedemption } = await supabase
      .from("session_package_redemptions")
      .select("id")
      .eq("booking_id", bookingId)
      .is("refunded_at", null)
      .single();

    if (existingBookingRedemption) {
      return {
        success: false,
        error: "This booking already has minutes redeemed",
      };
    }

    // Create the redemption record
    const { data: redemption, error: insertError } = await supabase
      .from("session_package_redemptions")
      .insert({
        purchase_id: targetPurchaseId,
        booking_id: bookingId,
        minutes_redeemed: minutesToRedeem,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("[packages] Failed to create redemption:", insertError);
      return { success: false, error: "Failed to redeem package minutes" };
    }

    // Update the purchase's remaining_minutes for quick lookups
    await supabase
      .from("session_package_purchases")
      .update({
        remaining_minutes: remainingMinutes - minutesToRedeem,
        updated_at: new Date().toISOString(),
      })
      .eq("id", targetPurchaseId);

    console.log(
      `✅ Redeemed ${minutesToRedeem} minutes from purchase ${targetPurchaseId} for booking ${bookingId}`
    );

    return {
      success: true,
      redemptionId: redemption.id,
      purchaseId: targetPurchaseId,
      remainingMinutes: remainingMinutes - minutesToRedeem,
      packageName: pkg.name ?? null,
      packageTotalMinutes: pkg.total_minutes,
      packageSessionCount: pkg.session_count ?? null,
    };
  } catch (err) {
    console.error("[packages] Unexpected error in redeemPackageMinutes:", err);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Refunds package minutes for a cancelled booking.
 * Marks the redemption as refunded and restores minutes to the purchase.
 */
export async function refundPackageMinutes(
  bookingId: string
): Promise<{ success: boolean; error?: string; refundedMinutes?: number }> {
  const supabase = createServiceRoleClient();

  if (!supabase) {
    return { success: false, error: "Service unavailable" };
  }

  try {
    // Find the redemption for this booking
    const { data: redemption, error: findError } = await supabase
      .from("session_package_redemptions")
      .select("id, purchase_id, minutes_redeemed")
      .eq("booking_id", bookingId)
      .is("refunded_at", null)
      .single();

    if (findError || !redemption) {
      // No redemption found - this booking wasn't paid with a package
      // This is not an error, just nothing to refund
      console.log(`[packages] No package redemption found for booking ${bookingId}`);
      return { success: true, refundedMinutes: 0 };
    }

    // Mark the redemption as refunded
    const { error: updateError } = await supabase
      .from("session_package_redemptions")
      .update({ refunded_at: new Date().toISOString() })
      .eq("id", redemption.id);

    if (updateError) {
      console.error("[packages] Failed to mark redemption as refunded:", updateError);
      return { success: false, error: "Failed to process refund" };
    }

    // Restore minutes to the purchase
    const { data: purchase } = await supabase
      .from("session_package_purchases")
      .select("remaining_minutes")
      .eq("id", redemption.purchase_id)
      .single();

    if (purchase) {
      await supabase
        .from("session_package_purchases")
        .update({
          remaining_minutes: (purchase.remaining_minutes || 0) + redemption.minutes_redeemed,
          updated_at: new Date().toISOString(),
        })
        .eq("id", redemption.purchase_id);
    }

    console.log(
      `✅ Refunded ${redemption.minutes_redeemed} minutes for booking ${bookingId}`
    );

    return { success: true, refundedMinutes: redemption.minutes_redeemed };
  } catch (err) {
    console.error("[packages] Unexpected error in refundPackageMinutes:", err);
    return { success: false, error: "An unexpected error occurred" };
  }
}
