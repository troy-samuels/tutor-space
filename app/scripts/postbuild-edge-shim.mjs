import fs from "node:fs";
import path from "node:path";

const EDGE_SHIM =
  'var __dirname="/",__filename="/";try{globalThis.__dirname=__dirname;globalThis.__filename=__filename;globalThis.__tl_edge_dirname_shim=1;}catch{};\\n';

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
