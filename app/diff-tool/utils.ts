import type { DiffLanguageOption, DiffSide, DiffStats } from "./type";

/**
 * 上传文本文件的大小上限。
 *
 * Monaco 可以处理较大的文本，但浏览器端 diff、语法高亮和格式化都可能放大内存占用。
 * 这里限制为 5MB，优先保证在线工具在普通设备上的交互稳定性。
 */
export const MAX_TEXT_FILE_SIZE_BYTES = 5 * 1024 * 1024;

/**
 * 无法识别文件扩展名时使用的 Monaco 默认语言。
 */
export const DEFAULT_LANGUAGE = "plaintext";

/**
 * 首屏示例的原始文本。
 *
 * 示例使用 JSON，是因为 JSON 的差异、格式化和语法高亮都直观，方便用户首次打开
 * 工具时立即理解 DiffEditor 的工作方式。
 */
export const DEFAULT_ORIGINAL_TEXT = `{
  "name": "lynote-toolkit",
  "version": "1.0.0",
  "features": [
    "JSON 格式化",
    "文本对比",
    "浏览器本地处理"
  ],
  "enabled": true
}
`;

/**
 * 首屏示例的修改后文本。
 *
 * 与 `DEFAULT_ORIGINAL_TEXT` 保持同一业务对象，只改变版本号和功能列表，
 * 用最少内容展示新增行和修改行。
 */
export const DEFAULT_MODIFIED_TEXT = `{
  "name": "lynote-toolkit",
  "version": "1.1.0",
  "features": [
    "JSON 格式化",
    "文本对比",
    "文件上传",
    "浏览器本地处理"
  ],
  "enabled": true
}
`;

/**
 * 兜底语言配置。
 *
 * Monaco 在动态加载前或某些语言包缺失时，`getLanguages()` 返回的扩展名可能不完整。
 * 这里维护一份常见开发文件扩展名映射，保证上传识别至少覆盖高频文本和代码格式。
 */
export const FALLBACK_LANGUAGE_OPTIONS: DiffLanguageOption[] = [
  { value: "plaintext", label: "Plain Text", extensions: [".txt", ".log"] },
  { value: "json", label: "JSON", extensions: [".json", ".jsonc"] },
  { value: "markdown", label: "Markdown", extensions: [".md", ".markdown"] },
  {
    value: "javascript",
    label: "JavaScript",
    extensions: [".js", ".mjs", ".cjs"],
  },
  { value: "typescript", label: "TypeScript", extensions: [".ts", ".tsx"] },
  { value: "html", label: "HTML", extensions: [".html", ".htm"] },
  { value: "css", label: "CSS", extensions: [".css"] },
  { value: "scss", label: "SCSS", extensions: [".scss"] },
  { value: "less", label: "Less", extensions: [".less"] },
  { value: "xml", label: "XML", extensions: [".xml", ".svg"] },
  { value: "yaml", label: "YAML", extensions: [".yaml", ".yml"] },
  { value: "sql", label: "SQL", extensions: [".sql"] },
  { value: "shell", label: "Shell", extensions: [".sh", ".bash", ".zsh"] },
  { value: "python", label: "Python", extensions: [".py"] },
  { value: "java", label: "Java", extensions: [".java"] },
  { value: "go", label: "Go", extensions: [".go"] },
  { value: "rust", label: "Rust", extensions: [".rs"] },
  {
    value: "cpp",
    label: "C/C++",
    extensions: [".c", ".cc", ".cpp", ".h", ".hpp"],
  },
  { value: "csharp", label: "C#", extensions: [".cs"] },
  { value: "php", label: "PHP", extensions: [".php"] },
  { value: "ruby", label: "Ruby", extensions: [".rb"] },
  { value: "dockerfile", label: "Dockerfile", extensions: ["dockerfile"] },
];

/**
 * 语言下拉框的优先排序。
 *
 * 高频语言排在前面，其他 Monaco 注册语言按名称排序，避免用户在大量语言项中
 * 先看到不常用的配置项。
 */
export const COMMON_LANGUAGE_ORDER = [
  "plaintext",
  "json",
  "markdown",
  "javascript",
  "typescript",
  "html",
  "css",
  "scss",
  "xml",
  "yaml",
  "sql",
  "shell",
  "python",
  "java",
  "go",
  "rust",
  "cpp",
];

/**
 * 将文件字节数格式化为适合 UI 展示的短文本。
 *
 * 该函数用于上传卡片展示文件大小，也用于构造超限错误消息。
 */
export function formatFileSize(size: number) {
  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

/**
 * 读取上传文件并强制按 UTF-8 解码。
 *
 * 使用 `TextDecoder` 的 `fatal` 模式可以在遇到非 UTF-8 字节序列时直接抛错，
 * 比 `File.text()` 更适合表达“仅支持 UTF-8”的产品约束。
 */
export async function readUtf8TextFile(file: File) {
  if (file.size > MAX_TEXT_FILE_SIZE_BYTES) {
    throw new Error(
      `文件不能超过 ${formatFileSize(MAX_TEXT_FILE_SIZE_BYTES)}。`,
    );
  }

  const buffer = await file.arrayBuffer();

  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buffer);
  } catch {
    throw new Error("仅支持 UTF-8 编码的文本文件。");
  }
}

/**
 * 从文件名中提取用于语言识别的扩展名。
 *
 * 常规文件返回 `.json` 这类带点扩展名；Dockerfile 没有点扩展名，但本身就是
 * 语言识别关键字，所以单独归一化为 `dockerfile`。
 */
export function getFileExtension(fileName: string) {
  const normalizedName = fileName.trim().toLowerCase();

  if (
    normalizedName === "dockerfile" ||
    normalizedName.endsWith("/dockerfile")
  ) {
    return "dockerfile";
  }

  const dotIndex = normalizedName.lastIndexOf(".");

  if (dotIndex < 0) {
    return "";
  }

  return normalizedName.slice(dotIndex);
}

/**
 * 合并 Monaco 语言列表和本地兜底语言列表。
 *
 * 该函数会按 language id 去重，Monaco 实时返回的语言信息优先覆盖兜底项，
 * 同时补齐缺失 label 和 extensions，最后按常用语言优先级排序。
 */
export function normalizeLanguageOptions(
  options: DiffLanguageOption[],
): DiffLanguageOption[] {
  const optionMap = new Map<string, DiffLanguageOption>();

  for (const option of [...FALLBACK_LANGUAGE_OPTIONS, ...options]) {
    if (!option.value) {
      continue;
    }

    optionMap.set(option.value, {
      ...option,
      label: option.label || option.value,
      extensions: option.extensions ?? [],
    });
  }

  return [...optionMap.values()].sort((left, right) => {
    const leftIndex = COMMON_LANGUAGE_ORDER.indexOf(left.value);
    const rightIndex = COMMON_LANGUAGE_ORDER.indexOf(right.value);

    if (leftIndex >= 0 || rightIndex >= 0) {
      return (
        (leftIndex >= 0 ? leftIndex : Number.MAX_SAFE_INTEGER) -
        (rightIndex >= 0 ? rightIndex : Number.MAX_SAFE_INTEGER)
      );
    }

    return left.label.localeCompare(right.label);
  });
}

/**
 * 根据上传文件名推断 Monaco 语言。
 *
 * 识别逻辑只依赖扩展名，不读取文件内容，这样可以避免对 Markdown、TXT、日志等
 * 普通文本做不必要的解析；无法识别时回退到 `plaintext`。
 */
export function detectLanguageFromFileName(
  fileName: string,
  options: DiffLanguageOption[],
) {
  const extension = getFileExtension(fileName);

  if (!extension) {
    return DEFAULT_LANGUAGE;
  }

  return (
    options.find((option) =>
      option.extensions.some(
        (item) => item.toLowerCase() === extension.toLowerCase(),
      ),
    )?.value ?? DEFAULT_LANGUAGE
  );
}

/**
 * 根据下载侧和当前语言生成默认文件名。
 *
 * 下载不复用上传文件名，避免用户上传敏感路径或命名信息后被意外带出；这里只按
 * “原始/修改后 + 常见语言扩展名”生成稳定名称。
 */
export function createDownloadName(side: DiffSide, language: string) {
  const baseName = side === "original" ? "original-text" : "modified-text";

  if (language === "json") {
    return `${baseName}.json`;
  }

  if (language === "markdown") {
    return `${baseName}.md`;
  }

  if (language === "html") {
    return `${baseName}.html`;
  }

  if (language === "css") {
    return `${baseName}.css`;
  }

  if (language === "javascript") {
    return `${baseName}.js`;
  }

  if (language === "typescript") {
    return `${baseName}.ts`;
  }

  return `${baseName}.txt`;
}

/**
 * 在浏览器中触发纯文本下载。
 *
 * 内容通过 Blob 临时 URL 生成，下载触发后立即释放 URL，避免长期占用内存。
 */
export function downloadTextFile(fileName: string, content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

/**
 * 创建空差异统计对象。
 *
 * 用函数而不是复用同一个常量对象，是为了每次重置状态时都得到新的引用，
 * 方便 React 状态更新和后续扩展。
 */
export function createEmptyDiffStats(): DiffStats {
  return {
    changes: 0,
    additions: 0,
    deletions: 0,
  };
}
