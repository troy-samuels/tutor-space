#!/usr/bin/env node
/**
 * Preply Profile Browser Scraper
 * 
 * Uses Chrome DevTools Protocol via Clawdbot's browser to scrape
 * tutor profiles one at a time with human-like delays.
 * 
 * Designed to run via Clawdbot's browser automation, not standalone.
 * This script manages the queue and outputs structured data.
 * 
 * Usage: node preply-profile-scraper.js [--batch-size 50] [--delay 8000] [--language english] [--start 0]
 * 
 * Reads from: scraped-data/preply-all-tutor-ids.json
 * Writes to:  scraped-data/preply-profiles.jsonl (append mode)
 *             scraped-data/preply-scrape-state.json (resume state)
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'scraped-data');
const IDS_FILE = path.join(DATA_DIR, 'preply-all-tutor-ids.json');
const OUTPUT_FILE = path.join(DATA_DIR, 'preply-profiles.jsonl');
const STATE_FILE = path.join(DATA_DIR, 'preply-scrape-state.json');

// Parse args
const args = process.argv.slice(2);
function getArg(name, def) {
  const idx = args.indexOf(`--${name}`);
  return idx >= 0 && args[idx + 1] ? args[idx + 1] : def;
}

const BATCH_SIZE = parseInt(getArg('batch-size', '100'));
const DELAY_MS = parseInt(getArg('delay', '8000'));
const START_OFFSET = parseInt(getArg('start', '0'));
const PRIORITY = getArg('priority', 'recent'); // 'recent' or 'all'

// Load IDs
const allTutors = JSON.parse(fs.readFileSync(IDS_FILE, 'utf8'));

// Sort by priority: most recently modified first
let queue;
if (PRIORITY === 'recent') {
  queue = allTutors
    .filter(t => t.lastmod && t.lastmod >= '2026-02-01')
    .sort((a, b) => b.lastmod.localeCompare(a.lastmod));
} else {
  queue = [...allTutors];
}

// Load existing state for resume
let scraped = new Set();
if (fs.existsSync(STATE_FILE)) {
  const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  scraped = new Set(state.scrapedIds || []);
  console.log(`📋 Resuming: ${scraped.size} already scraped`);
}

// Filter out already scraped
queue = queue.filter(t => !scraped.has(t.id));

// Apply offset
queue = queue.slice(START_OFFSET);

console.log(`\n🎯 Preply Profile Scraper`);
console.log(`   Queue: ${queue.length} profiles to scrape`);
console.log(`   Batch: ${BATCH_SIZE} profiles this run`);
console.log(`   Delay: ${DELAY_MS}ms between requests`);
console.log(`   Priority: ${PRIORITY}`);
console.log(`\n   Output: ${OUTPUT_FILE}`);
console.log(`   To scrape via Clawdbot browser, pipe this queue.`);

// Output the batch as a queue file for the browser scraper
const batch = queue.slice(0, BATCH_SIZE);
const queueFile = path.join(DATA_DIR, 'preply-scrape-queue.json');
fs.writeFileSync(queueFile, JSON.stringify(batch.map(t => ({
  id: t.id,
  url: t.url || `https://preply.com/en/tutor/${t.id}`,
  lastmod: t.lastmod
})), null, 2));

console.log(`\n✅ Batch queue written: ${queueFile} (${batch.length} profiles)`);
console.log(`   First: ${batch[0]?.url}`);
console.log(`   Last:  ${batch[batch.length - 1]?.url}`);

// Stats
const totalScrapable = allTutors.length;
const done = scraped.size;
const pct = ((done / totalScrapable) * 100).toFixed(1);
console.log(`\n📊 Progress: ${done}/${totalScrapable} (${pct}%)`);
