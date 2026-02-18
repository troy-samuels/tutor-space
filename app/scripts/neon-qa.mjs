import { chromium } from "playwright";

async function dismissHowTo(page) {
  const playBtn = page.getByRole("button", { name: /let's play/i });
  if (await playBtn.count()) {
    await playBtn.first().click({ timeout: 2000 }).catch(() => {});
    await page.waitForTimeout(250);
  }
}

async function autoPlayToResult(page, timeoutMs = 110_000) {
  const start = Date.now();
  let laneIndex = 0;

  while (Date.now() - start < timeoutMs) {
    const resultVisible = await page.getByTestId("neon-result").isVisible().catch(() => false);
    if (resultVisible) return true;

    await page.evaluate((targetLane) => {
      const btn = document.querySelector(`[data-testid=\"lane-${targetLane}\"]`);
      if (btn instanceof HTMLButtonElement) btn.click();
    }, laneIndex).catch(() => {});
    laneIndex = (laneIndex + 1) % 3;

    await page.waitForTimeout(110);
  }

  return await page.getByTestId("neon-result").isVisible().catch(() => false);
}

async function captureScenario({ url, screenshotPath, viewport }) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();

  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1200);
  await dismissHowTo(page);

  const reachedResult = await autoPlayToResult(page);
  if (!reachedResult) {
    await page.screenshot({
      path: screenshotPath.replace(".png", "-timeout.png"),
      fullPage: true,
    });
    throw new Error(`Timed out before result screen: ${url}`);
  }

  const reviewBtn = page.getByTestId("neon-review-button");
  if (await reviewBtn.count()) {
    await reviewBtn.first().click().catch(() => {});
    await page.waitForTimeout(250);
  }

  await page.screenshot({ path: screenshotPath, fullPage: true });
  await browser.close();
}

async function main() {
  await captureScenario({
    url: "http://localhost:3200/games/neon-intercept",
    screenshotPath: "/tmp/neon-intercept-result-desktop.png",
    viewport: { width: 1280, height: 720 },
  });

  await captureScenario({
    url: "http://localhost:3200/games/neon-intercept?lang=es",
    screenshotPath: "/tmp/neon-intercept-result-mobile-es.png",
    viewport: { width: 390, height: 844 },
  });

  await captureScenario({
    url: "http://localhost:3200/games/neon-intercept?lang=fr",
    screenshotPath: "/tmp/neon-intercept-result-mobile-fr.png",
    viewport: { width: 390, height: 844 },
  });

  await captureScenario({
    url: "http://localhost:3200/games/neon-intercept?lang=de",
    screenshotPath: "/tmp/neon-intercept-result-mobile-de.png",
    viewport: { width: 390, height: 844 },
  });

  process.stdout.write("Captured Neon Intercept result screenshots.\n");
}

main().catch((err) => {
  process.stderr.write(`${String(err)}\n`);
  process.exit(1);
});
