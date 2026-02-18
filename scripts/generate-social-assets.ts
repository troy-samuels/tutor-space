/**
 * Social Media Asset Generator using Google Gemini/Imagen API
 * 
 * Generates branded images for TutorLingua Games across:
 * - Telegram (bot avatar, preview images)
 * - Instagram (posts, stories)
 * - Facebook (group posts, covers)
 * - Twitter/X (cards)
 * - OG Images (link previews)
 * 
 * Usage:
 *   GOOGLE_API_KEY=xxx npx tsx scripts/generate-social-assets.ts
 * 
 * Requires: Google AI Studio API key with Gemini access
 * Get one free at: https://aistudio.google.com/apikey
 */

import * as fs from "fs";
import * as path from "path";

const API_KEY = process.env.GOOGLE_API_KEY;
const OUTPUT_DIR = path.join(__dirname, "..", "public", "social-assets");

if (!API_KEY) {
  console.error("❌ GOOGLE_API_KEY not set");
  console.error("Get one free at: https://aistudio.google.com/apikey");
  process.exit(1);
}

// Ensure output directory exists
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

/* ——— Prompt templates for each asset type ——— */

const PROMPTS = {
  // Telegram bot avatar (512x512, 1:1)
  telegramAvatar: {
    prompt: `A modern, playful app icon for a language learning game platform called "TutorLingua". 
Features a stylised puzzle piece merged with a speech bubble, in a gradient from warm gold (#C4A835) to deep purple (#8B5CB5). 
Clean vector-style illustration on a white background. 
Minimal, premium, Apple-quality app icon aesthetic. 
No text, no letters, just the icon symbol.`,
    model: "gemini-2.0-flash-exp",
    filename: "telegram-avatar.png",
  },

  // OG Image for games hub
  ogGamesHub: {
    prompt: `A premium social share card for "TutorLingua Games" - daily language learning word games.
Clean, modern design with a light warm grey (#F7F7F5) background.
Show 6 colourful game icons arranged in a 3x2 grid: puzzle piece, ladder, lock, magnifying glass, jigsaw piece, spiral.
Each icon in a different accent colour: gold, green, purple, orange, pink, blue.
Bold headline "Daily Language Games" in dark text. Subtitle "Play in 4 languages · Free · No ads"
Flag emojis for GB, Spain, France, Germany in a row.
Professional, NYT Games inspired aesthetic. 1200x630 pixels layout.`,
    model: "gemini-2.0-flash-exp",
    filename: "og-games-hub.png",
  },

  // Instagram post - "Can you solve this?"
  instagramChallenge: {
    prompt: `A vibrant Instagram post for a language learning game.
Show a 4x4 grid of word tiles on a clean white card, some tiles highlighted in gold, green, blue, purple.
Words visible on tiles: common English words mixed with Spanish words.
Bold text overlay at top: "Can you find the 4 hidden categories?" 
Bottom: "🧩 Lingua Connections · @tutorlingua.co"
Modern, clean, engaging design with warm colour palette.
Square format (1080x1080 pixels). Shadows and depth.`,
    model: "gemini-2.0-flash-exp",
    filename: "instagram-challenge.png",
  },

  // Instagram story - Daily puzzle teaser  
  instagramStory: {
    prompt: `A vertical Instagram Story graphic for a daily word puzzle game.
Dark gradient background (deep navy to purple).
Large emoji share grid in the center showing:
🟨🟨🟨🟨
🟩🟩🟩🟩
🟦🟦🟦🟦  
🟪🟪🟪🟪
Text above: "Today's Puzzle 🧩"
Text below: "Can you beat this score?"
Swipe up arrow at bottom with "Play Free"
TutorLingua branding. Tall portrait format (1080x1920).`,
    model: "gemini-2.0-flash-exp",
    filename: "instagram-story.png",
  },

  // Facebook group post
  facebookPost: {
    prompt: `A Facebook-optimised landscape graphic for a free language learning game.
Clean white background with warm grey (#F0F0EE) accent areas.
Left side: mockup of a mobile phone showing a word puzzle game interface.
Right side: headline "Free Daily Word Games for Language Learners" in bold dark text.
Bullet points with emoji: "🧩 6 games · 🌍 4 languages · 🔥 Daily streaks · 📊 Track progress"
Small TutorLingua logo at bottom.
Professional, trustworthy, educational feel. 1200x630 pixels.`,
    model: "gemini-2.0-flash-exp",
    filename: "facebook-post.png",
  },

  // Twitter/X card
  twitterCard: {
    prompt: `A Twitter summary card graphic for daily language learning games.
Minimal, clean design on light background.
Show 4 flag emojis (🇬🇧 🇪🇸 🇫🇷 🇩🇪) prominently.
Headline: "Daily word games for language learners"
Subtext: "Like NYT Games, but for every language"
Accent colour strip at bottom in warm gold.
1200x600 pixel layout, optimised for Twitter cards.`,
    model: "gemini-2.0-flash-exp",
    filename: "twitter-card.png",
  },

  // Per-game OG images
  ogConnections: {
    prompt: `Social share card for "Lingua Connections" word puzzle game.
Show a 4x4 grid of word tiles with 4 colour-coded categories (gold, green, blue, purple).
Title: "Lingua Connections" with puzzle piece emoji.
Subtitle: "Group 16 words into 4 hidden categories"
Clean, premium design. Light background. 1200x630 pixels.
TutorLingua branding at bottom right.`,
    model: "gemini-2.0-flash-exp",
    filename: "og-connections.png",
  },

  ogWordLadder: {
    prompt: `Social share card for "Word Ladder" word puzzle game.
Show a vertical chain of 4-letter words connected by arrows: COLD → CORD → WORD → WARD → WARM.
Changed letters highlighted in green.
Title: "Word Ladder" with ladder emoji.
Subtitle: "Change one letter at a time"
Clean, premium design. Light background. 1200x630 pixels.
TutorLingua branding at bottom right.`,
    model: "gemini-2.0-flash-exp",
    filename: "og-word-ladder.png",
  },

  ogDailyDecode: {
    prompt: `Social share card for "Daily Decode" cryptogram puzzle game.
Show encrypted text with some letters revealed, cipher wheel aesthetic.
Title: "Daily Decode" with lock emoji.
Subtitle: "Crack the cipher, reveal the quote"
Mysterious, intellectual feel. Deep purple accent colour.
Light background. 1200x630 pixels. TutorLingua branding.`,
    model: "gemini-2.0-flash-exp",
    filename: "og-daily-decode.png",
  },
};

/* ——— Gemini API call ——— */

async function generateImage(
  prompt: string,
  model: string,
  filename: string,
): Promise<string | null> {
  console.log(`🎨 Generating: ${filename}...`);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            responseModalities: ["TEXT", "IMAGE"],
            responseMimeType: "text/plain",
          },
        }),
      },
    );

    if (!response.ok) {
      const error = await response.text();
      console.error(`  ❌ API error for ${filename}: ${response.status} ${error}`);
      return null;
    }

    const data = await response.json();

    // Extract image from response
    const parts = data.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData?.mimeType?.startsWith("image/")) {
        const outputPath = path.join(OUTPUT_DIR, filename);
        const buffer = Buffer.from(part.inlineData.data, "base64");
        fs.writeFileSync(outputPath, buffer);
        console.log(`  ✅ Saved: ${outputPath} (${(buffer.length / 1024).toFixed(1)}KB)`);
        return outputPath;
      }
    }

    console.error(`  ❌ No image in response for ${filename}`);
    return null;
  } catch (error) {
    console.error(`  ❌ Error generating ${filename}:`, error);
    return null;
  }
}

/* ——— Main ——— */

async function main() {
  console.log("🖼️  TutorLingua Social Asset Generator");
  console.log("=====================================");
  console.log(`Output: ${OUTPUT_DIR}`);
  console.log("");

  const results: Record<string, string | null> = {};

  for (const [key, config] of Object.entries(PROMPTS)) {
    results[key] = await generateImage(config.prompt, config.model, config.filename);
    // Rate limit: wait 2 seconds between requests
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  console.log("");
  console.log("📊 Results:");
  console.log("===========");
  for (const [key, result] of Object.entries(results)) {
    console.log(`  ${result ? "✅" : "❌"} ${key}: ${result || "failed"}`);
  }

  const successCount = Object.values(results).filter(Boolean).length;
  console.log("");
  console.log(`Generated ${successCount}/${Object.keys(PROMPTS).length} assets`);
}

main().catch(console.error);
