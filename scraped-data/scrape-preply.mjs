#!/usr/bin/env node
// Preply listing scraper - extracts __NEXT_DATA__ from HTML pages
import { writeFileSync, appendFileSync, readFileSync, existsSync } from 'fs';

const JSONL_FILE = '/Users/t.samuels/Desktop/tutor-space/scraped-data/preply-listing-profiles.jsonl';
const STATE_FILE = '/Users/t.samuels/Desktop/tutor-space/scraped-data/preply-listing-state.json';
const MAX_PAGES = parseInt(process.argv[2] || '100'); // Pages per run

// Read current state
let state = { last_page: 0, total_tutors: 0 };
if (existsSync(STATE_FILE)) {
  state = JSON.parse(readFileSync(STATE_FILE, 'utf8'));
}

const startPage = state.last_page + 1;
const endPage = Math.min(startPage + MAX_PAGES - 1, 3880);

console.log(`Starting from page ${startPage} to ${endPage} (${MAX_PAGES} pages per run)`);

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function parseTutor(t, page) {
  const languages = (t.multiLanguages || [])
    .filter(l => l.canSpeak)
    .map(l => {
      const level = l.levelI18n || l.levelCodeI18n || '';
      return level ? `${l.name} (${level})` : l.name;
    });

  // Determine tutor type from boolean flags
  const isPro = t.isProfessionalTutor || t.isCertifiedTutor || false;
  const isSuper = t.isSuperTutor || false;
  
  let type = null;
  if (isPro && isSuper) type = 'Professional Super Tutor';
  else if (isPro) type = 'Professional';
  else if (isSuper) type = 'Super Tutor';

  // Price - round to integer
  let price = null;
  if (t.price?.value) {
    price = Math.round(parseFloat(t.price.value));
  }

  // Name from user object
  const name = t.user?.fullName || t.user?.firstName || '';

  return {
    id: t.id,
    name,
    country: t.countryOfBirth?.name || null,
    type,
    price_gbp: price,
    rating: t.averageScore || null,
    reviews: t.numberReviews || 0,
    students: t.activeStudentsCount || 0,
    lessons: t.totalLessons || 0,
    languages_spoken: languages,
    bio_snippet: (t.headline || '').substring(0, 300),
    profile_url: `https://preply.com/en/tutor/${t.id}`,
    page
  };
}

async function scrapePage(pageNum) {
  const url = `https://preply.com/en/online/english-tutors?page=${pageNum}`;
  
  const resp = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-GB,en;q=0.9',
      'Cache-Control': 'no-cache',
    }
  });

  if (!resp.ok) {
    console.error(`Page ${pageNum}: HTTP ${resp.status}`);
    return null;
  }

  const html = await resp.text();
  
  // Check for Cloudflare
  if (html.includes('challenge-platform') || html.includes('cf-browser-verification') || html.includes('Just a moment...')) {
    console.error(`Page ${pageNum}: CLOUDFLARE CHALLENGE DETECTED`);
    return 'cloudflare';
  }

  // Extract __NEXT_DATA__
  const match = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!match) {
    console.error(`Page ${pageNum}: No __NEXT_DATA__ found`);
    return null;
  }

  try {
    const data = JSON.parse(match[1]);
    const ssrData = data.props?.pageProps?.ssrAllTutors;
    if (!ssrData?.tutors) {
      console.error(`Page ${pageNum}: No tutors in data`);
      return null;
    }
    return ssrData.tutors;
  } catch (e) {
    console.error(`Page ${pageNum}: JSON parse error: ${e.message}`);
    return null;
  }
}

async function main() {
  let totalNew = 0;
  let consecutiveErrors = 0;
  
  for (let page = startPage; page <= endPage; page++) {
    const result = await scrapePage(page);
    
    if (result === 'cloudflare') {
      console.error('BLOCKED BY CLOUDFLARE - STOPPING');
      break;
    }
    
    if (!result || result.length === 0) {
      consecutiveErrors++;
      if (consecutiveErrors >= 3) {
        console.error('3 consecutive errors, stopping');
        break;
      }
      console.warn(`Page ${page}: No tutors found, waiting 15s and retrying...`);
      await sleep(15000);
      const retry = await scrapePage(page);
      if (!retry || retry === 'cloudflare' || retry.length === 0) {
        console.error(`Page ${page}: Retry failed`);
        continue;
      }
      const lines = retry.map(t => JSON.stringify(parseTutor(t, page)));
      appendFileSync(JSONL_FILE, lines.join('\n') + '\n');
      totalNew += retry.length;
      consecutiveErrors = 0;
    } else {
      const lines = result.map(t => JSON.stringify(parseTutor(t, page)));
      appendFileSync(JSONL_FILE, lines.join('\n') + '\n');
      totalNew += result.length;
      consecutiveErrors = 0;
    }
    
    state.last_page = page;
    state.total_tutors += (result?.length || 0);
    writeFileSync(STATE_FILE, JSON.stringify(state));
    
    if (page % 10 === 0) {
      console.log(`Page ${page}: ${state.total_tutors} total tutors`);
    }
    
    // Throttle: 6-8 second delay
    const delay = 6000 + Math.random() * 2000;
    await sleep(delay);
  }
  
  console.log(`\nDone! Scraped ${totalNew} new tutors across pages ${startPage}-${state.last_page}. Total: ${state.total_tutors}`);
}

main().catch(console.error);
