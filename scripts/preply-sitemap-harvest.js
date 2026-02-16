#!/usr/bin/env node
/**
 * Preply Sitemap Tutor ID Harvester
 * 
 * Downloads all 8 tutor profile sitemaps from Preply's S3-hosted XML files
 * and extracts every tutor ID. No rate limiting on sitemap fetches.
 * 
 * Output: scraped-data/preply-all-tutor-ids.json
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '..', 'scraped-data');
const SITEMAP_COUNT = 8; // 0 through 7

function fetch(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'Accept': '*/*' } }, (res) => {
      // Follow redirects (sitemaps redirect to S3)
      if (res.statusCode === 301 || res.statusCode === 302) {
        return fetch(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.setTimeout(30000, () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

async function harvestSitemaps() {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const allTutors = [];
  let totalUrls = 0;

  for (let i = 0; i < SITEMAP_COUNT; i++) {
    const url = `https://preply.com/en-sitemap-tutor-profiles-${i}.xml`;
    process.stdout.write(`📥 Fetching sitemap ${i}... `);
    
    try {
      const xml = await fetch(url);
      // Extract tutor IDs from <loc>https://preply.com/en/tutor/XXXXX</loc>
      const matches = [...xml.matchAll(/<loc>https:\/\/preply\.com\/en\/tutor\/(\d+)<\/loc>/g)];
      const ids = matches.map(m => parseInt(m[1]));
      
      // Also extract lastmod dates
      const entries = [];
      const urlBlocks = xml.split('</url>');
      for (const block of urlBlocks) {
        const idMatch = block.match(/<loc>https:\/\/preply\.com\/en\/tutor\/(\d+)<\/loc>/);
        const dateMatch = block.match(/<lastmod>(\d{4}-\d{2}-\d{2})<\/lastmod>/);
        if (idMatch) {
          entries.push({
            id: parseInt(idMatch[1]),
            lastmod: dateMatch ? dateMatch[1] : null,
            url: `https://preply.com/en/tutor/${idMatch[1]}`
          });
        }
      }
      
      allTutors.push(...entries);
      totalUrls += entries.length;
      console.log(`${entries.length} tutors (running total: ${totalUrls})`);
    } catch (err) {
      console.log(`❌ Error: ${err.message}`);
    }
  }

  // Deduplicate by ID
  const seen = new Set();
  const unique = allTutors.filter(t => {
    if (seen.has(t.id)) return false;
    seen.add(t.id);
    return true;
  });

  // Sort by ID
  unique.sort((a, b) => a.id - b.id);

  // Save full data
  const fullPath = path.join(OUTPUT_DIR, 'preply-all-tutor-ids.json');
  fs.writeFileSync(fullPath, JSON.stringify(unique, null, 2));

  // Save just IDs for quick reference
  const idsPath = path.join(OUTPUT_DIR, 'preply-ids-only.json');
  fs.writeFileSync(idsPath, JSON.stringify(unique.map(t => t.id)));

  // Stats
  const recentlyActive = unique.filter(t => t.lastmod && t.lastmod >= '2026-02-01').length;
  const veryRecent = unique.filter(t => t.lastmod && t.lastmod >= '2026-02-10').length;

  console.log(`\n✅ Harvested ${unique.length} unique Preply tutor IDs`);
  console.log(`   Recently active (Feb 2026): ${recentlyActive}`);
  console.log(`   Very recent (last 4 days): ${veryRecent}`);
  console.log(`   ID range: ${unique[0].id} — ${unique[unique.length - 1].id}`);
  console.log(`   Saved to: ${fullPath}`);
  console.log(`   IDs only: ${idsPath}`);
}

harvestSitemaps().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
