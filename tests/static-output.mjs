import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const outputDirectory = "out";
const forbiddenPatterns = [
  { label: "重复 basePath", pattern: "/lynote-Toolkit/lynote-Toolkit" },
  { label: "Vercel 专用采集端点", pattern: "/_vercel/insights" },
  { label: "Vercel 专用速度端点", pattern: "/_vercel/speed-insights" },
  { label: "服务端 document 错误", pattern: "document is not defined" },
];

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(path)));
    } else if (/\.(?:html|js|txt)$/.test(entry.name)) {
      files.push(path);
    }
  }

  return files;
}

const files = await collectFiles(outputDirectory);
const failures = [];

for (const file of files) {
  const content = await readFile(file, "utf8");
  for (const { label, pattern } of forbiddenPatterns) {
    if (content.includes(pattern)) {
      failures.push(`${label}: ${file}`);
    }
  }
}

const barcodeHtml = await readFile(
  join(outputDirectory, "barcode-tool.html"),
  "utf8",
);
if (!barcodeHtml.includes('data-client-ready="false"')) {
  failures.push("条码页缺少客户端接管初始标记");
}

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`静态产物检查通过：${files.length} 个文件`);
}
