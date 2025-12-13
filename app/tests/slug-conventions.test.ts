import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import matter from "gray-matter";

import { isKebabSlug, slugifyKebab } from "../lib/utils/slug.ts";
import { GRAMMAR_CATEGORY_SLUGS } from "../lib/practice/grammar-categories.ts";

function listMarkdownFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listMarkdownFiles(fullPath));
      continue;
    }
    if (entry.isFile() && entry.name.endsWith(".md")) {
      files.push(fullPath);
    }
  }
  return files;
}

function assertUnique(values: string[], label: string) {
  const counts = new Map<string, number>();
  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  const duplicates = Array.from(counts.entries())
    .filter(([, count]) => count > 1)
    .map(([value, count]) => `${value} (${count})`);
  assert.deepStrictEqual(duplicates, [], `${label} has duplicate slugs: ${duplicates.join(", ")}`);
}

test("slugifyKebab produces kebab-case ascii slugs", () => {
  assert.equal(slugifyKebab("  Hello, World!  "), "hello-world");
  assert.equal(slugifyKebab("Crème brûlée"), "creme-brulee");
  assert.equal(slugifyKebab("subject_verb_agreement"), "subject-verb-agreement");
  assert.equal(slugifyKebab("— — —", { fallback: "fallback" }), "fallback");
});

test("grammar category slugs follow kebab-case convention", () => {
  for (const slug of GRAMMAR_CATEGORY_SLUGS) {
    assert.ok(isKebabSlug(slug), `Invalid grammar category slug: ${slug}`);
  }
  assertUnique([...GRAMMAR_CATEGORY_SLUGS], "GRAMMAR_CATEGORY_SLUGS");
});

test("help article slugs are kebab-case and unique per locale", () => {
  const helpDir = path.join(process.cwd(), "docs", "help");
  const locales = fs.readdirSync(helpDir).filter((d) => fs.statSync(path.join(helpDir, d)).isDirectory());

  for (const locale of locales) {
    const localeDir = path.join(helpDir, locale);
    const files = listMarkdownFiles(localeDir);
    const slugs: string[] = [];

    for (const file of files) {
      const content = fs.readFileSync(file, "utf-8");
      const { data } = matter(content);
      assert.equal(typeof data.slug, "string", `Missing slug in ${file}`);
      assert.ok(isKebabSlug(data.slug), `Invalid help slug in ${file}: ${data.slug}`);
      slugs.push(data.slug);

      if (data.alternateLocale?.slug) {
        assert.ok(
          isKebabSlug(String(data.alternateLocale.slug)),
          `Invalid help alternateLocale.slug in ${file}: ${data.alternateLocale.slug}`
        );
      }
    }

    assertUnique(slugs, `Help (${locale})`);
  }
});

test("blog post slugs are kebab-case and unique per locale", () => {
  const blogDir = path.join(process.cwd(), "docs", "blog");
  const locales = fs.readdirSync(blogDir).filter((d) => fs.statSync(path.join(blogDir, d)).isDirectory());

  for (const locale of locales) {
    const localeDir = path.join(blogDir, locale);
    const files = listMarkdownFiles(localeDir);
    const slugs: string[] = [];

    for (const file of files) {
      const content = fs.readFileSync(file, "utf-8");
      const { data } = matter(content);
      assert.equal(typeof data.slug, "string", `Missing slug in ${file}`);
      assert.ok(isKebabSlug(data.slug), `Invalid blog slug in ${file}: ${data.slug}`);
      slugs.push(data.slug);

      if (data.alternateLocale?.slug) {
        assert.ok(
          isKebabSlug(String(data.alternateLocale.slug)),
          `Invalid blog alternateLocale.slug in ${file}: ${data.alternateLocale.slug}`
        );
      }
    }

    assertUnique(slugs, `Blog (${locale})`);
  }
});

