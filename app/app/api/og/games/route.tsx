import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "edge";

const GAMES = [
  { emoji: "🧩", name: "Connections", color: "#C4A835" },
  { emoji: "🪜", name: "Word Ladder", color: "#0D9668" },
  { emoji: "🔐", name: "Daily Decode", color: "#8B5CB5" },
  { emoji: "🎯", name: "Odd One Out", color: "#D48C09" },
  { emoji: "📝", name: "Missing Piece", color: "#C93D82" },
  { emoji: "🌀", name: "Synonym Spiral", color: "#7C4FD0" },
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const game = searchParams.get("game");

  // If specific game, show that game's card
  if (game) {
    const gameInfo = GAMES.find(
      (g) => g.name.toLowerCase().replace(/\s+/g, "-") === game,
    );
    if (gameInfo) {
      return new ImageResponse(
        (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              background: "#F7F7F5",
              fontFamily: "system-ui, -apple-system, sans-serif",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "20px",
                marginBottom: "24px",
              }}
            >
              <span style={{ fontSize: "80px" }}>{gameInfo.emoji}</span>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span
                  style={{
                    fontSize: "48px",
                    fontWeight: 800,
                    color: "#1A1A1B",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {gameInfo.name}
                </span>
                <span
                  style={{
                    fontSize: "22px",
                    color: "#5A5A5C",
                    marginTop: "4px",
                  }}
                >
                  Daily puzzle · Free · 4 languages
                </span>
              </div>
            </div>
            <div
              style={{
                display: "flex",
                gap: "12px",
                marginTop: "16px",
              }}
            >
              {["🇬🇧", "🇪🇸", "🇫🇷", "🇩🇪"].map((flag) => (
                <span key={flag} style={{ fontSize: "36px" }}>
                  {flag}
                </span>
              ))}
            </div>
            <div
              style={{
                position: "absolute",
                bottom: "40px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                color: "#939598",
                fontSize: "18px",
              }}
            >
              <span>tutorlingua.co/games</span>
            </div>
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: "6px",
                background: gameInfo.color,
              }}
            />
          </div>
        ),
        { width: 1200, height: 630 },
      );
    }
  }

  // Default: show all games
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#F7F7F5",
          fontFamily: "system-ui, -apple-system, sans-serif",
          padding: "60px 80px",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginBottom: "40px",
          }}
        >
          <span
            style={{
              fontSize: "52px",
              fontWeight: 800,
              color: "#1A1A1B",
              letterSpacing: "-0.02em",
            }}
          >
            TutorLingua Games
          </span>
          <span
            style={{
              fontSize: "24px",
              color: "#5A5A5C",
              marginTop: "8px",
            }}
          >
            Daily word puzzles for language learners · Free · No ads
          </span>
        </div>

        {/* Games grid — 3x2 */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "20px",
            flex: 1,
          }}
        >
          {GAMES.map((g) => (
            <div
              key={g.name}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                background: "#FFFFFF",
                borderRadius: "16px",
                padding: "20px 28px",
                width: "320px",
                border: "1px solid rgba(0,0,0,0.08)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              }}
            >
              <span style={{ fontSize: "36px" }}>{g.emoji}</span>
              <span
                style={{
                  fontSize: "20px",
                  fontWeight: 700,
                  color: "#1A1A1B",
                }}
              >
                {g.name}
              </span>
            </div>
          ))}
        </div>

        {/* Footer flags */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: "24px",
          }}
        >
          <div style={{ display: "flex", gap: "12px" }}>
            {["🇬🇧", "🇪🇸", "🇫🇷", "🇩🇪"].map((flag) => (
              <span key={flag} style={{ fontSize: "32px" }}>
                {flag}
              </span>
            ))}
          </div>
          <span
            style={{
              fontSize: "18px",
              color: "#939598",
            }}
          >
            tutorlingua.co/games
          </span>
        </div>

        {/* Bottom accent bar */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "6px",
            background:
              "linear-gradient(90deg, #C4A835, #0D9668, #8B5CB5, #D48C09, #C93D82, #7C4FD0)",
          }}
        />
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
