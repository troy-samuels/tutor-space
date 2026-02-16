#!/usr/bin/env node
/**
 * Combined Tutor Prospect Database Builder
 * 
 * Merges data from all platforms (iTalki, Preply, Verbling) into a
 * single normalised database with deduplication and quality scoring.
 * 
 * Output: scraped-data/COMBINED_TUTOR_DB.json
 *         scraped-data/COMBINED_TUTOR_DB.csv
 *         scraped-data/HIGH_VALUE_PROSPECTS.json (filtered top tier)
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'scraped-data');

function loadJSON(filename) {
  const filepath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filepath)) return [];
  try {
    return JSON.parse(fs.readFileSync(filepath, 'utf8'));
  } catch (e) {
    console.log(`  ⚠️  Failed to parse ${filename}: ${e.message}`);
    return [];
  }
}

function loadJSONL(filename) {
  const filepath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filepath)) return [];
  try {
    return fs.readFileSync(filepath, 'utf8')
      .split('\n')
      .filter(line => line.trim())
      .map(line => JSON.parse(line));
  } catch (e) {
    console.log(`  ⚠️  Failed to parse ${filename}: ${e.message}`);
    return [];
  }
}

// Normalise iTalki records
function normaliseItalki(record) {
  return {
    platform: 'italki',
    platform_id: String(record.user_id),
    name: record.nickname,
    country: record.origin_country,
    city: record.living_city,
    bio: record.about_me,
    headline: record.short_signature,
    rating: parseFloat(record.overall_rating) || null,
    students: record.student_count || 0,
    sessions: record.session_count || 0,
    youtube_url: record.youtube_video ? record.youtube_video.replace('/embed/', '/watch?v=') : null,
    is_pro: !!record.is_pro,
    last_active: record.last_login,
    profile_url: record.profile_url || `https://www.italki.com/en/teacher/${record.user_id}`,
    languages_spoken: [], // not in API response
    subjects_taught: [], // would need to be inferred
    price_usd: record.min_price,
  };
}

// Normalise Preply records
function normalisePreply(record) {
  return {
    platform: 'preply',
    platform_id: String(record.id),
    name: record.name,
    country: record.country,
    city: null,
    bio: record.bio,
    headline: record.headline,
    rating: record.rating,
    students: null,
    sessions: record.lessons || 0,
    youtube_url: record.youtube_url,
    is_pro: null,
    last_active: record.scraped_at,
    profile_url: record.url || `https://preply.com/en/tutor/${record.id}`,
    languages_spoken: (record.languages || []).map(l => l.lang),
    subjects_taught: record.subjects || [],
    price_gbp: record.price_gbp,
  };
}

// Normalise Verbling records
function normaliseVerbling(record) {
  return {
    platform: 'verbling',
    platform_id: record.id || record.username,
    name: record.name || record.username,
    country: record.country,
    city: null,
    bio: record.bio,
    headline: null,
    rating: record.rating,
    students: null,
    sessions: record.lessons || 0,
    youtube_url: null,
    is_pro: null,
    last_active: record.scraped_at,
    profile_url: record.profile_url,
    languages_spoken: [],
    subjects_taught: record.subjects || [],
    price_usd: record.price_usd,
  };
}

// Score a prospect (0-100)
function scoreProspect(t) {
  let score = 0;
  
  // High session count = established tutor more likely to switch
  if (t.sessions >= 5000) score += 25;
  else if (t.sessions >= 1000) score += 20;
  else if (t.sessions >= 500) score += 15;
  else if (t.sessions >= 100) score += 10;
  else if (t.sessions >= 10) score += 5;
  
  // High rating = quality tutor
  if (t.rating >= 4.9) score += 15;
  else if (t.rating >= 4.5) score += 10;
  else if (t.rating >= 4.0) score += 5;
  
  // Many students = established business
  if (t.students >= 500) score += 15;
  else if (t.students >= 100) score += 10;
  else if (t.students >= 20) score += 5;
  
  // Has YouTube = content creator (valuable amplifier)
  if (t.youtube_url) score += 20;
  
  // Has bio = engaged with platform
  if (t.bio && t.bio.length > 100) score += 5;
  
  // Pro/verified = serious tutor
  if (t.is_pro) score += 10;
  
  // Recently active
  if (t.last_active && t.last_active >= '2026-02-01') score += 10;
  
  return Math.min(score, 100);
}

async function build() {
  console.log('🏗️  Building Combined Tutor Prospect Database\n');
  
  // Load iTalki data (all languages)
  const languages = ['english', 'spanish', 'french', 'german', 'japanese', 'chinese', 'korean', 'portuguese'];
  let italkiTotal = 0;
  const allNormalised = [];
  
  for (const lang of languages) {
    const data = loadJSON(`italki-${lang}-teachers.json`);
    if (data.length > 0) {
      const normalised = data.map(normaliseItalki);
      normalised.forEach(t => t.language_scraped = lang);
      allNormalised.push(...normalised);
      italkiTotal += data.length;
      console.log(`  📚 iTalki ${lang}: ${data.length} teachers`);
    }
  }
  
  // Load Preply browser-scraped profiles
  const preplyProfiles = loadJSONL('preply-profiles.jsonl');
  if (preplyProfiles.length > 0) {
    const normalised = preplyProfiles.map(normalisePreply);
    allNormalised.push(...normalised);
    console.log(`  📚 Preply profiles: ${preplyProfiles.length} teachers`);
  }
  
  // Load Preply IDs (for count even if not all scraped)
  const preplyIds = loadJSON('preply-all-tutor-ids.json');
  console.log(`  📋 Preply IDs available: ${preplyIds.length} (${preplyProfiles.length} enriched)`);
  
  // Load Verbling data
  for (const lang of languages) {
    const data = loadJSON(`verbling-${lang}-teachers.json`);
    if (data.length > 0) {
      const normalised = data.map(normaliseVerbling);
      normalised.forEach(t => t.language_scraped = lang);
      allNormalised.push(...normalised);
      console.log(`  📚 Verbling ${lang}: ${data.length} teachers`);
    }
  }
  
  // Deduplicate (by platform + platform_id)
  const seen = new Set();
  const unique = allNormalised.filter(t => {
    const key = `${t.platform}:${t.platform_id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  
  // Score all prospects
  unique.forEach(t => {
    t.prospect_score = scoreProspect(t);
  });
  
  // Sort by score
  unique.sort((a, b) => b.prospect_score - a.prospect_score);
  
  // Save combined database
  const dbFile = path.join(DATA_DIR, 'COMBINED_TUTOR_DB.json');
  fs.writeFileSync(dbFile, JSON.stringify(unique, null, 2));
  
  // Filter high-value prospects (score >= 50)
  const highValue = unique.filter(t => t.prospect_score >= 50);
  const hvFile = path.join(DATA_DIR, 'HIGH_VALUE_PROSPECTS.json');
  fs.writeFileSync(hvFile, JSON.stringify(highValue, null, 2));
  
  // Generate CSV
  const csvFile = path.join(DATA_DIR, 'COMBINED_TUTOR_DB.csv');
  const headers = ['platform', 'platform_id', 'name', 'country', 'rating', 'students', 'sessions', 'youtube_url', 'is_pro', 'prospect_score', 'profile_url', 'headline'];
  const csvRows = [headers.join(',')];
  for (const t of unique) {
    const row = headers.map(h => {
      const val = t[h];
      if (val === null || val === undefined) return '';
      const str = String(val).replace(/"/g, '""').replace(/\n/g, ' ');
      return `"${str}"`;
    });
    csvRows.push(row.join(','));
  }
  fs.writeFileSync(csvFile, csvRows.join('\n'));
  
  // Stats
  const platforms = {};
  unique.forEach(t => {
    platforms[t.platform] = (platforms[t.platform] || 0) + 1;
  });
  
  const withYoutube = unique.filter(t => t.youtube_url).length;
  const highRated = unique.filter(t => t.rating >= 4.8).length;
  const powerUsers = unique.filter(t => t.sessions >= 1000).length;
  
  console.log(`\n${'='.repeat(50)}`);
  console.log(`📊 COMBINED DATABASE STATS`);
  console.log(`${'='.repeat(50)}`);
  console.log(`Total unique tutors: ${unique.length}`);
  console.log(`\nBy platform:`);
  Object.entries(platforms).forEach(([p, n]) => console.log(`  ${p}: ${n}`));
  console.log(`\nQuality metrics:`);
  console.log(`  High-value prospects (score ≥50): ${highValue.length}`);
  console.log(`  With YouTube: ${withYoutube}`);
  console.log(`  Rating ≥ 4.8: ${highRated}`);
  console.log(`  1000+ sessions: ${powerUsers}`);
  console.log(`\nFiles:`);
  console.log(`  ${dbFile}`);
  console.log(`  ${hvFile}`);
  console.log(`  ${csvFile}`);
}

build().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
