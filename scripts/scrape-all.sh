#!/bin/bash
echo "$(date) - Starting multi-language scrape..."

echo "$(date) - Scraping English..."
node scripts/italki-scraper.js english 500

echo "$(date) - Scraping Spanish..."
node scripts/italki-scraper.js spanish 500

echo "$(date) - Scraping French..."
node scripts/italki-scraper.js french 300

echo "$(date) - Scraping German..."
node scripts/italki-scraper.js german 200

echo "$(date) - All done!"

# Combine stats
echo ""
echo "=== FINAL COUNTS ==="
for f in scraped-data/italki-*-teachers.json; do
  lang=$(basename "$f" | sed 's/italki-//' | sed 's/-teachers.json//')
  count=$(python3 -c "import json; print(len(json.load(open('$f'))))")
  echo "  $lang: $count teachers"
done
