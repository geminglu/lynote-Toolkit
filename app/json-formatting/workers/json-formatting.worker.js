const JSON_NUMBER_PATTERN = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/;

class LosslessJsonParser {
  position = 0;

  constructor(source) {
    this.source = source;
  }

  parse() {
    this.skipWhitespace();
    const value = this.parseValue();
    this.skipWhitespace();

    if (this.position !== this.source.length) {
      throw this.createError("存在多余内容");
    }

    return value;
  }

  createError(message) {
    return new SyntaxError(`${message}（位置 ${this.position + 1}）`);
  }

  parseArray() {
    this.position += 1;
    this.skipWhitespace();

    const items = [];
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

  parseLiteral(literal) {
    if (!this.source.startsWith(literal, this.position)) {
      throw this.createError("无法识别的值");
    }

    this.position += literal.length;
    if (literal === "null") {
      return { kind: "null" };
    }

    return { kind: "boolean", value: literal === "true" };
  }

  parseNumber() {
    const match = this.source.slice(this.position).match(JSON_NUMBER_PATTERN);
    if (!match) {
      throw this.createError("数字格式无效");
    }

    this.position += match[0].length;
    return { kind: "number", rawValue: match[0] };
  }

  parseObject() {
    this.position += 1;
    this.skipWhitespace();

    const entries = [];
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

  parseString() {
    const startPosition = this.position;
    this.position += 1;

    while (this.position < this.source.length) {
      const character = this.source[this.position];

      if (character === '"') {
        this.position += 1;
        const token = this.source.slice(startPosition, this.position);

        try {
          return { kind: "string", value: JSON.parse(token) };
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

  parseValue() {
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

  skipWhitespace() {
    while (" \t\r\n".includes(this.source[this.position] ?? "\0")) {
      this.position += 1;
    }
  }
}

function unwrapQuotedJsonCandidate(value) {
  const trimmedValue = value.trim();
  if (trimmedValue.length < 2) {
    return null;
  }

  const firstCharacter = trimmedValue[0];
  const lastCharacter = trimmedValue[trimmedValue.length - 1];
  if (
    firstCharacter !== lastCharacter ||
    (firstCharacter !== "'" && firstCharacter !== '"')
  ) {
    return null;
  }

  return trimmedValue.slice(1, -1);
}

function isPlainStringCandidate(value) {
  const trimmedValue = value.trim();
  return !!trimmedValue && !["{", "[", '"', "'"].includes(trimmedValue[0]);
}

function parseJsonSource(value) {
  try {
    const parsedValue = new LosslessJsonParser(value).parse();

    if (parsedValue.kind !== "string") {
      return { ok: true, parsedValue };
    }

    try {
      return {
        ok: true,
        parsedValue: new LosslessJsonParser(parsedValue.value).parse(),
      };
    } catch {
      return { ok: true, parsedValue };
    }
  } catch (error) {
    const unwrappedValue = unwrapQuotedJsonCandidate(value);
    if (unwrappedValue !== null) {
      return parseJsonSource(unwrappedValue);
    }

    if (isPlainStringCandidate(value)) {
      return {
        ok: true,
        parsedValue: { kind: "string", value },
      };
    }

    return {
      ok: false,
      error: error instanceof Error ? error.message : "JSON 解析失败",
    };
  }
}

function serializeString(value) {
  return JSON.stringify(value) ?? '""';
}

function serializeJsonNode(node, level = 0) {
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

  const indentation = "  ";
  const currentIndentation = indentation.repeat(level);
  const childIndentation = indentation.repeat(level + 1);

  if (node.kind === "array") {
    if (node.items.length === 0) {
      return "[]";
    }

    return `[\n${node.items
      .map((item) => `${childIndentation}${serializeJsonNode(item, level + 1)}`)
      .join(",\n")}\n${currentIndentation}]`;
  }

  if (node.entries.length === 0) {
    return "{}";
  }

  return `{\n${node.entries
    .map(
      ([key, nestedValue]) =>
        `${childIndentation}${serializeString(key)}: ${serializeJsonNode(
          nestedValue,
          level + 1,
        )}`,
    )
    .join(",\n")}\n${currentIndentation}}`;
}

/**
 * 静态导出会把 Worker URL 作为独立资源复制，因此这里保持为无依赖 JavaScript。
 */
self.addEventListener("message", (event) => {
  const result = parseJsonSource(event.data.value);
  self.postMessage({
    ...event.data,
    result: result.ok
      ? {
          ok: true,
          value: serializeJsonNode(result.parsedValue),
        }
      : result,
  });
});
