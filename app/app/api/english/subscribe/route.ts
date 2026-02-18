import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const SubscribeSchema = z.object({
  email: z.string().email(),
  source: z.string().optional().default("english-tools"),
  tool: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = SubscribeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    const { email, source, tool } = parsed.data;

    // Store in Supabase — gracefully handles missing table
    try {
      const supabase = await createClient();
      await supabase.from("english_tool_subscribers").upsert(
        {
          email,
          source,
          tool,
          subscribed_at: new Date().toISOString(),
        },
        { onConflict: "email", ignoreDuplicates: false }
      );
    } catch {
      // Table may not exist yet — log but don't block the user
      console.warn("[english/subscribe] Supabase upsert failed:", email);
    }

    // Optional: trigger welcome email via Resend
    try {
      const resendKey = process.env.RESEND_API_KEY;
      if (resendKey) {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "TutorLingua English <english@tutorlingua.co>",
            to: email,
            subject: "Welcome to TutorLingua English Tools 🎓",
            html: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
                <h1 style="font-size: 24px; color: #2D2A26; margin-bottom: 8px;">You're in! 🎓</h1>
                <p style="color: #6B6B6B; font-size: 16px; line-height: 1.6;">
                  Thanks for joining TutorLingua English Tools. You'll now receive:
                </p>
                <ul style="color: #6B6B6B; font-size: 16px; line-height: 2;">
                  <li>📖 A new advanced word every morning</li>
                  <li>🧩 Fresh phrasal verb challenges daily</li>
                  <li>🎯 English tips matched to your CEFR level</li>
                </ul>
                <a href="https://tutorlingua.co/english" style="display: inline-block; background: #D36135; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; margin-top: 16px;">
                  Explore the tools →
                </a>
                <p style="color: #9CA3AF; font-size: 12px; margin-top: 24px;">
                  Unsubscribe at any time. No spam, ever.
                </p>
              </div>
            `,
          }),
        });
      }
    } catch {
      // Email send failure doesn't block the response
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
