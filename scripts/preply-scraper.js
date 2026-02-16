#!/usr/bin/env node
/**
 * Preply Teacher ID Extractor
 * 
 * Strategy: Preply uses Cloudflare protection, so we can't just curl the pages.
 * Instead we extract tutor IDs from the listing pages using a headless approach,
 * then fetch individual profile pages for JSON-LD structured data.
 * 
 * For now: extract tutor IDs from listing page HTML (the listing pages DO render
 * server-side and include tutor profile links).
 * 
 * Alternative: Use Puppeteer/Playwright to bypass Cloudflare.
 * 
 * This script extracts what we CAN get from the server-rendered listing pages.
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '..', 'scraped-data');
const MAX_PAGES = parseInt(process.argv[2]) || 100;
const DELAY_MS = 2000;

function fetch(url) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-GB,en;q=0.9',
      }
    };
    
    const req = https.get(url, options, (res) => {
      // Follow redirects
      if (res.statusCode === 301 || res.statusCode === 302) {
        return fetch(res.headers.location).then(resolve).catch(reject);
      }
      
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function extractTutorIds() {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  
  const allIds = new Set();
  let cfBlocked = 0;
  
  console.log(`\n🎯 Extracting Preply tutor IDs from listing pages...`);
  console.log(`   Pages to scan: ${MAX_PAGES}\n`);
  
  for (let page = 1; page <= MAX_PAGES; page++) {
    const url = `https://preply.com/en/online/english-tutors?page=${page}`;
    
    try {
      const { status, body } = await fetch(url);
      
      if (body.includes('Just a moment') || body.includes('cf_chl')) {
        cfBlocked++;
        if (cfBlocked >= 3) {
          console.log(`   🛑 Cloudflare blocking consistently. Stopping.`);
          break;
        }
        console.log(`   ⚠️  Page ${page}: Cloudflare challenge (attempt ${cfBlocked})`);
        await sleep(10000);
        continue;
      }
      
      cfBlocked = 0;
      
      // Extract tutor IDs from page
      const matches = body.match(/\/en\/tutor\/(\d+)/g) || [];
      const ids = [...new Set(matches.map(m => m.replace('/en/tutor/', '')))];
      
      ids.forEach(id => allIds.add(id));
      
      if (page % 10 === 0 || page === 1) {
        console.log(`   📦 Page ${page}: Found ${ids.length} IDs (total unique: ${allIds.size})`);
      }
      
      await sleep(DELAY_MS);
      
    } catch (err) {
      console.log(`   ❌ Page ${page}: ${err.message}`);
      await sleep(5000);
    }
  }
  
  const outputFile = path.join(OUTPUT_DIR, 'preply-tutor-ids.json');
  const idArray = [...allIds].sort((a, b) => parseInt(a) - parseInt(b));
  fs.writeFileSync(outputFile, JSON.stringify(idArray, null, 2));
  
  console.log(`\n✅ Extracted ${idArray.length} unique Preply tutor IDs`);
  console.log(`   Saved to: ${outputFile}`);
  console.log(`   ID range: ${idArray[0]} — ${idArray[idArray.length - 1]}`);
  
  return idArray;
}

extractTutorIds().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
