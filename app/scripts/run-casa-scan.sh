#!/bin/bash
#
# TutorLingua CASA DAST Scan
# Google Cloud Application Security Assessment
#
# Prerequisites:
#   1. Docker installed and running
#   2. Test account created at tutorlingua.co
#   3. Environment variables set:
#      - CASA_TEST_EMAIL: Test tutor account email
#      - CASA_TEST_PASSWORD: Test tutor account password
#
# Usage:
#   ./scripts/run-casa-scan.sh
#
# Output:
#   - casa-scan-results.xml    (CASA submission format)
#   - casa-scan-report.pdf     (Google submission)
#   - casa-scan-report.html    (Human readable)
#   - casa-scan-summary.json   (Scan summary)
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(dirname "$SCRIPT_DIR")"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}TutorLingua CASA DAST Scan${NC}"
echo -e "${BLUE}Google Cloud Application Security Assessment${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check for required environment variables
if [ -z "$CASA_TEST_EMAIL" ]; then
    echo -e "${RED}Error: CASA_TEST_EMAIL environment variable is not set${NC}"
    echo "Please set it with: export CASA_TEST_EMAIL=\"your-test-email@example.com\""
    exit 1
fi

if [ -z "$CASA_TEST_PASSWORD" ]; then
    echo -e "${RED}Error: CASA_TEST_PASSWORD environment variable is not set${NC}"
    echo "Please set it with: export CASA_TEST_PASSWORD=\"your-test-password\""
    exit 1
fi

# Check for Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed${NC}"
    echo "Please install Docker from https://www.docker.com/get-started"
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo -e "${RED}Error: Docker is not running${NC}"
    echo "Please start Docker and try again"
    exit 1
fi

echo -e "${GREEN}✓ Environment variables set${NC}"
echo -e "${GREEN}✓ Docker is running${NC}"
echo ""

# Pull latest ZAP image
echo -e "${YELLOW}Pulling latest OWASP ZAP Docker image...${NC}"
docker pull ghcr.io/zaproxy/zaproxy:stable
echo -e "${GREEN}✓ ZAP image ready${NC}"
echo ""

# Change to app directory
cd "$APP_DIR"

# Clean up previous scan results
echo -e "${YELLOW}Cleaning up previous scan results...${NC}"
rm -f casa-scan-results.xml casa-scan-report.pdf casa-scan-report.html casa-scan-summary.json
echo -e "${GREEN}✓ Cleanup complete${NC}"
echo ""

# Display scan info
echo -e "${BLUE}Scan Configuration:${NC}"
echo "  Target:      https://tutorlingua.co"
echo "  Test User:   $CASA_TEST_EMAIL"
echo "  Config:      zap-casa-automation.yaml"
echo ""
echo -e "${YELLOW}Starting DAST scan...${NC}"
echo -e "${YELLOW}This may take 30-60 minutes depending on the application size.${NC}"
echo ""

# Run ZAP scan
START_TIME=$(date +%s)

docker run --rm \
    -v "$(pwd)":/zap/wrk/:rw \
    -e CASA_TEST_EMAIL="$CASA_TEST_EMAIL" \
    -e CASA_TEST_PASSWORD="$CASA_TEST_PASSWORD" \
    ghcr.io/zaproxy/zaproxy:stable \
    zap.sh -cmd -autorun /zap/wrk/zap-casa-automation.yaml

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))
MINUTES=$((DURATION / 60))
SECONDS=$((DURATION % 60))

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Scan Complete!${NC}"
echo -e "${GREEN}Duration: ${MINUTES}m ${SECONDS}s${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Check for output files
echo -e "${BLUE}Output Files:${NC}"

if [ -f "casa-scan-results.xml" ]; then
    SIZE=$(du -h casa-scan-results.xml | cut -f1)
    echo -e "  ${GREEN}✓${NC} casa-scan-results.xml ($SIZE) - CASA submission format"
else
    echo -e "  ${RED}✗${NC} casa-scan-results.xml - NOT FOUND"
fi

if [ -f "casa-scan-report.pdf" ]; then
    SIZE=$(du -h casa-scan-report.pdf | cut -f1)
    echo -e "  ${GREEN}✓${NC} casa-scan-report.pdf ($SIZE) - Google submission"
else
    echo -e "  ${RED}✗${NC} casa-scan-report.pdf - NOT FOUND"
fi

if [ -f "casa-scan-report.html" ]; then
    SIZE=$(du -h casa-scan-report.html | cut -f1)
    echo -e "  ${GREEN}✓${NC} casa-scan-report.html ($SIZE) - Human readable"
else
    echo -e "  ${RED}✗${NC} casa-scan-report.html - NOT FOUND"
fi

if [ -f "casa-scan-summary.json" ]; then
    SIZE=$(du -h casa-scan-summary.json | cut -f1)
    echo -e "  ${GREEN}✓${NC} casa-scan-summary.json ($SIZE) - Scan summary"
else
    echo -e "  ${RED}✗${NC} casa-scan-summary.json - NOT FOUND"
fi

echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "  1. Review casa-scan-report.html for findings"
echo "  2. Address any HIGH or MEDIUM severity issues"
echo "  3. Submit casa-scan-report.pdf to Google CASA"
echo ""
