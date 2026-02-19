import { expect, test } from "@playwright/test";

test.describe("Neon Intercept UI recovery", () => {
  test("keeps setup strip compact and removes duplicate cue panels", async ({ page, baseURL }) => {
    const appUrl = baseURL ?? "http://localhost:3000";
    await page.goto(`${appUrl}/games/neon-intercept?mode=ranked`);

    const setup = page.locator("[data-state='idle']").first();
    await expect(setup).toBeVisible();
    const setupBox = await setup.boundingBox();
    expect(setupBox?.height ?? 0).toBeLessThanOrEqual(180);

    await expect(page.getByText("Current Signal")).toHaveCount(0);
  });

  test("collapses setup strip once run is active", async ({ page, baseURL }) => {
    const appUrl = baseURL ?? "http://localhost:3000";
    await page.goto(`${appUrl}/games/neon-intercept?mode=ranked`);

    await page.mouse.click(200, 520);
    const setupRunning = page.locator("[data-state='running']").first();
    await expect(setupRunning).toBeVisible();

    const runningBox = await setupRunning.boundingBox();
    expect(runningBox?.height ?? 999).toBeLessThanOrEqual(64);
  });
});
