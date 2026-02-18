import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { badRequest, internalError, rateLimited } from "@/lib/api/error-responses";
import { RateLimiters } from "@/lib/middleware/rate-limit";
import { createClient } from "@/lib/supabase/server";
import { isValidToolLang, type ToolLang } from "@/lib/tools/types";

const TOOL_SLUGS = ["level-test", "daily-challenge", "vocab"] as const;

const subscribeSchema = z
  .object({
    email: z.string().trim().email("Please enter a valid email address."),
    lang: z.string().trim().optional(),
    tool: z.enum(TOOL_SLUGS).optional(),
  })
  .strict();

type SubscribePayload = z.infer<typeof subscribeSchema>;

function resolveLang(lang: SubscribePayload["lang"]): ToolLang {
  return lang && isValidToolLang(lang) ? lang : "en";
}

function resolveSource(tool: SubscribePayload["tool"], lang: ToolLang) {
  return tool ? `tools-${tool}-${lang}` : `tools-${lang}`;
}

export async function POST(request: NextRequest) {
  const rateLimitResult = await RateLimiters.api(request);
  if (!rateLimitResult.success) {
    return rateLimited(rateLimitResult.error || "Too many requests. Please try again.");
  }

  let payload: SubscribePayload;
  try {
    const parsed = subscribeSchema.safeParse(await request.json());
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0]?.message ?? "Invalid request.";
      return badRequest(firstIssue);
    }
    payload = parsed.data;
  } catch {
    return badRequest("Invalid request payload.");
  }

  try {
    const supabase = await createClient();
    const lang = resolveLang(payload.lang);
    const email = payload.email.toLowerCase();

    const { error } = await supabase
      .from("english_tool_subscribers")
      .insert({
        email,
        tool: payload.tool ?? null,
        source: resolveSource(payload.tool, lang),
      });

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({
          success: true,
          status: "already_subscribed",
          message: "You're already subscribed. We'll keep sending updates.",
        });
      }

      console.error("[Tools Subscribe] Failed to store email", error);
      return internalError("Unable to save your email right now. Please try again.");
    }

    return NextResponse.json({
      success: true,
      status: "subscribed",
      message: "You're in. Check your inbox for your learner updates.",
    });
  } catch (error) {
    console.error("[Tools Subscribe] Unexpected error", error);
    return internalError("Unable to save your email right now. Please try again.");
  }
}
