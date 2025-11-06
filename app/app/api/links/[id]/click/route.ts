import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const adminClient = createServiceRoleClient();

  if (!adminClient) {
    console.error("[Links] Service role client unavailable");
    return NextResponse.json({ success: false }, { status: 500 });
  }

  const { data: link, error: linkError } = await adminClient
    .from("links")
    .select("click_count, tutor_id, is_visible")
    .eq("id", params.id)
    .single();

  if (linkError) {
    console.error("[Links] Failed to fetch link for click tracking", {
      linkId: params.id,
      error: linkError.message,
    });
  }

  if (!link || link.is_visible === false) {
    return NextResponse.json({ success: false }, { status: 200 });
  }

  const { error: updateError } = await adminClient
    .from("links")
    .update({
      click_count: (link.click_count ?? 0) + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("id", params.id)
    .eq("tutor_id", link.tutor_id);

  if (updateError) {
    console.error("[Links] Failed to increment click count", {
      linkId: params.id,
      error: updateError.message,
    });
    return NextResponse.json({ success: false }, { status: 500 });
  }

  const userAgent = request.headers.get("user-agent") ?? null;
  const referer = request.headers.get("referer") ?? null;
  const forwardedFor = request.headers.get("x-forwarded-for") ?? null;

  const { error: logError } = await adminClient.from("link_events").insert({
    link_id: params.id,
    tutor_id: link.tutor_id,
    clicked_at: new Date().toISOString(),
    user_agent: userAgent,
    referer,
    ip_address: forwardedFor?.split(",")[0]?.trim() ?? null,
  });

  if (logError) {
    console.error("[Links] Failed to log link click event", {
      linkId: params.id,
      error: logError.message,
    });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
