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
      parsedValue: JsonValueNode;
    }
  | {
      ok: false;
      error: string;
    };

interface JsonArrayNode {
  kind: "array";
  items: JsonValueNode[];
}

interface JsonBooleanNode {
  kind: "boolean";
  value: boolean;
}

interface JsonNullNode {
  kind: "null";
}

interface JsonNumberNode {
  kind: "number";
  rawValue: string;
}

interface JsonObjectNode {
  kind: "object";
  entries: [string, JsonValueNode][];
}

interface JsonStringNode {
  kind: "string";
  value: string;
}

type JsonValueNode =
  | JsonArrayNode
  | JsonBooleanNode
  | JsonNullNode
  | JsonNumberNode
  | JsonObjectNode
  | JsonStringNode;

const JSON_NUMBER_PATTERN = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/;

/**
 * 原生 JSON.parse 会把数字立即转换成 number，无法安全承载 64 位整数。
 * 这里仅构建格式化所需的轻量语法树，数字节点始终保存原始 token。
 */
class LosslessJsonParser {
  private position = 0;

  constructor(private readonly source: string) {}

  parse(): JsonValueNode {
    this.skipWhitespace();
    const value = this.parseValue();
    this.skipWhitespace();

    if (this.position !== this.source.length) {
      throw this.createError("存在多余内容");
    }

    return value;
  }

  private createError(message: string) {
    return new SyntaxError(`${message}（位置 ${this.position + 1}）`);
  }

  private parseArray(): JsonArrayNode {
    this.position += 1;
    this.skipWhitespace();

    const items: JsonValueNode[] = [];
    if (this.source[this.position] === "]") {
      this.position += 1;
      return { kind: "array", items };
    }

    while (this.position < this.source.length) {
      items.push(this.parseValue());
      this.skipWhitespace();

      const character = this.source[this.position];
      if (character === "]") {
        this.position += 1;
        return { kind: "array", items };
      }
      if (character !== ",") {
        throw this.createError("数组元素之间缺少逗号");
      }

      this.position += 1;
      this.skipWhitespace();
    }

    throw this.createError("数组缺少结束符 ]");
  }

  private parseLiteral(
    literal: "false" | "null" | "true",
  ): JsonBooleanNode | JsonNullNode {
    if (!this.source.startsWith(literal, this.position)) {
      throw this.createError("无法识别的值");
    }

    this.position += literal.length;
    if (literal === "null") {
      return { kind: "null" };
    }

    return { kind: "boolean", value: literal === "true" };
  }

  private parseNumber(): JsonNumberNode {
    const match = this.source.slice(this.position).match(JSON_NUMBER_PATTERN);
    if (!match) {
      throw this.createError("数字格式无效");
    }

    this.position += match[0].length;
    return { kind: "number", rawValue: match[0] };
  }

  private parseObject(): JsonObjectNode {
    this.position += 1;
    this.skipWhitespace();

    const entries: [string, JsonValueNode][] = [];
    if (this.source[this.position] === "}") {
      this.position += 1;
      return { entries, kind: "object" };
    }

    while (this.position < this.source.length) {
      if (this.source[this.position] !== '"') {
        throw this.createError("对象 key 必须是双引号字符串");
      }
      const key = this.parseString().value;
      this.skipWhitespace();

      if (this.source[this.position] !== ":") {
        throw this.createError("对象 key 后缺少冒号");
      }
      this.position += 1;
      this.skipWhitespace();

      entries.push([key, this.parseValue()]);
      this.skipWhitespace();

      const character = this.source[this.position];
      if (character === "}") {
        this.position += 1;
        return { entries, kind: "object" };
      }
      if (character !== ",") {
        throw this.createError("对象成员之间缺少逗号");
      }

      this.position += 1;
      this.skipWhitespace();
    }

    throw this.createError("对象缺少结束符 }");
  }

  private parseString(): JsonStringNode {
    const startPosition = this.position;
    this.position += 1;

    while (this.position < this.source.length) {
      const character = this.source[this.position];

      if (character === '"') {
        this.position += 1;
        const token = this.source.slice(startPosition, this.position);

        try {
          return { kind: "string", value: JSON.parse(token) as string };
        } catch {
          throw this.createError("字符串转义无效");
        }
      }

      if (character === "\\") {
        this.position += 2;
        continue;
      }

      if (character.charCodeAt(0) < 0x20) {
        throw this.createError("字符串包含未转义的控制字符");
      }

      this.position += 1;
    }

    throw this.createError("字符串缺少结束引号");
  }

  private parseValue(): JsonValueNode {
    const character = this.source[this.position];

    if (character === "{") {
      return this.parseObject();
    }
    if (character === "[") {
      return this.parseArray();
    }
    if (character === '"') {
      return this.parseString();
    }
    if (character === "t") {
      return this.parseLiteral("true");
    }
    if (character === "f") {
      return this.parseLiteral("false");
    }
    if (character === "n") {
      return this.parseLiteral("null");
    }
    if (character === "-" || (character >= "0" && character <= "9")) {
      return this.parseNumber();
    }

    throw this.createError("无法识别的 JSON 值");
  }

  private skipWhitespace() {
    while (" \t\r\n".includes(this.source[this.position] ?? "\0")) {
      this.position += 1;
    }
  }
}

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
function parseLosslessJson(value: string) {
  return new LosslessJsonParser(value).parse();
}

function parseJsonSource(value: string): ParsedJsonSource {
  try {
    const parsedValue = parseLosslessJson(value);

    if (parsedValue.kind !== "string") {
      return {
        ok: true,
        parsedValue,
      };
    }

    try {
      return {
        ok: true,
        parsedValue: parseLosslessJson(parsedValue.value),
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
        parsedValue: {
          kind: "string",
          value,
        },
      };
    }

    return {
      ok: false,
      error: getErrorMessage(error),
    };
  }
}

function isSortableJsonRoot(value: JsonValueNode) {
  return value.kind === "array" || value.kind === "object";
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

function serializeString(value: string) {
  return JSON.stringify(value) ?? '""';
}

function normalizeSpace(space: number) {
  if (!Number.isFinite(space)) {
    return 0;
  }

  return Math.min(10, Math.max(0, Math.trunc(space)));
}

/**
 * 对象直接按 entry 序列输出，避免整数形式的 key 被普通对象枚举规则重新排序。
 */
function serializeJsonNode(
  node: JsonValueNode,
  space: number,
  level = 0,
  order?: Exclude<JsonSortOrder, "none">,
): string {
  if (node.kind === "null") {
    return "null";
  }
  if (node.kind === "boolean") {
    return node.value ? "true" : "false";
  }
  if (node.kind === "number") {
    return node.rawValue;
  }
  if (node.kind === "string") {
    return serializeString(node.value);
  }

  const indentation = " ".repeat(normalizeSpace(space));
  const currentIndentation = indentation.repeat(level);
  const childIndentation = indentation.repeat(level + 1);

  if (node.kind === "array") {
    if (node.items.length === 0) {
      return "[]";
    }

    const serializedItems = node.items.map((item) =>
      serializeJsonNode(item, space, level + 1, order),
    );
    if (!indentation) {
      return `[${serializedItems.join(",")}]`;
    }

    return `[\n${serializedItems
      .map((item) => `${childIndentation}${item}`)
      .join(",\n")}\n${currentIndentation}]`;
  }

  const entries = order
    ? [...node.entries].sort(([firstKey], [secondKey]) =>
        compareJsonKeys(firstKey, secondKey, order),
      )
    : node.entries;
  if (entries.length === 0) {
    return "{}";
  }

  const serializedEntries = entries.map(([key, nestedValue]) => {
    const separator = indentation ? ": " : ":";
    return `${serializeString(key)}${separator}${serializeJsonNode(
      nestedValue,
      space,
      level + 1,
      order,
    )}`;
  });
  if (!indentation) {
    return `{${serializedEntries.join(",")}}`;
  }

  return `{\n${serializedEntries
    .map((entry) => `${childIndentation}${entry}`)
    .join(",\n")}\n${currentIndentation}}`;
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
    value: serializeJsonNode(result.parsedValue, space),
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
    value: serializeJsonNode(result.parsedValue, 0),
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
    value: serializeJsonNode(result.parsedValue, space, 0, order),
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

    return typeof parsedValue === "string";
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
  const source = [leftValue, rightValue].find((item) => /\S/.test(item));

  if (source) {
    const contentStart = source.search(/\S/);
    return source
      .slice(contentStart, contentStart + 256)
      .replace(/\s+/g, " ")
      .slice(0, 28);
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
