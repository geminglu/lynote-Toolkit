import { readFile } from "node:fs/promises";
import path from "node:path";

export async function readContentMarkdownFile(filePath: string) {
  const absolutePath = path.join(process.cwd(), filePath);

  return readFile(absolutePath, "utf8");
}
