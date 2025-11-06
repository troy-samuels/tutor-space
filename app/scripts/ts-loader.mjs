import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const projectRoot = new URL("../", import.meta.url);

const compilerOptions = {
  module: ts.ModuleKind.ESNext,
  target: ts.ScriptTarget.ES2020,
  moduleResolution: ts.ModuleResolutionKind.NodeNext,
  jsx: ts.JsxEmit.Preserve,
  esModuleInterop: true,
  allowSyntheticDefaultImports: true,
};

export async function resolve(specifier, context, defaultResolve) {
  if (specifier === "next/cache") {
    const stubUrl = new URL("./tests/stubs/next-cache.ts", projectRoot);
    return defaultResolve(stubUrl.href, context, defaultResolve);
  }

  if (specifier === "next/headers") {
    const stubUrl = new URL("./tests/stubs/next-headers.ts", projectRoot);
    return defaultResolve(stubUrl.href, context, defaultResolve);
  }

  if (specifier === "server-only") {
    const stubUrl = new URL("./tests/stubs/server-only.ts", projectRoot);
    return defaultResolve(stubUrl.href, context, defaultResolve);
  }

  if (specifier === "@/lib/emails/access-emails") {
    const stubUrl = new URL("./tests/stubs/access-emails.ts", projectRoot);
    return defaultResolve(stubUrl.href, context, defaultResolve);
  }

  if (specifier.startsWith("@/")) {
    const basePath = specifier.slice(2);
    const mappedUrl = new URL(basePath, projectRoot);

    try {
      return await defaultResolve(mappedUrl.href, context, defaultResolve);
    } catch {
      const tsUrl = new URL(`${basePath}.ts`, projectRoot);
      try {
        return await defaultResolve(tsUrl.href, context, defaultResolve);
      } catch {
        const tsxUrl = new URL(`${basePath}.tsx`, projectRoot);
        return defaultResolve(tsxUrl.href, context, defaultResolve);
      }
    }
  }

  return defaultResolve(specifier, context, defaultResolve);
}

export async function load(url, context, defaultLoad) {
  if (url.endsWith(".ts") || url.endsWith(".tsx")) {
    const filePath = fileURLToPath(url);
    const source = await readFile(filePath, "utf8");
    const { outputText } = ts.transpileModule(source, {
      compilerOptions,
      fileName: filePath,
    });

    return {
      format: "module",
      source: outputText,
      shortCircuit: true,
    };
  }

  return defaultLoad(url, context, defaultLoad);
}
