#!/usr/bin/env node

/* eslint-disable @typescript-eslint/no-require-imports */

/**
 * Automated translation script using DeepL API
 * Translates messages/en.json to messages/es.json
 *
 * Usage: node scripts/translate-deepl.js
 * Requires: DEEPL_API_KEY in .env.local
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Load environment variables from .env.local
const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length) {
      const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
      process.env[key.trim()] = value;
    }
  });
}

const DEEPL_API_KEY = process.env.DEEPL_API_KEY;

if (!DEEPL_API_KEY) {
  console.error('❌ Error: DEEPL_API_KEY not found in .env.local');
  console.error('   Please add: DEEPL_API_KEY=your-api-key');
  process.exit(1);
}

// DeepL API endpoint (use free API if key starts with specific pattern)
const isFreeKey = DEEPL_API_KEY.endsWith(':fx');
const API_ENDPOINT = isFreeKey
  ? 'https://api-free.deepl.com/v2/translate'
  : 'https://api.deepl.com/v2/translate';

/**
 * Translate text using DeepL API
 */
async function translateText(text, targetLang = 'ES') {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      text: [text],
      target_lang: targetLang,
      formality: 'default', // Can be 'more' for formal, 'less' for informal
    });

    const url = new URL(API_ENDPOINT);
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Authorization': `DeepL-Auth-Key ${DEEPL_API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const result = JSON.parse(data);
            resolve(result.translations[0].text);
          } catch (error) {
            reject(new Error(`Failed to parse response: ${error.message}`));
          }
        } else {
          reject(new Error(`DeepL API error (${res.statusCode}): ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Recursively translate all strings in an object
 */
async function translateObject(obj, prefix = '') {
  const result = {};
  let translatedCount = 0;

  for (const [key, value] of Object.entries(obj)) {
    const currentPath = prefix ? `${prefix}.${key}` : key;

    if (typeof value === 'string') {
      try {
        // Translate the string
        const translated = await translateText(value, 'ES');
        result[key] = translated;
        translatedCount++;

        // Log progress
        console.log(`✓ ${currentPath}: "${value}" → "${translated}"`);

        // Add small delay to respect API rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`✗ Failed to translate ${currentPath}:`, error.message);
        result[key] = value; // Keep original on error
      }
    } else if (typeof value === 'object' && value !== null) {
      // Recursively translate nested objects
      const nestedResult = await translateObject(value, currentPath);
      result[key] = nestedResult.translations;
      translatedCount += nestedResult.count;
    } else {
      // Keep non-string values as-is
      result[key] = value;
    }
  }

  return { translations: result, count: translatedCount };
}

/**
 * Main translation function
 */
async function main() {
  console.log('🌐 DeepL Translation Script');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Read English messages
  const enPath = path.join(__dirname, '../messages/en.json');
  if (!fs.existsSync(enPath)) {
    console.error(`❌ Error: ${enPath} not found`);
    process.exit(1);
  }

  console.log(`📖 Reading ${enPath}...\n`);
  const enMessages = JSON.parse(fs.readFileSync(enPath, 'utf-8'));

  // Translate to Spanish
  console.log('🔄 Translating to Spanish (ES)...\n');
  const startTime = Date.now();

  const { translations: esMessages, count } = await translateObject(enMessages);

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);

  // Write Spanish messages
  const esPath = path.join(__dirname, '../messages/es.json');
  fs.writeFileSync(esPath, JSON.stringify(esMessages, null, 2), 'utf-8');

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ Translation complete!`);
  console.log(`   Translated: ${count} strings`);
  console.log(`   Time: ${duration}s`);
  console.log(`   Output: ${esPath}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

// Run the script
main().catch((error) => {
  console.error('\n❌ Translation failed:', error.message);
  process.exit(1);
});
