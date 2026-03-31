import type {
  UrlParts,
  UrlQueryEntry,
  UrlToolConfig,
  UrlToolDetectedInputType,
  UrlToolInputMode,
  UrlToolOperation,
  UrlToolOutputItem,
  UrlToolResult,
} from "./type";

type Option<T extends string> = {
  label: string;
  value: T;
  description: string;
};

const ABSOLUTE_URL_PATTERN = /^[a-zA-Z][a-zA-Z\d+.-]*:/;

export const URL_INPUT_MODE_OPTIONS: Array<Option<UrlToolInputMode>> = [
  {
    label: "完整 URL",
    value: "full-url",
    description:
      "适合处理完整链接、回调地址和跳转 URL，可做整段编解码与结构解析。",
  },
  {
    label: "参数值",
    value: "component",
    description:
      "适合处理单个 query value、redirect_uri 或 path 片段，对应 `encodeURIComponent` / `decodeURIComponent`。",
  },
  {
    label: "Query String",
    value: "query-string",
    description: "适合解析 `a=1&b=2` 这类参数串，保留重复 key 和空值参数。",
  },
];

export const URL_OPERATION_OPTIONS: Array<Option<UrlToolOperation>> = [
  {
    label: "编码",
    value: "encode",
    description:
      "根据当前模式执行 URL 编码，适合回调地址、嵌套参数和跳转链接。",
  },
  {
    label: "解码",
    value: "decode",
    description: "将百分号编码内容还原为可读文本，并根据选项处理 `+` 号。",
  },
  {
    label: "解析",
    value: "parse",
    description: "拆解完整 URL 或 Query 参数，输出结构化结果和重组后的内容。",
  },
];

const ALLOWED_OPERATIONS_BY_MODE: Record<UrlToolInputMode, UrlToolOperation[]> =
  {
    "full-url": ["encode", "decode", "parse"],
    component: ["encode", "decode"],
    "query-string": ["encode", "decode", "parse"],
  };

export const DEFAULT_URL_TOOL_CONFIG: UrlToolConfig = {
  input: "",
  inputMode: "full-url",
  operation: "parse",
  plusAsSpace: true,
};

function normalizeDecodeInput(value: string, plusAsSpace: boolean) {
  return plusAsSpace ? value.replaceAll("+", " ") : value;
}

function createDecodeErrorMessage(mode: UrlToolInputMode) {
  if (mode === "full-url") {
    return "当前内容不是合法的整段 URL 编码，请检查是否存在不完整的 `%XX` 片段。";
  }

  if (mode === "component") {
    return "当前内容不是合法的参数值编码，请检查是否存在不完整的 `%XX` 片段，或当前模式是否应该改为“完整 URL”。";
  }

  return "当前 Query String 中包含不合法的编码片段，请检查 `%XX` 是否完整，或根据需要开启 `+` 号转空格。";
}

function safeDecodeUri(
  value: string,
  mode: UrlToolInputMode,
  plusAsSpace: boolean,
) {
  try {
    const normalized = normalizeDecodeInput(value, plusAsSpace);

    return mode === "full-url"
      ? decodeURI(normalized)
      : decodeURIComponent(normalized);
  } catch {
    throw new Error(createDecodeErrorMessage(mode));
  }
}

function parseRawQuerySegments(input: string) {
  const normalized = input.replace(/^\?/, "");

  if (!normalized) {
    return [];
  }

  return normalized.split("&").map((segment, index) => {
    const separatorIndex = segment.indexOf("=");
    const hasExplicitValue = separatorIndex >= 0;
    const rawKey = hasExplicitValue
      ? segment.slice(0, separatorIndex)
      : segment;
    const rawValue = hasExplicitValue ? segment.slice(separatorIndex + 1) : "";

    return {
      index,
      rawSegment: segment,
      rawKey,
      rawValue,
      hasExplicitValue,
    };
  });
}

function parseQueryStringEntries(
  input: string,
  plusAsSpace: boolean,
): UrlQueryEntry[] {
  return parseRawQuerySegments(input).map((segment) => ({
    id: `query-${segment.index}`,
    rawSegment: segment.rawSegment,
    rawKey: segment.rawKey,
    rawValue: segment.rawValue,
    decodedKey: safeDecodeUri(segment.rawKey, "component", plusAsSpace),
    decodedValue: safeDecodeUri(segment.rawValue, "component", plusAsSpace),
    hasExplicitValue: segment.hasExplicitValue,
  }));
}

function encodeQueryEntries(entries: UrlQueryEntry[]) {
  return entries
    .map((entry) => {
      const encodedKey = encodeURIComponent(entry.decodedKey);

      if (!entry.hasExplicitValue) {
        return encodedKey;
      }

      return `${encodedKey}=${encodeURIComponent(entry.decodedValue)}`;
    })
    .join("&");
}

function decodeQueryEntriesToText(entries: UrlQueryEntry[]) {
  return entries
    .map((entry) => {
      if (!entry.hasExplicitValue) {
        return entry.decodedKey;
      }

      return `${entry.decodedKey}=${entry.decodedValue}`;
    })
    .join("&");
}

function createQueryJson(entries: UrlQueryEntry[]) {
  const grouped: Record<string, string | string[]> = {};

  entries.forEach((entry) => {
    const value = entry.decodedValue;
    const existing = grouped[entry.decodedKey];

    if (typeof existing === "undefined") {
      grouped[entry.decodedKey] = value;
      return;
    }

    if (Array.isArray(existing)) {
      existing.push(value);
      return;
    }

    grouped[entry.decodedKey] = [existing, value];
  });

  return JSON.stringify(grouped, null, 2);
}

function parseAbsoluteUrl(input: string): URL {
  const trimmed = input.trim();

  if (!trimmed) {
    throw new Error("请输入需要处理的 URL 或参数内容。");
  }

  if (!ABSOLUTE_URL_PATTERN.test(trimmed)) {
    throw new Error(
      "完整 URL 解析当前仅支持带协议的绝对地址，例如 `https://example.com/callback?a=1`。",
    );
  }

  try {
    return new URL(trimmed);
  } catch {
    throw new Error("当前内容不是合法的完整 URL，请检查协议、域名和参数格式。");
  }
}

function createUrlParts(url: URL): UrlParts {
  return {
    href: url.href,
    origin: url.origin,
    protocol: url.protocol,
    host: url.host,
    hostname: url.hostname,
    port: url.port,
    pathname: url.pathname,
    search: url.search,
    hash: url.hash,
  };
}

function detectInputType(input: string): UrlToolDetectedInputType {
  const trimmed = input.trim();

  if (!trimmed) {
    return "empty";
  }

  if (ABSOLUTE_URL_PATTERN.test(trimmed)) {
    return "full-url";
  }

  if (trimmed.startsWith("?")) {
    return "query-string";
  }

  if (trimmed.includes("&") || trimmed.includes("=")) {
    return "query-string";
  }

  return "component";
}

function createOutput(
  id: string,
  title: string,
  description: string,
  value: string,
): UrlToolOutputItem {
  return {
    id,
    title,
    description,
    value,
  };
}

function createSummary(
  config: UrlToolConfig,
  detectedInputType: UrlToolDetectedInputType,
  queryEntries: UrlQueryEntry[],
) {
  const modeLabel =
    URL_INPUT_MODE_OPTIONS.find((option) => option.value === config.inputMode)
      ?.label ?? config.inputMode;
  const operationLabel =
    URL_OPERATION_OPTIONS.find((option) => option.value === config.operation)
      ?.label ?? config.operation;

  return [
    `已按“${modeLabel}”执行${operationLabel}`,
    `输入自动识别为 ${getDetectedInputTypeLabel(detectedInputType)}`,
    queryEntries.length > 0
      ? `解析到 ${queryEntries.length} 个参数项`
      : "当前没有解析到参数项",
  ].join("，");
}

function buildWarnings(
  config: UrlToolConfig,
  detectedInputType: UrlToolDetectedInputType,
  queryEntries: UrlQueryEntry[],
  primaryResult: string,
) {
  const warnings: string[] = [];

  if (
    detectedInputType !== "empty" &&
    detectedInputType !== config.inputMode &&
    !(detectedInputType === "query-string" && config.inputMode === "full-url")
  ) {
    warnings.push(
      `当前输入看起来更像“${getDetectedInputTypeLabel(detectedInputType)}”，如果结果不符合预期，可以切换处理模式后重试。`,
    );
  }

  if (
    config.plusAsSpace &&
    (config.operation === "decode" || config.operation === "parse") &&
    primaryResult.includes(" ")
  ) {
    warnings.push(
      "当前已按表单规则将 `+` 视为空格；如果你的目标内容需要保留 `+`，可以关闭该选项后重试。",
    );
  }

  const duplicateKeys = new Set<string>();
  const seenKeys = new Set<string>();

  queryEntries.forEach((entry) => {
    if (seenKeys.has(entry.decodedKey)) {
      duplicateKeys.add(entry.decodedKey);
    }

    seenKeys.add(entry.decodedKey);
  });

  if (duplicateKeys.size > 0) {
    warnings.push(
      `检测到重复参数 key：${Array.from(duplicateKeys).join("、")}，页面已按原顺序完整保留。`,
    );
  }

  return warnings;
}

function executeEncode(config: UrlToolConfig) {
  const input = config.input;

  if (!input.trim() && input.length === 0) {
    throw new Error("请输入需要编码的内容。");
  }

  if (config.inputMode === "full-url") {
    return {
      primaryTitle: "编码结果",
      primaryDescription:
        "当前按整段 URL 规则编码，适合完整链接和回调地址，结构字符会尽量保留。",
      primaryResult: encodeURI(input),
      urlParts: null,
      queryEntries: [],
      queryJsonText: "",
      rebuiltQuery: "",
      rebuiltUrl: "",
    };
  }

  if (config.inputMode === "component") {
    return {
      primaryTitle: "编码结果",
      primaryDescription:
        "当前按参数值规则编码，对应 `encodeURIComponent`，适合单个 query value 或 redirect_uri。",
      primaryResult: encodeURIComponent(input),
      urlParts: null,
      queryEntries: [],
      queryJsonText: "",
      rebuiltQuery: "",
      rebuiltUrl: "",
    };
  }

  const entries = parseRawQuerySegments(input).map((segment) => ({
    id: `raw-${segment.index}`,
    rawSegment: segment.rawSegment,
    rawKey: segment.rawKey,
    rawValue: segment.rawValue,
    decodedKey: segment.rawKey,
    decodedValue: segment.rawValue,
    hasExplicitValue: segment.hasExplicitValue,
  }));
  const rebuiltQuery = encodeQueryEntries(entries);

  return {
    primaryTitle: "编码结果",
    primaryDescription:
      "当前按 Query 参数逐项编码，保留重复 key、空值参数和原始参数顺序。",
    primaryResult: rebuiltQuery,
    urlParts: null,
    queryEntries: entries,
    queryJsonText: createQueryJson(entries),
    rebuiltQuery,
    rebuiltUrl: "",
  };
}

function executeDecode(config: UrlToolConfig) {
  if (!config.input.trim() && config.input.length === 0) {
    throw new Error("请输入需要解码的内容。");
  }

  if (config.inputMode === "full-url") {
    return {
      primaryTitle: "解码结果",
      primaryDescription:
        "当前按整段 URL 规则解码，适合查看完整链接里的百分号编码内容。",
      primaryResult: safeDecodeUri(config.input, "full-url", false),
      urlParts: null,
      queryEntries: [],
      queryJsonText: "",
      rebuiltQuery: "",
      rebuiltUrl: "",
    };
  }

  if (config.inputMode === "component") {
    return {
      primaryTitle: "解码结果",
      primaryDescription:
        "当前按参数值规则解码，适合处理 redirect_uri、token 片段或单个 query value。",
      primaryResult: safeDecodeUri(
        config.input,
        "component",
        config.plusAsSpace,
      ),
      urlParts: null,
      queryEntries: [],
      queryJsonText: "",
      rebuiltQuery: "",
      rebuiltUrl: "",
    };
  }

  const queryEntries = parseQueryStringEntries(
    config.input,
    config.plusAsSpace,
  );
  const primaryResult = decodeQueryEntriesToText(queryEntries);
  const rebuiltQuery = encodeQueryEntries(queryEntries);

  return {
    primaryTitle: "解码结果",
    primaryDescription:
      "当前按 Query 参数逐项解码，便于直接查看每个 key / value 的可读内容。",
    primaryResult,
    urlParts: null,
    queryEntries,
    queryJsonText: createQueryJson(queryEntries),
    rebuiltQuery,
    rebuiltUrl: "",
  };
}

function executeParse(config: UrlToolConfig) {
  if (config.inputMode === "component") {
    throw new Error("“参数值”模式仅支持编码或解码，不支持结构解析。");
  }

  if (config.inputMode === "full-url") {
    const url = parseAbsoluteUrl(config.input);
    const queryEntries = parseQueryStringEntries(
      url.search.slice(1),
      config.plusAsSpace,
    );
    const rebuiltQuery = encodeQueryEntries(queryEntries);
    const rebuiltUrl =
      `${url.origin}${url.pathname}` +
      (rebuiltQuery ? `?${rebuiltQuery}` : "") +
      `${url.hash}`;

    return {
      primaryTitle: "标准化 URL",
      primaryDescription:
        "当前按完整 URL 解析后输出标准化链接，并额外展示 URL 结构与 Query 参数。",
      primaryResult: url.href,
      urlParts: createUrlParts(url),
      queryEntries,
      queryJsonText: createQueryJson(queryEntries),
      rebuiltQuery,
      rebuiltUrl,
    };
  }

  const queryEntries = parseQueryStringEntries(
    config.input,
    config.plusAsSpace,
  );
  const rebuiltQuery = encodeQueryEntries(queryEntries);

  return {
    primaryTitle: "Query 解析结果",
    primaryDescription:
      "当前已将 Query String 拆解为参数列表，并保留重复 key、空值和原始顺序。",
    primaryResult: decodeQueryEntriesToText(queryEntries),
    urlParts: null,
    queryEntries,
    queryJsonText: createQueryJson(queryEntries),
    rebuiltQuery,
    rebuiltUrl: "",
  };
}

export function getAllowedOperationsByInputMode(inputMode: UrlToolInputMode) {
  return [...ALLOWED_OPERATIONS_BY_MODE[inputMode]];
}

export function getDetectedInputTypeLabel(inputType: UrlToolDetectedInputType) {
  switch (inputType) {
    case "empty":
      return "空输入";
    case "full-url":
      return "完整 URL";
    case "query-string":
      return "Query String";
    case "component":
      return "参数值";
  }
}

export function getOperationLabel(operation: UrlToolOperation) {
  return (
    URL_OPERATION_OPTIONS.find((option) => option.value === operation)?.label ??
    operation
  );
}

export async function executeUrlTool(
  config: UrlToolConfig,
): Promise<UrlToolResult> {
  const detectedInputType = detectInputType(config.input);

  const operationResult =
    config.operation === "encode"
      ? executeEncode(config)
      : config.operation === "decode"
        ? executeDecode(config)
        : executeParse(config);

  const warnings = buildWarnings(
    config,
    detectedInputType,
    operationResult.queryEntries,
    operationResult.primaryResult,
  );

  return {
    generatedAt: Date.now(),
    summary: createSummary(
      config,
      detectedInputType,
      operationResult.queryEntries,
    ),
    detectedInputType,
    operation: config.operation,
    inputMode: config.inputMode,
    primaryTitle: operationResult.primaryTitle,
    primaryDescription: operationResult.primaryDescription,
    primaryResult: operationResult.primaryResult,
    warnings,
    urlParts: operationResult.urlParts,
    queryEntries: operationResult.queryEntries,
    queryJsonText: operationResult.queryJsonText,
    rebuiltQuery: operationResult.rebuiltQuery,
    rebuiltUrl: operationResult.rebuiltUrl,
    outputs: [
      createOutput(
        "primary-result",
        operationResult.primaryTitle,
        operationResult.primaryDescription,
        operationResult.primaryResult,
      ),
      createOutput(
        "query-json",
        "Query JSON",
        "将当前 Query 参数整理为 JSON 结构；重复 key 会保留为数组。",
        operationResult.queryJsonText,
      ),
      createOutput(
        "rebuilt-query",
        "重组后的 Query String",
        "基于当前解析结果重新编码并拼接得到的 Query String。",
        operationResult.rebuiltQuery,
      ),
      createOutput(
        "rebuilt-url",
        "重组后的完整 URL",
        "在完整 URL 解析模式下，基于当前 Query 参数重建得到的链接。",
        operationResult.rebuiltUrl,
      ),
    ].filter((item) => item.value),
  };
}

export async function copyToClipboard(value: string) {
  await navigator.clipboard.writeText(value);
}
