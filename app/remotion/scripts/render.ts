import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import path from "path";
import type { BlogVideoInput } from "../src/utils/blogToScenes";

/**
 * Render a video from BlogVideoInput props
 */
export async function renderVideo(
  inputProps: BlogVideoInput,
  outputPath?: string
): Promise<string> {
  const outputLocation = outputPath || path.join(__dirname, "..", "out", `${inputProps.slug}.mp4`);

  console.log(`📦 Bundling Remotion project...`);
  const bundleLocation = await bundle({
    entryPoint: path.resolve(__dirname, "..", "src", "index.ts"),
    webpackOverride: (config) => config,
  });

  console.log(`🎬 Selecting composition...`);
  const composition = await selectComposition({
    serveUrl: bundleLocation,
    id: "KeyTakeawaysShort",
    inputProps: inputProps as unknown as Record<string, unknown>,
  });

  console.log(`🎥 Rendering video...`);
  console.log(`   Duration: ${(composition.durationInFrames / composition.fps).toFixed(1)}s`);
  console.log(`   Resolution: ${composition.width}x${composition.height}`);
  console.log(`   Output: ${outputLocation}`);

  await renderMedia({
    composition,
    serveUrl: bundleLocation,
    codec: "h264",
    outputLocation,
    inputProps: inputProps as unknown as Record<string, unknown>,
    chromiumOptions: {
      enableMultiProcessOnLinux: true,
    },
    onProgress: ({ progress }) => {
      const percent = Math.floor(progress * 100);
      process.stdout.write(`\r   Progress: ${percent}%`);
    },
  });

  console.log(`\n✅ Video rendered successfully!`);
  console.log(`   File: ${outputLocation}`);

  return outputLocation;
}

// Allow running directly
if (require.main === module) {
  const testProps: BlogVideoInput = {
    slug: "test-video",
    title: "How to Keep More of Your Tutoring Income",
    hook: "Are you losing $8,000/year to platform fees?",
    keyTakeaways: [
      "Platform fees eat 18-33% of every lesson",
      "Direct booking lets you keep 100% of income",
      "Students save money when you charge less",
    ],
    branding: {
      primaryColor: "#6366f1",
      secondaryColor: "#f59e0b",
      logo: "/logo.png",
      handle: "@tutorlingua",
    },
  };

  renderVideo(testProps)
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Render failed:", err);
      process.exit(1);
    });
}
