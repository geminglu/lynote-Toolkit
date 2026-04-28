import { readFile } from "node:fs/promises";
import path from "node:path";

export async function readContentMarkdownFile(filePath: string) {
  const normalizedPath = filePath.replace(/^\/+/, "");
  const relativePath = normalizedPath.startsWith("app/")
    ? normalizedPath.slice(4)
    : normalizedPath;
  const absolutePath = path.join(process.cwd(), "app", relativePath);

  return readFile(absolutePath, "utf8");
}
