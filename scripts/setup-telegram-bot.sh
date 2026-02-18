#!/bin/bash
# TutorLingua Telegram Bot Setup
# Run this after creating a bot via @BotFather

set -e

echo "🤖 TutorLingua Telegram Bot Setup"
echo "================================="
echo ""

# Check for bot token
if [ -z "$TELEGRAM_BOT_TOKEN" ]; then
  echo "❌ TELEGRAM_BOT_TOKEN not set."
  echo ""
  echo "Steps:"
  echo "1. Open Telegram, search for @BotFather"
  echo "2. Send /newbot"
  echo "3. Name: TutorLingua Games"
  echo "4. Username: tutorlingua_games_bot (or similar)"
  echo "5. Copy the token and run:"
  echo ""
  echo "   export TELEGRAM_BOT_TOKEN='your-token-here'"
  echo "   bash scripts/setup-telegram-bot.sh"
  echo ""
  exit 1
fi

BASE_URL="https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}"
WEBHOOK_URL="https://tutorlingua.co/api/telegram/webhook"
MINI_APP_URL="https://tutorlingua.co/games"

echo "✅ Bot token found"
echo ""

# 1. Set webhook
echo "📡 Setting webhook..."
curl -s "${BASE_URL}/setWebhook" \
  -d "url=${WEBHOOK_URL}" \
  -d "allowed_updates=[\"message\",\"inline_query\",\"callback_query\"]" \
  | python3 -m json.tool 2>/dev/null || true
echo ""

# 2. Set commands
echo "⌨️  Setting bot commands..."
curl -s "${BASE_URL}/setMyCommands" \
  -H "Content-Type: application/json" \
  -d '{
    "commands": [
      {"command": "play", "description": "Today'\''s puzzles"},
      {"command": "connections", "description": "Play Lingua Connections"},
      {"command": "wordladder", "description": "Play Word Ladder"},
      {"command": "decode", "description": "Play Daily Decode"},
      {"command": "streak", "description": "Check your streak"},
      {"command": "language", "description": "Change language (en/es/fr/de)"},
      {"command": "help", "description": "How to use this bot"}
    ]
  }' | python3 -m json.tool 2>/dev/null || true
echo ""

# 3. Set menu button (web app)
echo "🔘 Setting menu button..."
curl -s "${BASE_URL}/setChatMenuButton" \
  -H "Content-Type: application/json" \
  -d "{
    \"menu_button\": {
      \"type\": \"web_app\",
      \"text\": \"🎮 Play\",
      \"url\": \"${MINI_APP_URL}\"
    }
  }" | python3 -m json.tool 2>/dev/null || true
echo ""

# 4. Set description
echo "📝 Setting bot description..."
curl -s "${BASE_URL}/setMyDescription" \
  -d "description=Daily language learning games 🎮 Play Connections, Word Ladder, and more in 4 languages. Free, no ads." \
  | python3 -m json.tool 2>/dev/null || true
echo ""

# 5. Set short description
echo "📝 Setting short description..."
curl -s "${BASE_URL}/setMyShortDescription" \
  -d "short_description=Daily word games for language learners 🎮" \
  | python3 -m json.tool 2>/dev/null || true
echo ""

# 6. Get bot info to confirm
echo "ℹ️  Bot info:"
curl -s "${BASE_URL}/getMe" | python3 -m json.tool 2>/dev/null || true
echo ""

echo "================================="
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Add TELEGRAM_BOT_TOKEN to your .env.local:"
echo "   echo 'TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN}' >> app/.env.local"
echo ""
echo "2. Deploy to Vercel (webhook needs to be live)"
echo ""
echo "3. Test: Open https://t.me/tutorlingua_games_bot and send /start"
echo ""
echo "4. Set bot profile picture via @BotFather: /setuserpic"
echo ""
