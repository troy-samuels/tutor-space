/**
 * HawkScan Authentication Script
 *
 * This script uses Playwright to authenticate with Supabase Auth
 * and extract session cookies for HawkScan authenticated scanning.
 *
 * Environment variables required:
 * - HAWKSCAN_TUTOR_EMAIL: Test tutor account email
 * - HAWKSCAN_TUTOR_PASSWORD: Test tutor account password
 * - HOST: Application host (defaults to http://localhost:3000)
 *
 * Usage:
 *   node scripts/hawkscan-auth.js
 *
 * Output format (for HawkScan):
 *   COOKIE=name1=value1; name2=value2
 */

const { chromium } = require('@playwright/test');

const HOST = process.env.HOST || 'http://localhost:3000';
const TUTOR_EMAIL = process.env.HAWKSCAN_TUTOR_EMAIL;
const TUTOR_PASSWORD = process.env.HAWKSCAN_TUTOR_PASSWORD;

async function authenticate() {
  if (!TUTOR_EMAIL || !TUTOR_PASSWORD) {
    console.error('Error: HAWKSCAN_TUTOR_EMAIL and HAWKSCAN_TUTOR_PASSWORD must be set');
    process.exit(1);
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to login page
    await page.goto(`${HOST}/login`, { waitUntil: 'networkidle' });

    // Fill in login form
    await page.fill('input[name="email"], input[type="email"]', TUTOR_EMAIL);
    await page.fill('input[name="password"], input[type="password"]', TUTOR_PASSWORD);

    // Submit the form
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard (indicates successful login)
    await page.waitForURL('**/dashboard**', { timeout: 30000 });

    // Extract cookies
    const cookies = await context.cookies();

    // Filter for Supabase auth cookies
    const authCookies = cookies.filter(cookie =>
      cookie.name.includes('auth-token') ||
      cookie.name.startsWith('sb-')
    );

    if (authCookies.length === 0) {
      console.error('Error: No authentication cookies found after login');
      process.exit(1);
    }

    // Format cookies for HawkScan
    const cookieString = authCookies
      .map(c => `${c.name}=${c.value}`)
      .join('; ');

    // Output in HawkScan format
    console.log(`COOKIE=${cookieString}`);

    // Also output individual cookies for debugging (to stderr)
    console.error('Authentication successful. Cookies obtained:');
    authCookies.forEach(c => {
      console.error(`  - ${c.name}: ${c.value.substring(0, 20)}...`);
    });

  } catch (error) {
    console.error('Authentication failed:', error.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

authenticate();
