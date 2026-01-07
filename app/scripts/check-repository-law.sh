#!/usr/bin/env bash
# Repository Law Enforcer
# Ensures all Supabase calls in actions go through repositories
#
# Forbidden patterns in lib/actions/:
#   - supabase.from(  - Direct table access
#   - .from("         - Chained from with double quotes
#   - .from('         - Chained from with single quotes
#   - supabase.rpc(   - Direct RPC calls
#
# Allowed patterns:
#   - storage.from(   - Supabase Storage operations (not DB queries)
#
# Baseline Strategy:
#   - Files listed in scripts/repository-law-baseline.txt are legacy
#   - Legacy files get [SKIPPED (LEGACY)] warning
#   - New violations get [VIOLATION (NEW)] and fail the build

set -e

ACTIONS_DIR="lib/actions"
BASELINE_FILE="scripts/repository-law-baseline.txt"
LEGACY_COUNT=0
NEW_VIOLATIONS=0

echo "🔍 Repository Law Enforcer"
echo "   Scanning $ACTIONS_DIR for direct Supabase calls..."
echo ""

# Function to check if file is in baseline
is_baselined() {
    local file="$1"
    if [ -f "$BASELINE_FILE" ]; then
        grep -Fxq "$file" "$BASELINE_FILE" 2>/dev/null && return 0
    fi
    return 1
}

# Count baseline entries
BASELINE_COUNT=0
if [ -f "$BASELINE_FILE" ]; then
    BASELINE_COUNT=$(grep -v '^#' "$BASELINE_FILE" | grep -v '^$' | wc -l | tr -d ' ')
    echo "📋 Loaded $BASELINE_COUNT baselined legacy files"
    echo ""
fi

# Find all TypeScript files in lib/actions
while IFS= read -r file; do
    # Skip if file is in a repository directory (safety check)
    if [[ "$file" == *"/repositories/"* ]]; then
        continue
    fi

    # Search for forbidden patterns, excluding storage operations
    # First grep finds .from( patterns, then we filter OUT storage.from lines
    matches=$(grep -nE "(supabase\.from\(|\.from\(\"|\.from\('|supabase\.rpc\()" "$file" 2>/dev/null | grep -v "storage\.from" || true)

    if [ -n "$matches" ]; then
        # Check if file is in baseline
        if is_baselined "$file"; then
            echo "⚠️  [SKIPPED (LEGACY)] $file"
            LEGACY_COUNT=$((LEGACY_COUNT + 1))
        else
            echo "❌ [VIOLATION (NEW)] $file"
            echo "$matches"
            echo ""
            NEW_VIOLATIONS=$((NEW_VIOLATIONS + 1))
        fi
    fi
done < <(find "$ACTIONS_DIR" -name "*.ts" -type f 2>/dev/null | sort)

echo ""
echo "=========================================="

# Summary
if [ $LEGACY_COUNT -gt 0 ]; then
    echo "⚠️  $LEGACY_COUNT legacy file(s) with violations (baselined)"
fi

if [ $NEW_VIOLATIONS -gt 0 ]; then
    echo ""
    echo "❌ Found $NEW_VIOLATIONS NEW file(s) with Repository Law violations!"
    echo ""
    echo "Direct Supabase calls are forbidden in lib/actions/"
    echo "Move database queries to lib/repositories/ instead."
    echo "=========================================="
    exit 1
else
    if [ $LEGACY_COUNT -gt 0 ]; then
        echo ""
        echo "✅ No NEW violations found!"
        echo "   (Legacy violations are grandfathered - fix when touching those files)"
    else
        echo "✅ Repository Law check passed! No violations found."
    fi
    echo "=========================================="
    exit 0
fi
