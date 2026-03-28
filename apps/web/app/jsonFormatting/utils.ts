import type { JsonHistoryRecord } from "./type";

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

export function sortHistoryRecords(records: JsonHistoryRecord[]) {
  return [...records].sort(
    (first, second) => second.updatedAt - first.updatedAt,
  );
}

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

export async function readJsonFile(file: File) {
  return file.text();
}

export function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  anchor.click();

  URL.revokeObjectURL(url);
}

export function createDownloadName(side: "left" | "right") {
  const dateText = new Date().toISOString().replaceAll(":", "-");
  return `json-formatting-${side}-${dateText}.json`;
}
