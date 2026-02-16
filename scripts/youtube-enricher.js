#!/usr/bin/env node
/**
 * YouTube Video → Channel → Contact Info Enricher
 * 
 * Takes video IDs from tutor profiles and resolves:
 * 1. Video ID → Channel name, ID, URL (via oEmbed - free, no API key)
 * 2. Channel page → About section → business email, links
 * 
 * Input:  scraped-data/youtube-ids-to-resolve.json
 * Output: scraped-data/youtube-enriched.json
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'scraped-data');
const INPUT_FILE = path.join(DATA_DIR, 'youtube-ids-to-resolve.json');
const OUTPUT_FILE = path.join(DATA_DIR, 'youtube-enriched.jsonl');
const STATE_FILE = path.join(DATA_DIR, 'youtube-enrich-state.json');
const BATCH_SIZE = parseInt(process.argv[2]) || 200;
const DELAY_MS = 1500; // Be gentle with YouTube

function fetch(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'application/json,text/html',
      }
    }, (res) => {
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

async function resolveVideoToChannel(videoId) {
  // Use YouTube oEmbed endpoint (free, no API key needed)
  const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
  
  try {
    const { status, body } = await fetch(url);
    if (status !== 200) return null;
    
    const data = JSON.parse(body);
    return {
      video_id: videoId,
      channel_name: data.author_name,
      channel_url: data.author_url,
      video_title: data.title,
    };
  } catch (e) {
    return null;
  }
}

async function enrichAll() {
  const input = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf8'));
  
  // Load state for resume
  let startIdx = 0;
  if (fs.existsSync(STATE_FILE)) {
    const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    startIdx = state.lastIndex || 0;
    console.log(`📋 Resuming from index ${startIdx}`);
  }
  
  const batch = input.slice(startIdx, startIdx + BATCH_SIZE);
  
  console.log(`\n🎬 YouTube Video → Channel Enricher`);
  console.log(`   Total videos: ${input.length}`);
  console.log(`   This batch: ${batch.length} (starting at ${startIdx})`);
  console.log(`   Delay: ${DELAY_MS}ms\n`);
  
  let resolved = 0;
  let failed = 0;
  const results = [];
  
  for (let i = 0; i < batch.length; i++) {
    const item = batch[i];
    
    try {
      const channelInfo = await resolveVideoToChannel(item.video_id);
      
      if (channelInfo) {
        const enriched = {
          ...item,
          ...channelInfo,
          resolved: true,
        };
        results.push(enriched);
        
        // Append to JSONL
        fs.appendFileSync(OUTPUT_FILE, JSON.stringify(enriched) + '\n');
        resolved++;
      } else {
        results.push({ ...item, resolved: false });
        failed++;
      }
      
      if ((i + 1) % 25 === 0) {
        console.log(`   📦 ${i + 1}/${batch.length} — resolved: ${resolved}, failed: ${failed}`);
      }
      
      await sleep(DELAY_MS);
      
    } catch (e) {
      console.log(`   ❌ ${item.video_id}: ${e.message}`);
      failed++;
      await sleep(3000);
    }
  }
  
  // Save state
  fs.writeFileSync(STATE_FILE, JSON.stringify({
    lastIndex: startIdx + batch.length,
    totalResolved: resolved,
    totalFailed: failed,
    timestamp: new Date().toISOString()
  }, null, 2));
  
  // Summary
  console.log(`\n✅ Batch complete`);
  console.log(`   Resolved: ${resolved}/${batch.length}`);
  console.log(`   Failed: ${failed}`);
  
  // Count unique channels
  const channels = new Set(results.filter(r => r.resolved).map(r => r.channel_url));
  console.log(`   Unique channels: ${channels.size}`);
  
  // Show top results
  const topResults = results
    .filter(r => r.resolved)
    .sort((a, b) => b.sessions - a.sessions)
    .slice(0, 10);
  
  console.log(`\n🏆 Top resolved tutors:`);
  for (const r of topResults) {
    console.log(`   ${r.name} (${r.sessions} sessions) → ${r.channel_name} — ${r.channel_url}`);
  }
}

enrichAll().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
