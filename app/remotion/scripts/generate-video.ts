#!/usr/bin/env ts-node

import path from "path";
import fs from "fs";
import { getVideoInputFromSlug } from "../src/utils/blogToScenes";
import { renderVideo } from "./render";

/**
 * CLI script to generate a video from a blog post slug
 *
 * Usage:
 *   npx ts-node scripts/generate-video.ts --slug="reduce-tutoring-platform-fees" --locale="en"
 *   npx ts-node scripts/generate-video.ts --slug="reduce-tutoring-platform-fees"
 */

function parseArgs(): { slug: string; locale: string; output?: string } {
  const args = process.argv.slice(2);
  const parsed: Record<string, string> = {};

  for (const arg of args) {
    const match = arg.match(/^--(\w+)=(.+)$/);
    if (match) {
      parsed[match[1]] = match[2].replace(/^["']|["']$/g, "");
    }
  }

  if (!parsed.slug) {
    console.error("Error: --slug is required");
    console.log("\nUsage:");
    console.log('  npx ts-node scripts/generate-video.ts --slug="reduce-tutoring-platform-fees"');
    console.log('  npx ts-node scripts/generate-video.ts --slug="reduce-tutoring-platform-fees" --locale="es"');
    console.log('  npx ts-node scripts/generate-video.ts --slug="reduce-tutoring-platform-fees" --output="./custom-output.mp4"');
    process.exit(1);
  }

  return {
    slug: parsed.slug,
    locale: parsed.locale || "en",
    output: parsed.output,
  };
}

async function main() {
  const { slug, locale, output } = parseArgs();

  console.log(`\n🎬 Generating video for blog post`);
  console.log(`   Slug: ${slug}`);
  console.log(`   Locale: ${locale}`);

  // Load blog post and convert to video input
  const videoInput = getVideoInputFromSlug(slug, locale);

  if (!videoInput) {
    console.error(`\n❌ Blog post not found: ${slug} (locale: ${locale})`);
    process.exit(1);
  }

  console.log(`\n📝 Blog Post Details:`);
  console.log(`   Title: ${videoInput.title}`);
  console.log(`   Hook: ${videoInput.hook}`);
  console.log(`   Key Takeaways:`);
  videoInput.keyTakeaways.forEach((t, i) => {
    console.log(`     ${i + 1}. ${t}`);
  });

  // Ensure output directory exists
  const outDir = path.join(__dirname, "..", "out");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // Determine output path
  const outputPath = output || path.join(outDir, `${slug}.mp4`);

  // Render the video
  try {
    await renderVideo(videoInput, outputPath);
    console.log(`\n🎉 Video generated successfully!`);
    console.log(`   Output: ${outputPath}`);
  } catch (error) {
    console.error(`\n❌ Video generation failed:`, error);
    process.exit(1);
  }
}

main();
