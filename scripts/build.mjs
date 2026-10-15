import { mkdir, cp } from "node:fs/promises";
import { fileURLToPath } from "node:url";
const root = new URL("../", import.meta.url);
await mkdir(new URL("dist/", root), { recursive: true });
for (const name of [
  "index.html",
  "styles.css",
  "app.mjs",
  "assets",
  "src",
  "examples",
  ".nojekyll",
])
  await cp(new URL(name, root), new URL(`dist/${name}`, root), {
    recursive: true,
  });
console.log(`Static site ready: ${fileURLToPath(new URL("dist/", root))}`);
