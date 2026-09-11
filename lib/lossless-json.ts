export interface LosslessJsonArrayNode {
  kind: "array";
  items: LosslessJsonValue[];
}

export interface LosslessJsonBooleanNode {
  kind: "boolean";
  value: boolean;
}

export interface LosslessJsonNullNode {
  kind: "null";
}

export interface LosslessJsonNumberNode {
  kind: "number";
  rawValue: string;
  /** 非 JSON 输入格式中的原始数字 token，用于原格式往返。 */
  sourceValue?: string;
}

export interface LosslessJsonObjectNode {
  kind: "object";
  entries: Array<[string, LosslessJsonValue]>;
}

export interface LosslessJsonStringNode {
  kind: "string";
  value: string;
}

export type LosslessJsonValue =
  | LosslessJsonArrayNode
  | LosslessJsonBooleanNode
  | LosslessJsonNullNode
  | LosslessJsonNumberNode
  | LosslessJsonObjectNode
  | LosslessJsonStringNode;

export type UnsafeIntegerMode = "bigint" | "number" | "string";

export interface LosslessJsonNativeOptions {
  unsafeInteger?: UnsafeIntegerMode;
}

const JSON_NUMBER_PATTERN = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/;
const INTEGER_PARTS_PATTERN = /^(-?)(\d+)(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/;
const MAX_SAFE_INTEGER_TEXT = String(Number.MAX_SAFE_INTEGER);
const BIGINT_ZERO = BigInt(0);
const MAX_BIGINT_DIGITS = BigInt(100_000);

interface IntegerAnalysis {
  exact: boolean;
  negative: boolean;
  significantDigits: string;
  trailingZeroCount: bigint;
}

/**
 * 原生 JSON.parse 会先把数字转换为 number，无法安全承载 64 位整数。
 * 此解析器只构建轻量语法树，数字节点始终保留原始 token。
 */
class LosslessJsonParser {
  private position = 0;

  constructor(private readonly source: string) {}

  parse(): LosslessJsonValue {
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

  private parseArray(): LosslessJsonArrayNode {
    this.position += 1;
    this.skipWhitespace();

    const items: LosslessJsonValue[] = [];
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
  ): LosslessJsonBooleanNode | LosslessJsonNullNode {
    if (!this.source.startsWith(literal, this.position)) {
      throw this.createError("无法识别的值");
    }

    this.position += literal.length;
    if (literal === "null") {
      return { kind: "null" };
    }

    return { kind: "boolean", value: literal === "true" };
  }

  private parseNumber(): LosslessJsonNumberNode {
    const match = this.source.slice(this.position).match(JSON_NUMBER_PATTERN);
    if (!match) {
      throw this.createError("数字格式无效");
    }

    this.position += match[0].length;
    return { kind: "number", rawValue: match[0] };
  }

  private parseObject(): LosslessJsonObjectNode {
    this.position += 1;
    this.skipWhitespace();

    const entries: Array<[string, LosslessJsonValue]> = [];
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

  private parseString(): LosslessJsonStringNode {
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

  private parseValue(): LosslessJsonValue {
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

function normalizeSpace(space: number) {
  if (!Number.isFinite(space)) {
    return 0;
  }

  return Math.min(10, Math.max(0, Math.trunc(space)));
}

function serializeString(value: string) {
  return JSON.stringify(value) ?? '""';
}

function analyzeInteger(rawValue: string): IntegerAnalysis | null {
  const match = INTEGER_PARTS_PATTERN.exec(rawValue);
  if (!match) {
    return null;
  }

  const [, sign, integerPart, fractionPart = "", exponentPart = "0"] = match;
  const digits = `${integerPart}${fractionPart}`;
  const scale = BigInt(exponentPart) - BigInt(fractionPart.length);

  if (/^0+$/.test(digits)) {
    return {
      exact: true,
      negative: false,
      significantDigits: "0",
      trailingZeroCount: BIGINT_ZERO,
    };
  }

  if (scale >= BIGINT_ZERO) {
    return {
      exact: true,
      negative: sign === "-",
      significantDigits: digits.replace(/^0+/, ""),
      trailingZeroCount: scale,
    };
  }

  {
    const decimalLength = -scale;
    if (decimalLength > BigInt(digits.length)) {
      return {
        exact: false,
        negative: sign === "-",
        significantDigits: digits,
        trailingZeroCount: BIGINT_ZERO,
      };
    }

    const decimalLengthNumber = Number(decimalLength);
    const fractionalDigits = digits.slice(digits.length - decimalLengthNumber);
    if (!/^0*$/.test(fractionalDigits)) {
      return {
        exact: false,
        negative: sign === "-",
        significantDigits: digits,
        trailingZeroCount: BIGINT_ZERO,
      };
    }
    const integerDigits =
      digits.slice(0, digits.length - decimalLengthNumber).replace(/^0+/, "") ||
      "0";

    return {
      exact: true,
      negative: sign === "-",
      significantDigits: integerDigits,
      trailingZeroCount: BIGINT_ZERO,
    };
  }
}

/** 将 JSON 数字 token 精确转换为整数；小数值返回 null。 */
export function losslessNumberToInteger(rawValue: string): bigint | null {
  const analysis = analyzeInteger(rawValue);

  if (!analysis?.exact) {
    return null;
  }
  if (analysis.trailingZeroCount > MAX_BIGINT_DIGITS) {
    throw new RangeError("数字规模过大，无法安全转换为 BigInt");
  }

  const magnitude = `${analysis.significantDigits}${"0".repeat(
    Number(analysis.trailingZeroCount),
  )}`;
  return BigInt(`${analysis.negative ? "-" : ""}${magnitude}`);
}

export function isUnsafeLosslessInteger(rawValue: string) {
  const analysis = analyzeInteger(rawValue);

  if (!analysis?.exact) {
    return false;
  }

  const digitCount =
    BigInt(analysis.significantDigits.length) + analysis.trailingZeroCount;
  if (digitCount !== BigInt(MAX_SAFE_INTEGER_TEXT.length)) {
    return digitCount > BigInt(MAX_SAFE_INTEGER_TEXT.length);
  }

  const magnitude = `${analysis.significantDigits}${"0".repeat(
    Number(analysis.trailingZeroCount),
  )}`;
  return magnitude > MAX_SAFE_INTEGER_TEXT;
}

export function parseLosslessJson(source: string): LosslessJsonValue {
  return new LosslessJsonParser(source).parse();
}

export function serializeLosslessJson(
  node: LosslessJsonValue,
  space = 0,
  compareKeys?: (firstKey: string, secondKey: string) => number,
): string {
  const indentation = " ".repeat(normalizeSpace(space));

  function serialize(current: LosslessJsonValue, level: number): string {
    if (current.kind === "null") {
      return "null";
    }
    if (current.kind === "boolean") {
      return current.value ? "true" : "false";
    }
    if (current.kind === "number") {
      return current.rawValue;
    }
    if (current.kind === "string") {
      return serializeString(current.value);
    }

    const currentIndentation = indentation.repeat(level);
    const childIndentation = indentation.repeat(level + 1);

    if (current.kind === "array") {
      if (current.items.length === 0) {
        return "[]";
      }

      const serializedItems = current.items.map((item) =>
        serialize(item, level + 1),
      );
      if (!indentation) {
        return `[${serializedItems.join(",")}]`;
      }

      return `[\n${serializedItems
        .map((item) => `${childIndentation}${item}`)
        .join(",\n")}\n${currentIndentation}]`;
    }

    const entries = compareKeys
      ? [...current.entries].sort(([firstKey], [secondKey]) =>
          compareKeys(firstKey, secondKey),
        )
      : current.entries;
    if (entries.length === 0) {
      return "{}";
    }

    const separator = indentation ? ": " : ":";
    const serializedEntries = entries.map(
      ([key, value]) =>
        `${serializeString(key)}${separator}${serialize(value, level + 1)}`,
    );
    if (!indentation) {
      return `{${serializedEntries.join(",")}}`;
    }

    return `{\n${serializedEntries
      .map((entry) => `${childIndentation}${entry}`)
      .join(",\n")}\n${currentIndentation}}`;
  }

  return serialize(node, 0);
}

/**
 * 需要普通 JavaScript 值的调用方必须显式选择超范围整数的承载方式，
 * 避免在不知道的情况下恢复为有损 number。
 */
export function losslessJsonToNative(
  node: LosslessJsonValue,
  options: LosslessJsonNativeOptions = {},
): unknown {
  const unsafeIntegerMode = options.unsafeInteger ?? "string";

  switch (node.kind) {
    case "null":
      return null;
    case "boolean":
    case "string":
      return node.value;
    case "number": {
      if (!isUnsafeLosslessInteger(node.rawValue)) {
        return Number(node.rawValue);
      }

      if (unsafeIntegerMode === "bigint") {
        return losslessNumberToInteger(node.rawValue);
      }
      if (unsafeIntegerMode === "number") {
        return Number(node.rawValue);
      }
      return node.rawValue;
    }
    case "array":
      return node.items.map((item) => losslessJsonToNative(item, options));
    case "object": {
      const result: Record<string, unknown> = Object.create(null) as Record<
        string,
        unknown
      >;
      node.entries.forEach(([key, value]) => {
        result[key] = losslessJsonToNative(value, options);
      });
      return result;
    }
  }
}
