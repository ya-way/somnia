import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { fileURLToPath } from "node:url";
const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const port = Number(process.env.PORT || 4173);
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/plain; charset=utf-8",
};
const allowed = new Set([
  "index.html",
  "styles.css",
  "app.mjs",
  "assets",
  "src",
  "examples",
]);
const server = http.createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(
      new URL(req.url, "http://localhost").pathname,
    );
    const requested = pathname === "/" ? "index.html" : pathname.slice(1);
    const target = resolve(root, requested);
    if (
      !target.startsWith(root + sep) ||
      !allowed.has(requested.split("/")[0]) ||
      !(await stat(target)).isFile()
    )
      throw new Error("not found");
    res.writeHead(200, {
      "Content-Type": types[extname(target)] || "application/octet-stream",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "no-cache",
    });
    res.end(await readFile(target));
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not found");
  }
});
server.listen(port, "127.0.0.1", () =>
  console.log(`Somnia · http://127.0.0.1:${port}`),
);
