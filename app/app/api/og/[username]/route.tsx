/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from "next/og";
import { createClient } from "@/lib/supabase/server";

export const runtime = "edge";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  try {
    const supabase = await createClient();

    const { data: profile } = await supabase
      .from("public_profiles")
      .select(
        "full_name, username, tagline, avatar_url, languages_taught, average_rating, testimonial_count, total_students"
      )
      .eq("username", username.toLowerCase())
      .single();

    if (!profile) {
      return new Response("Tutor not found", { status: 404 });
    }

    const name = profile.full_name || profile.username || username;

    // Parse languages
    const languages = Array.isArray(profile.languages_taught)
      ? profile.languages_taught
      : profile.languages_taught
          ?.split(",")
          .map((lang: string) => lang.trim())
          .filter(Boolean) ?? [];

    const languagesText = languages.join(" • ") || "Language Tutor";

    // Generate rating stars
    const rating = profile.average_rating;
    const ratingText =
      rating && profile.testimonial_count
        ? `${"★".repeat(Math.round(rating))}${"☆".repeat(5 - Math.round(rating))} ${rating.toFixed(1)}`
        : null;

    const studentsText =
      profile.total_students && profile.total_students > 0
        ? `${profile.total_students}+ students`
        : null;

    return new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            height: "100%",
            background: "linear-gradient(135deg, #1e3a5f 0%, #0f172a 50%, #1e293b 100%)",
            padding: "60px",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          {/* Header with TutorLingua branding */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: "40px",
            }}
          >
            <span
              style={{
                color: "#60a5fa",
                fontSize: "24px",
                fontWeight: "600",
                letterSpacing: "0.05em",
              }}
            >
              TUTORLINGUA
            </span>
          </div>

          {/* Main content */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              flex: 1,
            }}
          >
            {/* Avatar */}
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={`${name} avatar`}
                width={180}
                height={180}
                style={{
                  borderRadius: "24px",
                  border: "4px solid rgba(96, 165, 250, 0.3)",
                  marginRight: "40px",
                  objectFit: "cover",
                }}
              />
            ) : (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "180px",
                  height: "180px",
                  borderRadius: "24px",
                  background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                  marginRight: "40px",
                  fontSize: "72px",
                  fontWeight: "700",
                  color: "white",
                }}
              >
                {name.slice(0, 1).toUpperCase()}
              </div>
            )}

            {/* Info */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                flex: 1,
              }}
            >
              <h1
                style={{
                  fontSize: "56px",
                  fontWeight: "700",
                  color: "white",
                  margin: "0 0 16px 0",
                  lineHeight: 1.1,
                }}
              >
                {name}
              </h1>

              <p
                style={{
                  fontSize: "28px",
                  color: "#60a5fa",
                  margin: "0 0 24px 0",
                  fontWeight: "500",
                }}
              >
                {languagesText} Tutor
              </p>

              {/* Stats row */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "24px",
                }}
              >
                {ratingText && (
                  <span
                    style={{
                      fontSize: "24px",
                      color: "#fbbf24",
                      fontWeight: "500",
                    }}
                  >
                    {ratingText}
                  </span>
                )}
                {studentsText && (
                  <span
                    style={{
                      fontSize: "24px",
                      color: "rgba(255, 255, 255, 0.7)",
                    }}
                  >
                    {studentsText}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: "40px",
              paddingTop: "24px",
              borderTop: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            <span
              style={{
                fontSize: "20px",
                color: "rgba(255, 255, 255, 0.6)",
              }}
            >
              tutorlingua.co/{profile.username || username}
            </span>
            <span
              style={{
                fontSize: "18px",
                color: "#60a5fa",
                padding: "12px 24px",
                border: "2px solid #60a5fa",
                borderRadius: "9999px",
                fontWeight: "600",
              }}
            >
              Book a Lesson
            </span>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error("OG Image generation error:", error);
    return new Response("Error generating image", { status: 500 });
  }
}
