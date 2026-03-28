import type { JsonHistoryRecord, JsonSortOrder } from "./type";

type JsonTransformSuccess = {
  ok: true;
  value: string;
};

type JsonTransformFailure = {
  ok: false;
  error: string;
};

export type JsonTransformResult = JsonTransformSuccess | JsonTransformFailure;

type ParsedJsonSource =
  | {
      ok: true;
      parsedValue: unknown;
    }
  | {
      ok: false;
      error: string;
    };

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "JSON 解析失败";
}

function createJsonTransformFailure(error: string): JsonTransformFailure {
  return {
    ok: false,
    error,
  };
}

/**
 * 兼容用户直接粘贴带外层引号的 JSON 字符串。
 * 例如：'{"appId":"xxx"}'
 * 这种内容本身不是合法 JSON，但去掉外层单引号后，内部其实是合法 JSON。
 */
function unwrapQuotedJsonCandidate(value: string) {
  const trimmedValue = value.trim();

  if (trimmedValue.length < 2) {
    return null;
  }

  const firstCharacter = trimmedValue[0];
  const lastCharacter = trimmedValue[trimmedValue.length - 1];

  if (firstCharacter !== lastCharacter) {
    return null;
  }

  if (firstCharacter !== "'" && firstCharacter !== '"') {
    return null;
  }

  return trimmedValue.slice(1, -1);
}

/**
 * 当输入明显不是对象、数组或合法 JSON 字面量时，
 * 将其视为普通字符串，这样右侧可以立即得到 JSON 字符串格式的结果。
 */
function isPlainStringCandidate(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return false;
  }

  const firstCharacter = trimmedValue[0];

  return !["{", "[", '"', "'"].includes(firstCharacter);
}

/**
 * 统一解析当前输入。
 * 1. 普通 JSON 直接解析。
 * 2. 如果解析结果是字符串，再尝试把该字符串当作 JSON 继续解析一次。
 *    这样可以兼容类似 "{\"name\":\"tool\"}" 这类已转义的 JSON 字符串。
 * 3. 如果用户输入的是外层包裹引号的 JSON 文本，
 *    则先剥掉外层引号，再把内部内容当作 JSON 解析。
 * 4. 如果输入本身就是普通文本，则直接按字符串处理，
 *    让右侧可以立即显示为合法的 JSON 字符串。
 */
function parseJsonSource(value: string): ParsedJsonSource {
  try {
    const parsedValue = JSON.parse(value);

    if (typeof parsedValue !== "string") {
      return {
        ok: true,
        parsedValue,
      };
    }

    try {
      return {
        ok: true,
        parsedValue: JSON.parse(parsedValue),
      };
    } catch {
      return {
        ok: true,
        parsedValue,
      };
    }
  } catch (error) {
    const unwrappedValue = unwrapQuotedJsonCandidate(value);

    if (unwrappedValue !== null) {
      return parseJsonSource(unwrappedValue);
    }

    if (isPlainStringCandidate(value)) {
      return {
        ok: true,
        parsedValue: value,
      };
    }

    return {
      ok: false,
      error: getErrorMessage(error),
    };
  }
}

function isSortableJsonRoot(value: unknown) {
  return Array.isArray(value) || (typeof value === "object" && value !== null);
}

function compareJsonKeys(
  firstKey: string,
  secondKey: string,
  order: Exclude<JsonSortOrder, "none">,
) {
  if (firstKey === secondKey) {
    return 0;
  }

  if (order === "asc") {
    return firstKey < secondKey ? -1 : 1;
  }

  return firstKey < secondKey ? 1 : -1;
}

/**
 * 递归排序 JSON 对象的 key
 * @param value - JSON 对象
 * @param order - 排序顺序
 * @returns 排序后的 JSON 对象
 */
function sortJsonKeysDeep(
  value: unknown,
  order: Exclude<JsonSortOrder, "none">,
): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => sortJsonKeysDeep(item, order));
  }

  if (typeof value !== "object" || value === null) {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value)
      .sort(([firstKey], [secondKey]) =>
        compareJsonKeys(firstKey, secondKey, order),
      )
      .map(([key, nestedValue]) => [key, sortJsonKeysDeep(nestedValue, order)]),
  );
}

/**
 * 格式化 JSON 文本
 * @param value - JSON 文本
 * @param space - 空格数量
 * @returns 格式化后的 JSON 文本
 */
export function formatJsonText(value: string, space = 2): JsonTransformResult {
  const result = parseJsonSource(value);

  if (!result.ok) {
    return result;
  }

  return {
    ok: true,
    value: JSON.stringify(result.parsedValue, null, space),
  };
}

/**
 * 压缩 JSON 文本
 * @param value - JSON 文本
 * @returns 压缩后的 JSON 文本
 */
export function compressJsonText(value: string): JsonTransformResult {
  const result = parseJsonSource(value);

  if (!result.ok) {
    return result;
  }

  return {
    ok: true,
    value: JSON.stringify(result.parsedValue),
  };
}

/**
 * 排序 JSON 文本
 * @param value - JSON 文本
 * @param order - 排序顺序
 * @param space - 空格数量
 * @returns 排序后的 JSON 文本
 */
export function sortJsonText(
  value: string,
  order: Exclude<JsonSortOrder, "none">,
  space = 2,
): JsonTransformResult {
  const result = parseJsonSource(value);

  if (!result.ok) {
    return result;
  }

  if (!isSortableJsonRoot(result.parsedValue)) {
    return createJsonTransformFailure("当前内容不是对象或数组，无法排序 key");
  }

  return {
    ok: true,
    value: JSON.stringify(
      sortJsonKeysDeep(result.parsedValue, order),
      null,
      space,
    ),
  };
}

/**
 * 如果当前文本本身就是一个 JSON 字符串字面量，
 * 说明它已经处于“已转义”的状态，此时不再重复转义。
 */
export function isEscapedJsonString(value: string) {
  try {
    const parsedValue = JSON.parse(value);

    if (typeof parsedValue !== "string") {
      return false;
    }

    return JSON.stringify(parsedValue).replaceAll("/", "\\/") === value;
  } catch {
    return false;
  }
}

/**
 * 将当前文本转成 JSON 字符串字面量，并显式转义 `/`。
 * 这样得到的内容可以直接作为字符串再次放回 JSON 或代码片段中使用。
 */
export function escapeJsonString(value: string) {
  if (isEscapedJsonString(value)) {
    return value;
  }

  return JSON.stringify(value).replaceAll("/", "\\/");
}

export function getLeftEditorError(value: string) {
  if (!value.trim()) {
    return "";
  }

  const result = formatJsonText(value, 2);
  return result.ok ? "" : result.error;
}

/**
 * 创建历史记录标题
 * @param leftValue - 左侧 JSON 文本
 * @param rightValue - 右侧 JSON 文本
 * @param timestamp - 时间戳
 * @returns 历史记录标题
 */
export function createHistoryTitle(
  leftValue: string,
  rightValue: string,
  timestamp: number,
) {
  const source = [leftValue, rightValue]
    .map((item) => item.trim())
    .find(Boolean);

  if (source) {
    return source.replace(/\s+/g, " ").slice(0, 28);
  }

  const formatter = new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  return `未命名 ${formatter.format(timestamp)}`;
}

/**
 * 排序历史记录
 * @param records - 历史记录
 * @returns 排序后的历史记录
 */
export function sortHistoryRecords(records: JsonHistoryRecord[]) {
  return [...records].sort(
    (first, second) => second.updatedAt - first.updatedAt,
  );
}

/**
 * 构建历史记录
 * @param params - 历史记录参数
 * @returns 历史记录
 */
export function buildHistoryRecord(
  params: Pick<
    JsonHistoryRecord,
    "id" | "leftValue" | "rightValue" | "createdAt" | "updatedAt"
  >,
): JsonHistoryRecord {
  return {
    ...params,
    title: createHistoryTitle(
      params.leftValue,
      params.rightValue,
      params.updatedAt,
    ),
  };
}

/**
 * 读取 JSON 文件
 * @param file - 文件
 * @returns 文件内容
 */
export async function readJsonFile(file: File) {
  return file.text();
}

/**
 * 下载文本文件
 * @param filename - 文件名
 * @param content - 文件内容
 */
export function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  anchor.click();

  URL.revokeObjectURL(url);
}

/**
 * 创建下载文件名
 * @param side - 侧边
 * @returns 下载文件名
 */
export function createDownloadName(side: "left" | "right") {
  const dateText = new Date().toISOString().replaceAll(":", "-");
  return `json-formatting-${side}-${dateText}.json`;
}
