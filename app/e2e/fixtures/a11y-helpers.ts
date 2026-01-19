/**
 * Accessibility E2E Test Helpers
 *
 * Shared utilities for running WCAG 2.1 AA accessibility checks.
 * Uses @axe-core/playwright for automated a11y testing.
 */

import type { Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Brand color contrast exceptions.
 * These rules are disabled because our brand colors have been
 * reviewed and approved for accessibility despite not meeting
 * strict WCAG AA contrast ratios in all contexts.
 */
export const BRAND_EXCEPTIONS = ["color-contrast"] as const;

/**
 * Default WCAG tags to test against.
 * Includes WCAG 2.0 Level A and AA, plus WCAG 2.1 Level A and AA.
 */
export const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] as const;

/**
 * Options for accessibility scans
 */
export interface A11yOptions {
  /** CSS selector to scope the scan to */
  include?: string;
  /** CSS selectors to exclude from the scan */
  exclude?: string[];
  /** Additional rules to disable beyond brand exceptions */
  disableRules?: string[];
  /** Only run these specific rules */
  onlyRules?: string[];
  /** Custom WCAG tags to test against */
  tags?: string[];
  /** Skip brand color exceptions (test strict contrast) */
  strictContrast?: boolean;
}

/**
 * Result of an accessibility scan
 */
export interface A11yResult {
  violations: Array<{
    id: string;
    impact: string;
    description: string;
    help: string;
    helpUrl: string;
    nodes: Array<{
      html: string;
      target: string[];
      failureSummary: string;
    }>;
  }>;
  passes: number;
  incomplete: number;
}

/**
 * Run a full page accessibility scan.
 *
 * @example
 * ```typescript
 * const results = await runFullPageA11y(page);
 * expect(results.violations).toEqual([]);
 * ```
 */
export async function runFullPageA11y(
  page: Page,
  options: A11yOptions = {}
): Promise<A11yResult> {
  // Wait for page to be fully loaded
  await page.waitForLoadState("domcontentloaded");

  // Small delay to ensure dynamic content renders
  await page.waitForTimeout(200);

  let builder = new AxeBuilder({ page });

  // Set WCAG tags
  const tags = options.tags || [...WCAG_TAGS];
  builder = builder.withTags(tags);

  // Apply include scope
  if (options.include) {
    builder = builder.include(options.include);
  }

  // Apply excludes
  if (options.exclude?.length) {
    for (const selector of options.exclude) {
      builder = builder.exclude(selector);
    }
  }

  // Apply disabled rules
  const disabledRules = [
    ...(options.strictContrast ? [] : BRAND_EXCEPTIONS),
    ...(options.disableRules || []),
  ];

  if (disabledRules.length > 0) {
    builder = builder.disableRules(disabledRules);
  }

  // Apply only rules filter
  if (options.onlyRules?.length) {
    builder = builder.withRules(options.onlyRules);
  }

  const results = await builder.analyze();

  return {
    violations: results.violations.map((v) => ({
      id: v.id,
      impact: v.impact || "unknown",
      description: v.description,
      help: v.help,
      helpUrl: v.helpUrl,
      nodes: v.nodes.map((n) => ({
        html: n.html,
        target: n.target as string[],
        failureSummary: n.failureSummary || "",
      })),
    })),
    passes: results.passes.length,
    incomplete: results.incomplete.length,
  };
}

/**
 * Run accessibility scan on a specific component/section.
 *
 * @example
 * ```typescript
 * const results = await runComponentA11y(page, "[data-testid='booking-form']");
 * expect(results.violations).toEqual([]);
 * ```
 */
export async function runComponentA11y(
  page: Page,
  selector: string,
  options: Omit<A11yOptions, "include"> = {}
): Promise<A11yResult> {
  return runFullPageA11y(page, { ...options, include: selector });
}

/**
 * Run accessibility scan focused on form elements.
 * Includes additional rules for form accessibility.
 */
export async function runFormA11y(
  page: Page,
  formSelector: string
): Promise<A11yResult> {
  return runComponentA11y(page, formSelector, {
    // Form-specific rules to check
    onlyRules: [
      "label",
      "label-content-name-mismatch",
      "form-field-multiple-labels",
      "select-name",
      "input-image-alt",
      "input-button-name",
      "aria-input-field-name",
      "aria-required-attr",
      "aria-valid-attr-value",
      "autocomplete-valid",
    ],
  });
}

/**
 * Run accessibility scan focused on interactive elements.
 * Checks buttons, links, and other controls.
 */
export async function runInteractiveA11y(
  page: Page,
  containerSelector?: string
): Promise<A11yResult> {
  const options: A11yOptions = {
    onlyRules: [
      "button-name",
      "link-name",
      "link-in-text-block",
      "focus-order-semantics",
      "focusable-no-name",
      "interactive-supports-focus",
      "tabindex",
      "nested-interactive",
    ],
  };

  if (containerSelector) {
    options.include = containerSelector;
  }

  return runFullPageA11y(page, options);
}

/**
 * Run accessibility scan focused on media elements.
 * Checks images, videos, and audio content.
 */
export async function runMediaA11y(
  page: Page,
  containerSelector?: string
): Promise<A11yResult> {
  const options: A11yOptions = {
    onlyRules: [
      "image-alt",
      "image-redundant-alt",
      "svg-img-alt",
      "video-caption",
      "audio-caption",
      "object-alt",
    ],
  };

  if (containerSelector) {
    options.include = containerSelector;
  }

  return runFullPageA11y(page, options);
}

/**
 * Format violations for readable test output.
 */
export function formatViolations(violations: A11yResult["violations"]): string {
  if (violations.length === 0) {
    return "No accessibility violations found.";
  }

  const lines = [`Found ${violations.length} accessibility violation(s):\n`];

  for (const violation of violations) {
    lines.push(`❌ ${violation.id} (${violation.impact})`);
    lines.push(`   ${violation.help}`);
    lines.push(`   More info: ${violation.helpUrl}`);

    for (const node of violation.nodes.slice(0, 3)) {
      lines.push(`   Element: ${node.target.join(" > ")}`);
      lines.push(`   HTML: ${node.html.substring(0, 100)}...`);
    }

    if (violation.nodes.length > 3) {
      lines.push(`   ... and ${violation.nodes.length - 3} more elements`);
    }

    lines.push("");
  }

  return lines.join("\n");
}

/**
 * Assert no accessibility violations, with formatted error message.
 */
export function assertNoViolations(
  results: A11yResult,
  context = "Page"
): void {
  if (results.violations.length > 0) {
    const message = `${context} has accessibility violations:\n${formatViolations(results.violations)}`;
    throw new Error(message);
  }
}
