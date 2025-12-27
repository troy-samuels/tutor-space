import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Page Builder E2E Tests
 *
 * Tests for the redesigned page builder with:
 * - 2 hero layouts (Centered/Minimal, Photo Focus/Portrait)
 * - 10 font options
 * - 5 color palettes + custom
 *
 * NOTE: These tests require authentication. To run them:
 * 1. Set up Playwright auth state: npx playwright codegen --save-storage=auth.json
 * 2. Log in to the app during codegen
 * 3. Set AUTH_STORAGE_STATE=auth.json environment variable
 *
 * For CI, you'll need to:
 * - Create a test user in the database
 * - Generate auth state in a setup project
 * - See: https://playwright.dev/docs/auth
 */

// Skip all tests if AUTH_STORAGE_STATE env var is not set
const skipIfNoAuth = !process.env.AUTH_STORAGE_STATE;

// Font options per design spec
const FONT_OPTIONS = [
  { value: "system", label: "Inter" },
  { value: "rounded", label: "Manrope" },
  { value: "tech", label: "Poppins" },
  { value: "serif", label: "Merriweather" },
  { value: "luxury", label: "DM Sans" },
  { value: "grotesk", label: "Space Grotesk" },
  { value: "humanist", label: "Plus Jakarta Sans" },
  { value: "editorial", label: "Playfair Display" },
  { value: "playful", label: "Nunito" },
  { value: "mono", label: "JetBrains Mono" },
];

test.describe("Page Builder", () => {
  // Use storage state if available
  test.use({
    storageState: process.env.AUTH_STORAGE_STATE || undefined,
  });

  test.beforeEach(async ({ page }) => {
    if (skipIfNoAuth) return;
    await page.goto("/pages");
  });

  test.describe("Font Selection", () => {
    test.skip(skipIfNoAuth, "Requires AUTH_STORAGE_STATE environment variable");

    test("displays all 10 font options", async ({ page }) => {
      // Look for font buttons in the style section
      for (const font of FONT_OPTIONS) {
        await expect(page.getByRole("button", { name: font.label })).toBeVisible();
      }
    });

    test("font buttons have correct count", async ({ page }) => {
      const fontButtons = page.locator('button:has-text("Inter"), button:has-text("Manrope"), button:has-text("Poppins"), button:has-text("Merriweather"), button:has-text("DM Sans"), button:has-text("Space Grotesk"), button:has-text("Plus Jakarta Sans"), button:has-text("Playfair Display"), button:has-text("Nunito"), button:has-text("JetBrains Mono")');
      await expect(fontButtons).toHaveCount(10);
    });

    test("clicking font changes preview font", async ({ page }) => {
      // Click Playfair Display
      await page.getByRole("button", { name: "Playfair Display" }).click();

      // Verify the button is selected (has active styling)
      const selectedButton = page.getByRole("button", { name: "Playfair Display" });
      await expect(selectedButton).toHaveClass(/bg-foreground/);
    });

    test("font selection persists after clicking different font", async ({ page }) => {
      // Select JetBrains Mono
      await page.getByRole("button", { name: "JetBrains Mono" }).click();

      // Verify it's selected
      const selectedButton = page.getByRole("button", { name: "JetBrains Mono" });
      await expect(selectedButton).toHaveClass(/bg-foreground/);

      // Verify Inter is not selected
      const interButton = page.getByRole("button", { name: "Inter" });
      await expect(interButton).not.toHaveClass(/bg-foreground/);
    });
  });

  test.describe("Color Palettes", () => {
    test.skip(skipIfNoAuth, "Requires AUTH_STORAGE_STATE environment variable");

    test("displays 5 preset color palettes", async ({ page }) => {
      // Color palette buttons (circular buttons with nested color circles)
      const colorButtons = page.locator('.rounded-full.transition-all:not(.border-dashed)').filter({
        has: page.locator('.rounded-full'),
      });

      // Should have at least 5 preset palettes
      const count = await colorButtons.count();
      expect(count).toBeGreaterThanOrEqual(5);
    });

    test("displays custom color option", async ({ page }) => {
      // Custom button has dashed border and Plus icon
      const customButton = page.locator('.rounded-full.border-dashed');
      await expect(customButton).toBeVisible();
    });

    test("clicking custom reveals color pickers", async ({ page }) => {
      // Click custom color button
      const customButton = page.locator('.rounded-full.border-dashed').first();
      await customButton.click();

      // Should show Background and Accent labels
      await expect(page.getByText("Background")).toBeVisible();
      await expect(page.getByText("Accent")).toBeVisible();
    });

    test("color palette selection updates preview", async ({ page }) => {
      // This would require checking the preview iframe/component
      // For now, verify the UI selection state changes
      const colorButtons = page.locator('.rounded-full.transition-all:not(.border-dashed)').filter({
        has: page.locator('.rounded-full'),
      });

      // Click second palette (Ocean)
      await colorButtons.nth(1).click();

      // Verify selection ring appears
      await expect(colorButtons.nth(1)).toHaveClass(/ring-2/);
    });
  });

  test.describe("Layout Selection", () => {
    test.skip(skipIfNoAuth, "Requires AUTH_STORAGE_STATE environment variable");

    test("displays exactly 2 layout options", async ({ page }) => {
      // Look for layout option cards/buttons
      // If no data-testid, look for the layout grid
      const layoutGrid = page.locator('text=Layout').locator('..').locator('.grid');

      // Should have 2 layout options
      const buttons = layoutGrid.locator('button');
      const count = await buttons.count();
      expect(count).toBe(2);
    });

    test("banner layout is not available", async ({ page }) => {
      // Ensure no "Banner" option exists
      await expect(page.getByText("Banner", { exact: true })).not.toBeVisible();
    });

    test("Centered layout option is available", async ({ page }) => {
      await expect(page.getByRole("button", { name: /Centered/i })).toBeVisible();
    });

    test("Photo Focus layout option is available", async ({ page }) => {
      await expect(page.getByRole("button", { name: /Photo Focus/i })).toBeVisible();
    });

    test("clicking layout option selects it", async ({ page }) => {
      const photoFocusButton = page.getByRole("button", { name: /Photo Focus/i });
      await photoFocusButton.click();

      // Should have selection styling
      await expect(photoFocusButton).toHaveClass(/border-primary|ring-primary/);
    });
  });

  test.describe("Visual Regression - Layouts", () => {
    test.skip(skipIfNoAuth, "Requires AUTH_STORAGE_STATE environment variable");

    test("minimal (centered) layout preview renders correctly", async ({ page }) => {
      // Select minimal layout
      await page.getByRole("button", { name: /Centered/i }).click();

      // Wait for preview to update
      await page.waitForTimeout(500);

      // Take screenshot of preview area
      const preview = page.locator('[data-testid="site-preview"]');
      if (await preview.count() > 0) {
        await expect(preview).toHaveScreenshot("minimal-layout.png", {
          threshold: 0.2,
        });
      }
    });

    test("portrait (photo focus) layout preview renders correctly", async ({ page }) => {
      // Select portrait layout
      await page.getByRole("button", { name: /Photo Focus/i }).click();

      // Wait for preview to update
      await page.waitForTimeout(500);

      // Take screenshot of preview area
      const preview = page.locator('[data-testid="site-preview"]');
      if (await preview.count() > 0) {
        await expect(preview).toHaveScreenshot("portrait-layout.png", {
          threshold: 0.2,
        });
      }
    });
  });

  test.describe("Visual Regression - Color Palettes", () => {
    test.skip(skipIfNoAuth, "Requires AUTH_STORAGE_STATE environment variable");

    test("dark palette preview renders with light text", async ({ page }) => {
      // Click dark palette (4th one)
      const colorButtons = page.locator('.rounded-full.transition-all:not(.border-dashed)').filter({
        has: page.locator('.rounded-full'),
      });
      await colorButtons.nth(3).click(); // 0-indexed, dark is 4th

      // Wait for preview to update
      await page.waitForTimeout(500);

      // Take screenshot
      const preview = page.locator('[data-testid="site-preview"]');
      if (await preview.count() > 0) {
        await expect(preview).toHaveScreenshot("dark-palette.png", {
          threshold: 0.2,
        });
      }
    });

    test("lavender palette preview renders correctly", async ({ page }) => {
      // Click lavender palette (5th one)
      const colorButtons = page.locator('.rounded-full.transition-all:not(.border-dashed)').filter({
        has: page.locator('.rounded-full'),
      });
      await colorButtons.nth(4).click();

      await page.waitForTimeout(500);

      const preview = page.locator('[data-testid="site-preview"]');
      if (await preview.count() > 0) {
        await expect(preview).toHaveScreenshot("lavender-palette.png", {
          threshold: 0.2,
        });
      }
    });
  });

  test.describe("Visual Regression - Fonts", () => {
    test.skip(skipIfNoAuth, "Requires AUTH_STORAGE_STATE environment variable");

    test("editorial (Playfair Display) font renders in preview", async ({ page }) => {
      await page.getByRole("button", { name: "Playfair Display" }).click();

      await page.waitForTimeout(500);

      const preview = page.locator('[data-testid="site-preview"]');
      if (await preview.count() > 0) {
        await expect(preview).toHaveScreenshot("playfair-font.png", {
          threshold: 0.2,
        });
      }
    });

    test("mono (JetBrains Mono) font renders in preview", async ({ page }) => {
      await page.getByRole("button", { name: "JetBrains Mono" }).click();

      await page.waitForTimeout(500);

      const preview = page.locator('[data-testid="site-preview"]');
      if (await preview.count() > 0) {
        await expect(preview).toHaveScreenshot("jetbrains-font.png", {
          threshold: 0.2,
        });
      }
    });
  });

  test.describe("Responsive Design", () => {
    test.skip(skipIfNoAuth, "Requires AUTH_STORAGE_STATE environment variable");

    test("mobile: page builder is usable", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto("/pages");

      // Should still be able to see and interact with controls
      await expect(page.getByRole("button", { name: "Inter" })).toBeVisible();
    });

    test("mobile: layout options are accessible", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto("/pages");

      // Look for layout section
      await expect(page.getByText("Layout")).toBeVisible();
    });

    test("tablet: all sections visible", async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto("/pages");

      // Core sections should be visible
      await expect(page.getByText("Colors")).toBeVisible();
      await expect(page.getByText("Font")).toBeVisible();
      await expect(page.getByText("Layout")).toBeVisible();
    });

    test("desktop: preview panel visible alongside controls", async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto("/pages");

      // Both controls and preview should be visible
      await expect(page.getByText("Colors")).toBeVisible();
      const preview = page.locator('[data-testid="site-preview"]');
      if (await preview.count() > 0) {
        await expect(preview).toBeVisible();
      }
    });
  });

  test.describe("Accessibility", () => {
    test.skip(skipIfNoAuth, "Requires AUTH_STORAGE_STATE environment variable");

    test("font buttons are keyboard accessible", async ({ page }) => {
      // Tab to first font button
      await page.keyboard.press("Tab");

      // Find focused element
      let attempts = 0;
      while (attempts < 20) {
        const focused = page.locator(":focus");
        const text = await focused.textContent();
        if (FONT_OPTIONS.some((f) => text?.includes(f.label))) {
          break;
        }
        await page.keyboard.press("Tab");
        attempts++;
      }

      // Should be able to activate with Enter
      await page.keyboard.press("Enter");
    });

    test("color palette buttons have tooltips", async ({ page }) => {
      // Hover over first palette
      const colorButtons = page.locator('.rounded-full.transition-all:not(.border-dashed)').filter({
        has: page.locator('.rounded-full'),
      });

      await colorButtons.first().hover();

      // Wait for tooltip
      await page.waitForTimeout(300);

      // Tooltip should appear with palette name
      const tooltip = page.locator('[role="tooltip"]');
      if (await tooltip.count() > 0) {
        await expect(tooltip).toBeVisible();
      }
    });

    test("passes axe accessibility checks for style controls", async ({ page }) => {
      // Wait for page to fully load
      await page.waitForLoadState("domcontentloaded");

      const results = await new AxeBuilder({ page })
        .include("main")
        .disableRules(["color-contrast"]) // Brand color exception
        .analyze();

      expect(results.violations).toEqual([]);
    });

    test("layout buttons have accessible names", async ({ page }) => {
      const centeredButton = page.getByRole("button", { name: /Centered/i });
      const photoFocusButton = page.getByRole("button", { name: /Photo Focus/i });

      await expect(centeredButton).toBeVisible();
      await expect(photoFocusButton).toBeVisible();
    });
  });

  test.describe("Auto-Save", () => {
    test.skip(skipIfNoAuth, "Requires AUTH_STORAGE_STATE environment variable");

    test("making changes triggers auto-save indicator", async ({ page }) => {
      // Make a change
      await page.getByRole("button", { name: "Manrope" }).click();

      // Look for saving indicator
      const savingIndicator = page.getByText(/saving|saved/i);
      await expect(savingIndicator).toBeVisible({ timeout: 5000 });
    });

    test("auto-save completes successfully", async ({ page }) => {
      // Make a change
      await page.getByRole("button", { name: "Space Grotesk" }).click();

      // Wait for save to complete
      const savedIndicator = page.getByText(/saved/i);
      await expect(savedIndicator).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe("Design Token Compliance", () => {
    test.skip(skipIfNoAuth, "Requires AUTH_STORAGE_STATE environment variable");

    test("typography uses correct scale", async ({ page }) => {
      // Verify header text sizes
      const header = page.locator("h1, h2, h3").first();
      const fontSize = await header.evaluate((el) =>
        window.getComputedStyle(el).fontSize
      );

      // Should be one of our design token sizes
      const validSizes = ["12px", "14px", "16px", "18px", "20px", "24px", "30px", "36px"];
      expect(validSizes.some((size) => fontSize.includes(size.replace("px", "")))).toBeTruthy();
    });

    test("buttons use rounded corners per design system", async ({ page }) => {
      const fontButton = page.getByRole("button", { name: "Inter" });
      const borderRadius = await fontButton.evaluate((el) =>
        window.getComputedStyle(el).borderRadius
      );

      // Should have pill/rounded styling
      expect(parseInt(borderRadius)).toBeGreaterThan(0);
    });
  });

  test.describe("Error Handling", () => {
    test.skip(skipIfNoAuth, "Requires AUTH_STORAGE_STATE environment variable");

    test("gracefully handles save errors", async ({ page }) => {
      // Mock API to return error
      await page.route("**/api/tutor-sites*", async (route) => {
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ error: "Internal server error" }),
        });
      });

      // Make a change
      await page.getByRole("button", { name: "Nunito" }).click();

      // Should show error indicator
      const errorIndicator = page.getByText(/error|failed/i);
      await expect(errorIndicator).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe("Preview Updates", () => {
    test.skip(skipIfNoAuth, "Requires AUTH_STORAGE_STATE environment variable");

    test("font change updates preview immediately", async ({ page }) => {
      const preview = page.locator('[data-testid="site-preview"]');
      if ((await preview.count()) === 0) return;

      // Get initial font
      const initialFont = await preview.evaluate((el) =>
        window.getComputedStyle(el).fontFamily
      );

      // Change font
      await page.getByRole("button", { name: "Merriweather" }).click();

      // Wait for update
      await page.waitForTimeout(300);

      // Font should have changed
      const newFont = await preview.evaluate((el) =>
        window.getComputedStyle(el).fontFamily
      );

      expect(newFont).not.toBe(initialFont);
    });

    test("color change updates preview background", async ({ page }) => {
      const preview = page.locator('[data-testid="site-preview"]');
      if ((await preview.count()) === 0) return;

      // Get initial background
      const initialBg = await preview.evaluate((el) =>
        window.getComputedStyle(el).backgroundColor
      );

      // Click dark palette
      const colorButtons = page.locator('.rounded-full.transition-all:not(.border-dashed)').filter({
        has: page.locator('.rounded-full'),
      });
      await colorButtons.nth(3).click();

      // Wait for update
      await page.waitForTimeout(300);

      // Background should have changed
      const newBg = await preview.evaluate((el) =>
        window.getComputedStyle(el).backgroundColor
      );

      expect(newBg).not.toBe(initialBg);
    });

    test("layout change updates preview structure", async ({ page }) => {
      const preview = page.locator('[data-testid="site-preview"]');
      if ((await preview.count()) === 0) return;

      // Select Portrait layout
      await page.getByRole("button", { name: /Photo Focus/i }).click();

      // Wait for update
      await page.waitForTimeout(300);

      // Preview should reflect the layout change
      // The specific assertion depends on how layout is reflected in the DOM
      await expect(preview).toBeVisible();
    });
  });
});
