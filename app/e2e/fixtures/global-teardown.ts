/**
 * Playwright Global Teardown
 *
 * Runs once after all E2E tests to clean up test data.
 */

import {
  createE2EAdminClient,
  teardownTestEnvironment,
} from "./test-fixtures";

async function globalTeardown(): Promise<void> {
  console.log("\n========================================");
  console.log("E2E Global Teardown: Cleaning up test environment");
  console.log("========================================\n");

  try {
    const adminClient = createE2EAdminClient();
    await teardownTestEnvironment(adminClient);
    console.log("\n[Global Teardown] Test environment cleaned up!\n");
  } catch (error) {
    console.error("[Global Teardown] Failed to clean up test environment:", error);
    // Don't throw - we don't want cleanup failures to mark tests as failed
    console.error("Cleanup error (non-fatal):", error);
  }
}

export default globalTeardown;
