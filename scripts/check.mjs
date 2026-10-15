import { readFile, access } from "node:fs/promises";
import { spawnSync } from "node:child_process";
const root = new URL("../", import.meta.url);
for (const name of [
  "app.mjs",
  "src/core.mjs",
  "scripts/serve.mjs",
  "scripts/build.mjs",
]) {
  const r = spawnSync(
    process.execPath,
    ["--check", new URL(name, root).pathname.replace(/^\/([A-Za-z]:)/, "$1")],
    { encoding: "utf8" },
  );
  if (r.status !== 0) {
    console.error(r.stderr);
    process.exit(1);
  }
}
const html = await readFile(new URL("index.html", root), "utf8");
for (const [, path] of html.matchAll(/(?:src|href)="([^"#]+)"/g))
  if (!/^(?:https?:|mailto:|data:)/.test(path))
    await access(new URL(path, root));
for (const stylesheet of ["styles.css", "assets/fonts.css"]) {
  const css = await readFile(new URL(stylesheet, root), "utf8");
  for (const [, path] of css.matchAll(/url\(['"]?([^)'"\s]+)['"]?\)/g))
    if (!/^(?:https?:|data:)/.test(path))
      await access(new URL(path, new URL(stylesheet, root)));
}
const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]));
for (const [, id] of html.matchAll(/href="#([^"]+)"/g))
  if (!ids.has(id)) throw new Error(`Missing section: ${id}`);
await access(new URL("assets/OFL.txt", root));
for (const marker of [
  'lang="en"',
  'name="description"',
  'name="viewport"',
  "Synthetic data",
  'id="lab"',
])
  if (!html.includes(marker))
    throw new Error(`Missing required page marker: ${marker}`);
console.log("Syntax, local page assets, and document essentials passed.");
