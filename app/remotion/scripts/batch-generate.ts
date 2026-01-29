#!/usr/bin/env ts-node

import path from "path";
import fs from "fs";
import { listBlogSlugs, getVideoInputFromSlug } from "../src/utils/blogToScenes";
import { renderVideo } from "./render";

/**
 * CLI script to batch generate videos for a cluster of blog posts
 *
 * Usage:
 *   npx ts-node scripts/batch-generate.ts --cluster="cluster-1-commissions" --locale="en"
 *   npx ts-node scripts/batch-generate.ts --cluster="cluster-2-tools" --locale="es"
 *   npx ts-node scripts/batch-generate.ts --cluster="cluster-1-commissions" --limit=3
 */

function parseArgs(): {
  cluster: string;
  locale: string;
  limit?: number;
  skip?: number;
} {
  const args = process.argv.slice(2);
  const parsed: Record<string, string> = {};

  for (const arg of args) {
    const match = arg.match(/^--(\w+)=(.+)$/);
    if (match) {
      parsed[match[1]] = match[2].replace(/^["']|["']$/g, "");
    }
  }

  if (!parsed.cluster) {
    console.error("Error: --cluster is required");
    console.log("\nUsage:");
    console.log('  npx ts-node scripts/batch-generate.ts --cluster="cluster-1-commissions"');
    console.log('  npx ts-node scripts/batch-generate.ts --cluster="cluster-2-tools" --locale="es"');
    console.log('  npx ts-node scripts/batch-generate.ts --cluster="cluster-1-commissions" --limit=3');
    console.log('  npx ts-node scripts/batch-generate.ts --cluster="cluster-1-commissions" --skip=2 --limit=3');
    console.log("\nAvailable clusters:");
    console.log("  - cluster-1-commissions");
    console.log("  - cluster-2-tools");
    console.log("  - cluster-3-business");
    console.log("  - cluster-4-retention");
    console.log("  - cluster-5-marketing");
    console.log("  - cluster-6-specializations");
    console.log("  - cluster-7-operations");
    process.exit(1);
  }

  return {
    cluster: parsed.cluster,
    locale: parsed.locale || "en",
    limit: parsed.limit ? parseInt(parsed.limit, 10) : undefined,
    skip: parsed.skip ? parseInt(parsed.skip, 10) : 0,
  };
}

async function main() {
  const { cluster, locale, limit, skip = 0 } = parseArgs();

  console.log(`\n🎬 Batch Video Generation`);
  console.log(`   Cluster: ${cluster}`);
  console.log(`   Locale: ${locale}`);
  if (limit) console.log(`   Limit: ${limit}`);
  if (skip) console.log(`   Skip: ${skip}`);

  // Get all slugs for the cluster
  const allSlugs = listBlogSlugs(cluster, locale);

  if (allSlugs.length === 0) {
    console.error(`\n❌ No blog posts found in cluster: ${cluster} (locale: ${locale})`);
    process.exit(1);
  }

  // Apply skip and limit
  const slugs = allSlugs.slice(skip, limit ? skip + limit : undefined);

  console.log(`\n📝 Found ${allSlugs.length} blog posts, processing ${slugs.length}`);
  slugs.forEach((s, i) => console.log(`   ${i + 1}. ${s}`));

  // Ensure output directory exists
  const outDir = path.join(__dirname, "..", "out", cluster);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // Track results
  const results: {
    slug: string;
    success: boolean;
    error?: string;
    outputPath?: string;
  }[] = [];

  // Process each slug
  for (let i = 0; i < slugs.length; i++) {
    const slug = slugs[i];
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📹 Processing ${i + 1}/${slugs.length}: ${slug}`);

    try {
      const videoInput = getVideoInputFromSlug(slug, locale);

      if (!videoInput) {
        console.error(`   ⚠️ Skipping: Could not load blog post`);
        results.push({ slug, success: false, error: "Blog post not found" });
        continue;
      }

      console.log(`   Title: ${videoInput.title.slice(0, 50)}...`);

      const outputPath = path.join(outDir, `${slug}.mp4`);
      await renderVideo(videoInput, outputPath);

      results.push({ slug, success: true, outputPath });
      console.log(`   ✅ Success!`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`   ❌ Failed: ${errorMessage}`);
      results.push({ slug, success: false, error: errorMessage });
    }
  }

  // Summary
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`\n📊 Batch Generation Summary`);

  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  console.log(`   Total: ${results.length}`);
  console.log(`   ✅ Success: ${successful.length}`);
  console.log(`   ❌ Failed: ${failed.length}`);

  if (successful.length > 0) {
    console.log(`\n✅ Successfully generated:`);
    successful.forEach((r) => console.log(`   - ${r.slug}`));
  }

  if (failed.length > 0) {
    console.log(`\n❌ Failed to generate:`);
    failed.forEach((r) => console.log(`   - ${r.slug}: ${r.error}`));
  }

  console.log(`\n📁 Output directory: ${outDir}`);

  // Exit with error code if any failed
  if (failed.length > 0) {
    process.exit(1);
  }
}

main();
