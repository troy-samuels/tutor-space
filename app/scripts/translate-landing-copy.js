#!/usr/bin/env node

/* eslint-disable @typescript-eslint/no-require-imports */

/**
 * Translate the marketing landing copy (landingCopyEn) to a target language via DeepL.
 *
 * Usage:
 *   node scripts/translate-landing-copy.js --lang=PT-BR --output=lib/constants/landing-copy.pt.json
 *
 * Requires DEEPL_API_KEY in .env.local
 */

const fs = require("fs");
const path = require("path");
const https = require("https");
const vm = require("vm");
const { URL } = require("url");

// Load environment variables from .env.local
const envPath = path.join(__dirname, "../.env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const [key, ...valueParts] = line.split("=");
    if (key && valueParts.length) {
      const value = valueParts.join("=").trim().replace(/^["']|["']$/g, "");
      process.env[key.trim()] = value;
    }
  });
}

const DEEPL_API_KEY = process.env.DEEPL_API_KEY;
if (!DEEPL_API_KEY) {
  console.error("❌ Error: DEEPL_API_KEY not found in .env.local");
  process.exit(1);
}

const isFreeKey = DEEPL_API_KEY.endsWith(":fx");
const API_ENDPOINT = isFreeKey
  ? "https://api-free.deepl.com/v2/translate"
  : "https://api.deepl.com/v2/translate";

function parseArgs() {
  const argv = process.argv.slice(2);
  return argv.reduce((acc, arg) => {
    const [k, v] = arg.replace(/^--/, "").split("=");
    if (k && v) acc[k] = v;
    return acc;
  }, {});
}

async function translateText(text, targetLang = "PT-BR", attempt = 1) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      text: [text],
      target_lang: targetLang,
      formality: "default",
    });

    const apiUrl = new URL(API_ENDPOINT);
    const options = {
      hostname: apiUrl.hostname,
      path: apiUrl.pathname,
      method: "POST",
      headers: {
        Authorization: `DeepL-Auth-Key ${DEEPL_API_KEY}`,
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(postData),
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", async () => {
        if (res.statusCode === 200) {
          try {
            const result = JSON.parse(data);
            resolve(result.translations[0].text);
          } catch (error) {
            reject(new Error(`Failed to parse response: ${error.message}`));
          }
        } else if (res.statusCode === 429 && attempt < 4) {
          const delayMs = 500 * attempt;
          setTimeout(async () => {
            try {
              const retried = await translateText(text, targetLang, attempt + 1);
              resolve(retried);
            } catch (retryError) {
              reject(retryError);
            }
          }, delayMs);
        } else {
          reject(new Error(`DeepL API error (${res.statusCode}): ${data}`));
        }
      });
    });

    req.on("error", (error) => reject(error));
    req.write(postData);
    req.end();
  });
}

async function translateObject(obj, prefix = "", targetLang = "PT-BR") {
  const result = Array.isArray(obj) ? [] : {};
  let translatedCount = 0;

  const entries = Array.isArray(obj) ? obj.entries() : Object.entries(obj);

  for (const [key, value] of entries) {
    const currentPath = prefix ? `${prefix}.${key}` : `${key}`;
    if (typeof value === "string") {
      try {
        const translated = await translateText(value, targetLang);
        if (Array.isArray(result)) {
          result.push(translated);
        } else {
          result[key] = translated;
        }
        translatedCount++;
        console.log(`✓ ${currentPath}: "${value}" → "${translated}"`);
        await new Promise((resolve) => setTimeout(resolve, 200));
      } catch (error) {
        console.error(`✗ Failed to translate ${currentPath}: ${error.message}`);
        if (Array.isArray(result)) {
          result.push(value);
        } else {
          result[key] = value;
        }
      }
    } else if (value && typeof value === "object") {
      const nestedResult = await translateObject(value, currentPath, targetLang);
      if (Array.isArray(result)) {
        result.push(nestedResult.translations);
      } else {
        result[key] = nestedResult.translations;
      }
      translatedCount += nestedResult.count;
    } else {
      if (Array.isArray(result)) {
        result.push(value);
      } else {
        result[key] = value;
      }
    }
  }

  return { translations: result, count: translatedCount };
}

function extractLandingCopyEn() {
  const filePath = path.join(__dirname, "../lib/constants/landing-copy.ts");
  const content = fs.readFileSync(filePath, "utf-8");
  const start = content.indexOf("const landingCopyEn");
  if (start === -1) {
    throw new Error("Could not find landingCopyEn in landing-copy.ts");
  }
  const asConstIndex = content.indexOf("} as const;", start);
  if (asConstIndex === -1) {
    throw new Error("Could not find end of landingCopyEn definition");
  }
  const objectStart = content.indexOf("{", start);
  const objectSource = content.slice(objectStart, asConstIndex + 1);
  const script = new vm.Script(`(${objectSource})`);
  const enObject = script.runInNewContext({ Date });
  return enObject;
}

async function main() {
  const args = parseArgs();
  const targetLang = (args.lang || "PT-BR").toUpperCase();
  const outputRelPath = args.output || "lib/constants/landing-copy.pt.json";
  const outputPath = path.join(__dirname, "..", outputRelPath);

  console.log("🌐 DeepL Landing Copy Translator");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  console.log(`Target language: ${targetLang}`);
  console.log(`Output: ${outputPath}\n`);

  const enObject = extractLandingCopyEn();

  const startTime = Date.now();
  const { translations, count } = await translateObject(enObject, "landingCopyEn", targetLang);
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);

  fs.writeFileSync(outputPath, JSON.stringify(translations, null, 2), "utf-8");

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`✅ Translation complete`);
  console.log(`   Strings translated: ${count}`);
  console.log(`   Time: ${duration}s`);
  console.log(`   Output: ${outputPath}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

main().catch((error) => {
  console.error("❌ Translation failed:", error);
  process.exit(1);
});
