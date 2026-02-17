/**
 * GET /api/import/status?id={importId}
 *
 * Polls the status of an ongoing profile import.
 * Returns the current status and, when complete, the mapped data
 * ready for the review screen.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PLATFORM_LABELS } from "@/lib/import/resolve-platform";
import type { ImportStatus, MappedPageBuilderData, NormalisedProfile } from "@/lib/import/types";

type StatusResponse = {
  importId: string;
  platform: string;
  platformLabel: string;
  status: ImportStatus;
  error?: string;
  /** Available when status = 'mapped' or 'applied' */
  mappedData?: MappedPageBuilderData;
  /** Available when status >= 'scraped' — summary stats for the loading screen */
  scrapeSummary?: {
    displayName: string;
    avatarUrl: string | null;
    rating: number | null;
    reviewCount: number;
    serviceCount: number;
    languageCount: number;
    hasVideo: boolean;
  };
};

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const importId = searchParams.get("id");

    if (!importId) {
      return NextResponse.json(
        { error: "Missing import ID." },
        { status: 400 }
      );
    }

    // Fetch import record (RLS ensures only owner can see it)
    const { data: record, error } = await supabase
      .from("profile_imports")
      .select(
        "id, platform, status, error_message, normalised_data, confirmed_data"
      )
      .eq("id", importId)
      .single();

    if (error || !record) {
      return NextResponse.json(
        { error: "Import not found." },
        { status: 404 }
      );
    }

    const platform = record.platform as keyof typeof PLATFORM_LABELS;

    const response: StatusResponse = {
      importId: record.id,
      platform: record.platform,
      platformLabel: PLATFORM_LABELS[platform] || record.platform,
      status: record.status as ImportStatus,
    };

    // Include error if failed
    if (record.status === "failed" && record.error_message) {
      response.error = record.error_message;
    }

    // Include scrape summary once we have normalised data
    const normalised = record.normalised_data as NormalisedProfile | null;
    if (
      normalised &&
      typeof normalised === "object" &&
      "displayName" in normalised
    ) {
      response.scrapeSummary = {
        displayName: normalised.displayName,
        avatarUrl: normalised.avatarUrl,
        rating: normalised.rating,
        reviewCount: normalised.reviews?.length || 0,
        serviceCount: normalised.services?.length || 0,
        languageCount: normalised.languagesTaught?.length || 0,
        hasVideo: !!normalised.introVideoUrl,
      };
    }

    // Include mapped data when ready for review
    if (
      (record.status === "mapped" || record.status === "applied") &&
      record.confirmed_data
    ) {
      response.mappedData =
        record.confirmed_data as MappedPageBuilderData;
    }

    return NextResponse.json(response);
  } catch (err) {
    console.error("[import/status] Error:", err);
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}
