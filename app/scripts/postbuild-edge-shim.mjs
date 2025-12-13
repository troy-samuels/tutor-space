import fs from "node:fs";
import path from "node:path";

const EDGE_SHIM =
  'var __dirname="/",__filename="/";try{globalThis.__dirname=__dirname;globalThis.__filename=__filename;globalThis.__tl_edge_dirname_shim=1;}catch{};\\n';

function fail(message) {
  // eslint-disable-next-line no-console
  console.error(`[postbuild] ${message}`);
  process.exit(1);
}

// Guard against regressions: Vercel currently packages middleware as ESM and
// executes it in the Edge runtime, where `__dirname` is not defined. If the
// middleware (or any of its static imports) pulls in `next/server` before we
// establish a shim, the deployment will crash at runtime.
const middlewareSourcePath = path.join(process.cwd(), "middleware.ts");
if (fs.existsSync(middlewareSourcePath)) {
  const source = fs.readFileSync(middlewareSourcePath, "utf8");

  const hasDirnameShim =
    source.includes("globalThis") && source.includes("__dirname") && source.includes("__filename");

  const dynamicNextServerImportIndex =
    source.indexOf('import(\"next/server\")') >= 0
      ? source.indexOf('import(\"next/server\")')
      : source.indexOf("import('next/server')");

  const dirnameShimIndex = source.indexOf("globalThis");

  if (!hasDirnameShim) {
    fail("`middleware.ts` must define `globalThis.__dirname`/`__filename` for Edge compatibility.");
  }

  if (dynamicNextServerImportIndex === -1) {
    fail("`middleware.ts` must load `next/server` via `import('next/server')` (not a static import).");
  }

  if (dirnameShimIndex === -1 || dirnameShimIndex > dynamicNextServerImportIndex) {
    fail("`middleware.ts` must establish the `__dirname` shim before importing `next/server`.");
  }

  const staticNextImport = source.match(/^\s*import\s+(?!type\b)[^;]*from\s+['"]next\/[^'"]+['"]/m);
  if (staticNextImport) {
    fail(`Static runtime import found in \`middleware.ts\`: ${staticNextImport[0]}`);
  }
}

const serverDir = path.join(process.cwd(), ".next", "server");
const targets = [
  path.join(serverDir, "middleware.js"),
  path.join(serverDir, "proxy.js"),
  path.join(serverDir, "edge-runtime-webpack.js"),
];

for (const filePath of targets) {
  if (!fs.existsSync(filePath)) continue;

  const contents = fs.readFileSync(filePath, "utf8");
  if (contents.includes("__tl_edge_dirname_shim=1")) continue;

  fs.writeFileSync(filePath, EDGE_SHIM + contents, "utf8");
  // eslint-disable-next-line no-console
  console.log(`[postbuild] Injected edge __dirname shim into ${path.relative(process.cwd(), filePath)}`);
}
