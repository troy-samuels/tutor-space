import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

type Issue = {
  file: string;
  line: number;
  text: string;
};

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptsDir, "..");
const searchRoots = [path.join(projectRoot, "app"), path.join(projectRoot, "components")];
const messagesPath = path.join(projectRoot, "messages", "en.json");

const ALLOWLIST = new Set<string>([
  "TutorLingua",
  "AI",
  "API",
  "CRM",
  "Stripe",
  "Stripe Connect",
  "Supabase",
  "LiveKit",
  "Deepgram",
  "Google",
  "Outlook",
  "Microsoft",
  "Zoom",
  "Apple",
  "PayPal",
  "USD",
]);

function normalize(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

async function getTranslationValues(): Promise<Set<string>> {
  const raw = await fs.readFile(messagesPath, "utf8");
  const json = JSON.parse(raw);
  const values: string[] = [];

  function walk(node: unknown) {
    if (typeof node === "string") {
      const normalized = normalize(node);
      if (normalized) values.push(normalized);
      return;
    }
    if (node && typeof node === "object") {
      for (const value of Object.values(node as Record<string, unknown>)) {
        walk(value);
      }
    }
  }

  walk(json);
  return new Set(values);
}

function isSupportedText(text: string): boolean {
  if (!text) return false;
  if (text.length < 2) return false;
  if (!/[A-Za-z]/.test(text)) return false;
  // Ignore things that look like environment variables or template placeholders
  if (/^[A-Z0-9_]+$/.test(text)) return false;
  return true;
}

async function collectFiles(dir: string, results: string[] = []): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
      await collectFiles(fullPath, results);
      continue;
    }

    if (entry.isFile() && (fullPath.endsWith(".tsx") || fullPath.endsWith(".jsx"))) {
      results.push(fullPath);
    }
  }

  return results;
}

function extractIssuesFromFile(
  filePath: string,
  translations: Set<string>,
  issues: Issue[]
) {
  const source = ts.sys.readFile(filePath);
  if (!source) return;

  const sourceFile = ts.createSourceFile(
    filePath,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  );

  function report(node: ts.Node, raw: string) {
    const normalized = normalize(raw);
    if (!isSupportedText(normalized)) return;
    if (translations.has(normalized)) return;
    if (ALLOWLIST.has(normalized)) return;

    const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
    issues.push({
      file: path.relative(projectRoot, filePath),
      line: line + 1,
      text: normalized,
    });
  }

  function visit(node: ts.Node) {
    if (ts.isJsxText(node)) {
      const text = node.getText();
      report(node, text);
    }

    if (ts.isStringLiteralLike(node) && ts.isJsxExpression(node.parent)) {
      const parent = node.parent.parent;
      if (ts.isJsxElement(parent) || ts.isJsxSelfClosingElement(parent) || ts.isJsxFragment(parent)) {
        report(node, node.text);
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
}

async function main() {
  const translations = await getTranslationValues();
  const issues: Issue[] = [];

  for (const root of searchRoots) {
    const files = await collectFiles(root);
    files.forEach((file) => extractIssuesFromFile(file, translations, issues));
  }

  if (issues.length === 0) {
    console.log("No hardcoded JSX strings missing from messages/en.json were found.");
    return;
  }

  console.log(`Found ${issues.length} potential missing translations:\n`);
  for (const issue of issues) {
    console.log(`${issue.file}:${issue.line} — "${issue.text}"`);
  }

  process.exitCode = 1;
}

main().catch((error) => {
  console.error("Failed to complete i18n scan:", error);
  process.exitCode = 1;
});
