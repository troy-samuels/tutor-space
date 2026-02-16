#!/usr/bin/env node
/**
 * iTalki Teacher Scraper
 * Extracts teacher profiles from iTalki's public API
 * Data: name, location, bio, rating, students, sessions, languages, YouTube video
 * 
 * Usage: node italki-scraper.js [language] [max_pages]
 * Example: node italki-scraper.js english 500
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const LANGUAGE = process.argv[2] || 'english';
const MAX_PAGES = parseInt(process.argv[3]) || 500; // 500 pages × 20 = 10,000 teachers
const PAGE_SIZE = 20;
const DELAY_MS = 1500; // 1.5s between requests to be gentle
const OUTPUT_DIR = path.join(__dirname, '..', 'scraped-data');

function fetch(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'application/json',
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          try { resolve(JSON.parse(data)); } 
          catch (e) { reject(new Error(`JSON parse error: ${e.message}`)); }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data.substring(0, 200)}`));
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function extractTeacher(item) {
  const ui = item.user_info || {};
  const ti = item.teacher_info || {};
  const ts = item.teacher_statistics || {};
  const ci = item.course_info || {};
  
  // Extract course pricing
  let minPrice = null;
  let maxPrice = null;
  if (ci && Array.isArray(ci)) {
    const prices = ci.map(c => c.price_per_lesson || c.price).filter(Boolean);
    if (prices.length) {
      minPrice = Math.min(...prices);
      maxPrice = Math.max(...prices);
    }
  }

  return {
    // Identity
    user_id: ui.user_id,
    nickname: ui.nickname,
    origin_country: ui.origin_country_id,
    origin_city: ui.origin_city_name,
    living_country: ui.living_country_id,
    living_city: ui.living_city_name,
    timezone: ui.timezone,
    is_pro: ui.is_pro,
    is_online: ui.is_online,
    last_login: ui.last_login_time,
    
    // Teaching
    about_me: (ti.about_me || '').substring(0, 500),
    short_signature: ti.short_signature,
    teaching_style: (ti.teaching_style || '').substring(0, 500),
    overall_rating: ti.overall_rating,
    student_count: ti.student_count,
    session_count: ti.session_count,
    
    // Media
    video_url: ti.video_url,
    youtube_video: ti.video_url && ti.video_url.includes('youtube') ? ti.video_url : null,
    
    // Stats
    finished_sessions: ts.finished_session,
    attendance_rate: ts.attendance_rate,
    response_rate: ts.response_rate,
    
    // Pricing
    min_price: minPrice,
    max_price: maxPrice,
    
    // Profile URL
    profile_url: `https://www.italki.com/en/teacher/${ui.user_id}`,
  };
}

async function scrapeLanguage(language) {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  const outputFile = path.join(OUTPUT_DIR, `italki-${language}-teachers.json`);
  const csvFile = path.join(OUTPUT_DIR, `italki-${language}-teachers.csv`);
  
  const allTeachers = [];
  let page = 1;
  let hasNext = true;
  let totalFound = 0;
  let errors = 0;
  const MAX_ERRORS = 5;
  
  console.log(`\n🎯 Scraping iTalki ${language} teachers...`);
  console.log(`   Max pages: ${MAX_PAGES}, Page size: ${PAGE_SIZE}`);
  console.log(`   Output: ${outputFile}\n`);
  
  while (hasNext && page <= MAX_PAGES && errors < MAX_ERRORS) {
    const url = `https://api.italki.com/api/v2/teachers?language=${language}&page=${page}&page_size=${PAGE_SIZE}`;
    
    try {
      const data = await fetch(url);
      
      if (!data.success || !data.data) {
        console.log(`   ⚠️  Page ${page}: No data (success=${data.success})`);
        errors++;
        await sleep(5000);
        continue;
      }
      
      const teachers = data.data.map(extractTeacher);
      allTeachers.push(...teachers);
      
      const paging = data.paging || {};
      hasNext = paging.has_next;
      totalFound = paging.total || totalFound;
      
      if (page % 10 === 0 || page === 1) {
        console.log(`   📦 Page ${page}/${Math.ceil(totalFound / PAGE_SIZE)} — ${allTeachers.length} teachers collected (total: ${totalFound})`);
      }
      
      // Save progress every 50 pages
      if (page % 50 === 0) {
        fs.writeFileSync(outputFile, JSON.stringify(allTeachers, null, 2));
        console.log(`   💾 Progress saved: ${allTeachers.length} teachers`);
      }
      
      page++;
      errors = 0; // Reset error counter on success
      await sleep(DELAY_MS);
      
    } catch (err) {
      console.log(`   ❌ Page ${page}: ${err.message}`);
      errors++;
      if (err.message.includes('429')) {
        console.log(`   ⏳ Rate limited. Waiting 30s...`);
        await sleep(30000);
      } else {
        await sleep(3000);
      }
    }
  }
  
  // Final save
  fs.writeFileSync(outputFile, JSON.stringify(allTeachers, null, 2));
  
  // Generate CSV
  if (allTeachers.length > 0) {
    const headers = Object.keys(allTeachers[0]);
    const csvRows = [headers.join(',')];
    for (const t of allTeachers) {
      const row = headers.map(h => {
        const val = t[h];
        if (val === null || val === undefined) return '';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      });
      csvRows.push(row.join(','));
    }
    fs.writeFileSync(csvFile, csvRows.join('\n'));
  }
  
  console.log(`\n✅ DONE! Scraped ${allTeachers.length} ${language} teachers`);
  console.log(`   JSON: ${outputFile}`);
  console.log(`   CSV:  ${csvFile}`);
  
  // Quick stats
  const withYoutube = allTeachers.filter(t => t.youtube_video).length;
  const proTeachers = allTeachers.filter(t => t.is_pro).length;
  const highRated = allTeachers.filter(t => t.overall_rating >= 4.8).length;
  const active = allTeachers.filter(t => t.student_count >= 10).length;
  
  console.log(`\n📊 Quick Stats:`);
  console.log(`   Total teachers: ${allTeachers.length}`);
  console.log(`   With YouTube video: ${withYoutube} (${Math.round(withYoutube/allTeachers.length*100)}%)`);
  console.log(`   Pro teachers: ${proTeachers}`);
  console.log(`   Rating ≥ 4.8: ${highRated}`);
  console.log(`   Active (10+ students): ${active}`);
  
  return allTeachers;
}

// Run
scrapeLanguage(LANGUAGE).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
