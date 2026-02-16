#!/usr/bin/env node
/**
 * Verbling Teacher Scraper
 * Extracts teacher profiles from Verbling's listing pages.
 * Verbling doesn't have a public API but their listing pages are server-rendered.
 * 
 * Usage: node verbling-scraper.js [language] [max_pages]
 * Example: node verbling-scraper.js english 50
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const LANGUAGE = process.argv[2] || 'english';
const MAX_PAGES = parseInt(process.argv[3]) || 50;
const DELAY_MS = 3000;
const OUTPUT_DIR = path.join(__dirname, '..', 'scraped-data');

function fetch(url) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-GB,en;q=0.9',
      }
    };
    
    const req = https.get(url, options, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return fetch(res.headers.location).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.setTimeout(20000, () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function extractTeachers(html) {
  const teachers = [];
  
  // Look for teacher profile links: /teachers/NAME
  const profileLinks = html.match(/\/teachers\/([a-zA-Z0-9_-]+)/g) || [];
  const uniqueProfiles = [...new Set(profileLinks.map(l => l.replace('/teachers/', '')))];
  
  // Look for structured data or JSON in the page
  const jsonLdMatches = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g) || [];
  
  // Try to find Next.js/React state data
  const stateMatch = html.match(/__NEXT_DATA__\s*=\s*({[\s\S]*?})\s*;<\/script>/);
  if (stateMatch) {
    try {
      const nextData = JSON.parse(stateMatch[1]);
      const pageProps = nextData?.props?.pageProps;
      if (pageProps?.teachers) {
        return pageProps.teachers.map(t => ({
          id: t.id || t.uid,
          platform: 'verbling',
          name: t.name || t.displayName,
          country: t.country,
          subjects: t.languages_taught || [],
          rating: t.rating,
          reviews: t.review_count || t.numReviews,
          lessons: t.lesson_count || t.numLessons,
          price_usd: t.price || t.hourlyRate,
          bio: t.about || t.description,
          profile_url: `https://www.verbling.com/teachers/${t.username || t.slug}`,
          scraped_at: new Date().toISOString()
        }));
      }
    } catch (e) {
      // JSON parse failed, continue with regex extraction
    }
  }
  
  return uniqueProfiles.filter(p => 
    !['find', 'become', 'login', 'signup', 'enterprise'].includes(p)
  ).map(username => ({
    platform: 'verbling',
    username,
    profile_url: `https://www.verbling.com/teachers/${username}`,
    scraped_at: new Date().toISOString()
  }));
}

async function scrape() {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  
  const allTeachers = [];
  let errors = 0;
  
  console.log(`\n🎯 Scraping Verbling ${LANGUAGE} teachers...`);
  
  for (let page = 1; page <= MAX_PAGES; page++) {
    const url = `https://www.verbling.com/find-teachers/${LANGUAGE}?page=${page}`;
    
    try {
      const { status, body } = await fetch(url);
      
      if (status === 429) {
        console.log(`   ⏳ Rate limited at page ${page}. Waiting 30s...`);
        await sleep(30000);
        continue;
      }
      
      if (status !== 200) {
        console.log(`   ⚠️  Page ${page}: HTTP ${status}`);
        errors++;
        if (errors >= 5) break;
        continue;
      }
      
      const teachers = extractTeachers(body);
      if (teachers.length === 0) {
        console.log(`   📭 Page ${page}: No teachers found (end of results?)`);
        break;
      }
      
      allTeachers.push(...teachers);
      errors = 0;
      
      if (page % 5 === 0 || page === 1) {
        console.log(`   📦 Page ${page}: +${teachers.length} (total: ${allTeachers.length})`);
      }
      
      await sleep(DELAY_MS);
      
    } catch (err) {
      console.log(`   ❌ Page ${page}: ${err.message}`);
      errors++;
      if (errors >= 5) break;
      await sleep(5000);
    }
  }
  
  // Deduplicate
  const seen = new Set();
  const unique = allTeachers.filter(t => {
    const key = t.username || t.id || t.profile_url;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  
  const outputFile = path.join(OUTPUT_DIR, `verbling-${LANGUAGE}-teachers.json`);
  fs.writeFileSync(outputFile, JSON.stringify(unique, null, 2));
  
  console.log(`\n✅ Scraped ${unique.length} unique Verbling ${LANGUAGE} teachers`);
  console.log(`   Saved to: ${outputFile}`);
}

scrape().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
