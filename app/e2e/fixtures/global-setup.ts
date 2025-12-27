/**
 * Playwright Global Setup
 *
 * Runs once before all E2E tests to seed test data.
 */

import {
  createE2EAdminClient,
  setupTestEnvironment,
} from "./test-fixtures";

async function globalSetup(): Promise<void> {
  console.log("\n========================================");
  console.log("E2E Global Setup: Initializing test environment");
  console.log("========================================\n");

  try {
    const adminClient = createE2EAdminClient();
    await setupTestEnvironment(adminClient);
    console.log("\n[Global Setup] Test environment ready!\n");
  } catch (error) {
    console.error("[Global Setup] Failed to set up test environment:", error);
    throw error;
  }
}

export default globalSetup;
