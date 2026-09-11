import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, resolve, sep } from "node:path";

const outputDirectory = resolve("out");
const port = Number(process.env.TEST_SITE_PORT || "4173");
const basePath = (process.env.TEST_SITE_BASE_PATH || "/lynote-Toolkit").replace(
  /\/$/,
  "",
);
const mimeTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".ico", "image/x-icon"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".txt", "text/plain; charset=utf-8"],
  [".webp", "image/webp"],
  [".woff2", "font/woff2"],
  [".xml", "application/xml; charset=utf-8"],
]);

function resolveOutputPath(requestUrl) {
  const pathname = decodeURIComponent(
    new URL(requestUrl, "http://local").pathname,
  );

  if (pathname !== basePath && !pathname.startsWith(`${basePath}/`)) {
    return null;
  }

  const relativePath = pathname.slice(basePath.length).replace(/^\/+/, "");
  const candidates = relativePath
    ? [relativePath, `${relativePath}.html`, `${relativePath}/index.html`]
    : ["index.html"];

  for (const candidate of candidates) {
    const filePath = resolve(outputDirectory, candidate);
    if (
      filePath.startsWith(`${outputDirectory}${sep}`) &&
      existsSync(filePath) &&
      statSync(filePath).isFile()
    ) {
      return filePath;
    }
  }

  return null;
}

createServer((request, response) => {
  const filePath = resolveOutputPath(request.url || "/");

  if (!filePath) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }

  response.writeHead(200, {
    "Cache-Control": "no-store",
    "Content-Type":
      mimeTypes.get(extname(filePath)) || "application/octet-stream",
    "Service-Worker-Allowed": `${basePath}/`,
  });
  createReadStream(filePath).pipe(response);
}).listen(port, "127.0.0.1");
