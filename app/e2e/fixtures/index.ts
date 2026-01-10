/**
 * Playwright Extended Fixtures for E2E Testing
 *
 * Extends Playwright's base test with:
 * - testTutor: Pre-authenticated tutor page context
 * - testStudent: Pre-authenticated student page context
 * - testData: Access to test state (booking, homework, etc.)
 */

import { test as base, Page, BrowserContext } from "@playwright/test";
import {
  E2E_TUTOR,
  E2E_STUDENT,
  getTestState,
  E2ETestState,
} from "./test-fixtures";

// ============================================
// EXTENDED FIXTURE TYPES
// ============================================

type E2EFixtures = {
  /** Pre-authenticated tutor page */
  testTutor: Page;
  /** Pre-authenticated student page */
  testStudent: Page;
  /** Access to E2E test data state */
  testData: E2ETestState;
  /** Authenticated tutor context (for multiple pages) */
  tutorContext: BrowserContext;
  /** Authenticated student context (for multiple pages) */
  studentContext: BrowserContext;
};

// ============================================
// AUTHENTICATION HELPERS
// ============================================

async function loginAs(
  page: Page,
  email: string,
  password: string,
  expectedPath: string
): Promise<void> {
  await page.goto("/login");
  await page.waitForLoadState("domcontentloaded");

  // Fill login form
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);

  // Submit
  await page.getByRole("button", { name: /sign in|log in/i }).click();

  // Wait for redirect to expected path
  await page.waitForURL((url) => url.pathname.includes(expectedPath), {
    timeout: 15000,
  });
}

async function loginAsTutor(page: Page): Promise<void> {
  await loginAs(page, E2E_TUTOR.email, E2E_TUTOR.password, "/dashboard");
}

async function loginAsStudent(page: Page): Promise<void> {
  await loginAs(page, E2E_STUDENT.email, E2E_STUDENT.password, "/student");
}

// ============================================
// EXTENDED TEST FIXTURE
// ============================================

export const test = base.extend<E2EFixtures>({
  /**
   * Pre-authenticated tutor page
   * Use when you need a single tutor page for testing
   */
  testTutor: async ({ browser }, runFixture) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      await loginAsTutor(page);
      await runFixture(page);
    } finally {
      await context.close();
    }
  },

  /**
   * Pre-authenticated student page
   * Use when you need a single student page for testing
   */
  testStudent: async ({ browser }, runFixture) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      await loginAsStudent(page);
      await runFixture(page);
    } finally {
      await context.close();
    }
  },

  /**
   * Access to E2E test data state
   * Contains IDs for booking, homework, student, service, etc.
   */
  testData: async ({}, runFixture) => {
    const state = getTestState();
    await runFixture(state);
  },

  /**
   * Authenticated tutor browser context
   * Use when you need multiple tutor pages
   */
  tutorContext: async ({ browser }, runFixture) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      await loginAsTutor(page);
      await page.close(); // Close the setup page
      await runFixture(context);
    } finally {
      await context.close();
    }
  },

  /**
   * Authenticated student browser context
   * Use when you need multiple student pages
   */
  studentContext: async ({ browser }, runFixture) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      await loginAsStudent(page);
      await page.close(); // Close the setup page
      await runFixture(context);
    } finally {
      await context.close();
    }
  },
});

// Re-export expect from Playwright
export { expect } from "@playwright/test";

// Export test data constants and utilities
export { E2E_TUTOR, E2E_STUDENT, getTestState, createE2EAdminClient } from "./test-fixtures";
