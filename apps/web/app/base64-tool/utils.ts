import type {
  Base64FileMetadata,
  Base64TextDecoding,
  Base64ToolConfig,
  Base64ToolInputMode,
  Base64ToolOutputItem,
  Base64ToolOutputMode,
  Base64ToolResult,
  BytePreviewRow,
  DataUrlMetadata,
} from "./type";

type Option<T extends string> = {
  label: string;
  value: T;
  description: string;
};

type ParsedByteSource = {
  bytes: Uint8Array;
  warnings: string[];
  file: Base64FileMetadata | null;
  dataUrl: DataUrlMetadata | null;
  sourceMimeType: string;
};

type RenderedOutput = {
  id: string;
  title: string;
  description: string;
  value: string;
};

const BASE64_CHUNK_SIZE = 32768;
const BYTE_PREVIEW_LIMIT = 96;
const BYTE_PREVIEW_ROW_SIZE = 16;
const EMPTY_TEXT_PREVIEW = "当前字节内容不适合按所选字符集展示为文本。";

export const MAX_FILE_SIZE_BYTES = 16 * 1024 * 1024;

export const BASE64_TOOL_INPUT_MODE_OPTIONS: Array<
  Option<Base64ToolInputMode>
> = [
  {
    label: "文本",
    value: "text",
    description:
      "按 UTF-8 文本转成字节后再输出 Base64、Base64URL、Hex 或 Data URL。",
  },
  {
    label: "Base64",
    value: "base64",
    description: "适合处理标准 Base64 字符串，支持忽略空白和自动补齐补位。",
  },
  {
    label: "Base64URL",
    value: "base64url",
    description:
      "适合 JWT、URL 参数和文件名场景，会把 `-`、`_` 还原为标准 Base64。",
  },
  {
    label: "JWT 片段",
    value: "jwt-segment",
    description:
      "按 Base64URL 片段处理，适合单独检查 JWT 的 header、payload 或 signature。",
  },
  {
    label: "Data URL",
    value: "data-url",
    description:
      "支持拆解 `data:image/png;base64,...` 这类输入，并继续做字节转换。",
  },
  {
    label: "文件",
    value: "file",
    description:
      "读取单文件原始字节并输出 Base64、Base64URL、Hex 或 Data URL，适合资源内联和调试。",
  },
];

export const BASE64_TOOL_OUTPUT_MODE_OPTIONS: Array<
  Option<Base64ToolOutputMode>
> = [
  {
    label: "Base64",
    value: "base64",
    description: "输出标准 Base64 字符串，保留 `+`、`/` 和 `=` 补位。",
  },
  {
    label: "Base64URL",
    value: "base64url",
    description: "输出 URL 安全变体，适合 JWT、URL 参数和文件名。",
  },
  {
    label: "文本",
    value: "text",
    description:
      "按当前字符集尝试把字节解码为文本，适合 JSON、日志和配置内容。",
  },
  {
    label: "Hex",
    value: "hex",
    description: "输出十六进制字节串，适合人工比对和二进制排查。",
  },
  {
    label: "Data URL",
    value: "data-url",
    description:
      "输出标准 `data:*;base64,...` 形式，适合图片预览和前端资源内联。",
  },
];

export const BASE64_TEXT_DECODING_OPTIONS: Array<Option<Base64TextDecoding>> = [
  {
    label: "UTF-8",
    value: "utf-8",
    description: "默认字符集，最适合 JSON、接口文本和现代 Web 内容。",
  },
  {
    label: "UTF-16LE",
    value: "utf-16le",
    description: "适合部分 Windows 或二进制协议中的 UTF-16 小端文本。",
  },
  {
    label: "Windows-1252",
    value: "windows-1252",
    description: "适合部分旧网页和欧洲地区遗留文本。",
  },
  {
    label: "GBK",
    value: "gbk",
    description: "适合常见中文遗留内容或历史接口文本排查。",
  },
  {
    label: "Shift_JIS",
    value: "shift_jis",
    description: "适合部分日文旧系统文本排查。",
  },
];

export const DEFAULT_BASE64_TOOL_CONFIG: Base64ToolConfig = {
  input: "",
  inputMode: "text",
  outputMode: "base64",
  textDecoding: "utf-8",
  dataUrlMimeType: "text/plain",
  ignoreWhitespace: true,
  autoPad: true,
  keepBase64UrlPadding: false,
  lineByLine: false,
};

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";

  for (let index = 0; index < bytes.length; index += BASE64_CHUNK_SIZE) {
    const chunk = bytes.subarray(index, index + BASE64_CHUNK_SIZE);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
}

function base64ToBytes(value: string) {
  const binary = atob(value);

  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join(
    "",
  );
}

function base64ToBase64Url(value: string, keepPadding: boolean) {
  const normalized = value.replaceAll("+", "-").replaceAll("/", "_");

  return keepPadding ? normalized : normalized.replace(/=+$/g, "");
}

function normalizeBase64Input(
  value: string,
  inputMode: "base64" | "base64url" | "jwt-segment",
  config: Pick<Base64ToolConfig, "ignoreWhitespace" | "autoPad">,
) {
  const trimmed = config.ignoreWhitespace
    ? value.replace(/\s+/g, "")
    : value.trim();

  if (!trimmed) {
    throw new Error("请输入需要处理的文本、Base64、Data URL 或文件内容。");
  }

  const normalized =
    inputMode === "base64"
      ? trimmed
      : trimmed.replaceAll("-", "+").replaceAll("_", "/");
  const withoutPadding = normalized.replace(/=+$/g, "");
  const padded = config.autoPad
    ? withoutPadding.padEnd(Math.ceil(withoutPadding.length / 4) * 4, "=")
    : normalized;

  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(padded)) {
    throw new Error(
      inputMode === "base64"
        ? "Base64 输入不合法，请检查是否存在非法字符。"
        : "Base64URL 输入不合法，请检查是否误用了 `+`、`/` 或其他非法字符。",
    );
  }

  if (padded.length % 4 !== 0) {
    throw new Error(
      inputMode === "base64"
        ? "Base64 长度不合法，建议开启自动补齐补位后重试。"
        : "Base64URL 长度不合法，建议开启自动补齐补位后重试。",
    );
  }

  return padded;
}

function decodeText(bytes: Uint8Array, encoding: Base64TextDecoding) {
  try {
    return new TextDecoder(encoding, { fatal: true }).decode(bytes);
  } catch {
    throw new Error(
      `当前字节内容无法按 ${getTextDecodingLabel(encoding)} 正常解码，请切换字符集或改看 Hex 视图。`,
    );
  }
}

function tryDecodeText(bytes: Uint8Array, encoding: Base64TextDecoding) {
  try {
    return {
      ok: true as const,
      value: new TextDecoder(encoding, { fatal: true }).decode(bytes),
    };
  } catch {
    return {
      ok: false as const,
      value: "",
    };
  }
}

function parseDataUrl(
  input: string,
  config: Pick<Base64ToolConfig, "autoPad">,
) {
  const trimmed = input.trim();

  if (!trimmed) {
    throw new Error("请输入 Data URL 内容。");
  }

  const matched = /^data:([^,]*),([\s\S]*)$/.exec(trimmed);

  if (!matched) {
    throw new Error(
      "Data URL 结构不合法，请检查是否包含 `data:` 头部以及逗号分隔符。",
    );
  }

  const headerValue = matched[1];
  const payload = matched[2];
  const header = `data:${headerValue}`;
  const segments = headerValue.split(";").filter(Boolean);
  const isBase64 = segments.includes("base64");
  const mimeType =
    segments[0] && segments[0] !== "base64" ? segments[0] : "text/plain";

  if (isBase64) {
    const normalized = normalizeBase64Input(payload, "base64", {
      ignoreWhitespace: true,
      autoPad: config.autoPad,
    });

    return {
      bytes: base64ToBytes(normalized),
      dataUrl: {
        header,
        mimeType,
        isBase64: true,
        payloadLength: payload.length,
      } satisfies DataUrlMetadata,
      sourceMimeType: mimeType,
      warnings: [] as string[],
    };
  }

  let textPayload = payload;

  try {
    textPayload = decodeURIComponent(payload);
  } catch {
    throw new Error(
      "当前 Data URL 不是合法的百分号编码文本，请检查逗号后的内容是否完整。",
    );
  }

  return {
    bytes: new TextEncoder().encode(textPayload),
    dataUrl: {
      header,
      mimeType,
      isBase64: false,
      payloadLength: payload.length,
    } satisfies DataUrlMetadata,
    sourceMimeType: mimeType,
    warnings: [
      "当前输入是非 Base64 的 Data URL，工具已按文本负载解码为 UTF-8 字节。",
    ],
  };
}

function getBytesFromInput(
  config: Base64ToolConfig,
  fileState?: {
    file: File | null;
    bytes: Uint8Array | null;
  },
): ParsedByteSource {
  if (config.inputMode === "file") {
    if (!fileState?.file || !fileState.bytes) {
      throw new Error("请先选择一个文件后再查看结果。");
    }

    return {
      bytes: fileState.bytes,
      warnings: [],
      file: {
        name: fileState.file.name,
        size: fileState.file.size,
        type: fileState.file.type,
        lastModified: fileState.file.lastModified,
      },
      dataUrl: null,
      sourceMimeType: fileState.file.type || "application/octet-stream",
    };
  }

  if (!config.input.trim()) {
    throw new Error("请输入需要处理的文本、Base64、Data URL 或文件内容。");
  }

  if (config.inputMode === "text") {
    return {
      bytes: new TextEncoder().encode(config.input),
      warnings: [],
      file: null,
      dataUrl: null,
      sourceMimeType: config.dataUrlMimeType || "text/plain",
    };
  }

  if (config.inputMode === "data-url") {
    const parsed = parseDataUrl(config.input, config);

    return {
      bytes: parsed.bytes,
      warnings: parsed.warnings,
      file: null,
      dataUrl: parsed.dataUrl,
      sourceMimeType: parsed.sourceMimeType,
    };
  }

  const normalizedBase64 = normalizeBase64Input(
    config.input,
    config.inputMode,
    config,
  );
  const warnings =
    config.inputMode === "jwt-segment"
      ? [
          "JWT 片段模式按 Base64URL 规则处理，适合单独排查 header、payload 或 signature 段。",
        ]
      : [];

  try {
    return {
      bytes: base64ToBytes(normalizedBase64),
      warnings,
      file: null,
      dataUrl: null,
      sourceMimeType: config.dataUrlMimeType || "application/octet-stream",
    };
  } catch {
    throw new Error(
      config.inputMode === "base64"
        ? "Base64 解码失败，请检查字符、补位和空白处理选项。"
        : "Base64URL 解码失败，请检查字符集是否正确，或尝试开启自动补齐补位。",
    );
  }
}

function detectBinaryKind(bytes: Uint8Array, decodedText: string) {
  if (bytes.length === 0) {
    return "空内容";
  }

  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return "PNG 图片";
  }

  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "JPEG 图片";
  }

  if (
    bytes[0] === 0x47 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x38
  ) {
    return "GIF 图片";
  }

  if (
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46
  ) {
    return "PDF 文档";
  }

  if (bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03) {
    return "ZIP 或 Office 文档";
  }

  if (bytes[0] === 0x1f && bytes[1] === 0x8b) {
    return "GZIP 压缩内容";
  }

  if (decodedText) {
    const trimmed = decodedText.trim();

    if (
      (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
      (trimmed.startsWith("[") && trimmed.endsWith("]"))
    ) {
      return "JSON 文本";
    }

    return "可读文本";
  }

  return "二进制内容";
}

function createBytePreviewRows(bytes: Uint8Array): BytePreviewRow[] {
  const rows: BytePreviewRow[] = [];
  const previewBytes = bytes.subarray(0, BYTE_PREVIEW_LIMIT);

  for (
    let index = 0;
    index < previewBytes.length;
    index += BYTE_PREVIEW_ROW_SIZE
  ) {
    const rowBytes = previewBytes.subarray(
      index,
      index + BYTE_PREVIEW_ROW_SIZE,
    );
    const hex = Array.from(rowBytes, (value) =>
      value.toString(16).padStart(2, "0"),
    ).join(" ");
    const ascii = Array.from(rowBytes, (value) =>
      value >= 32 && value <= 126 ? String.fromCharCode(value) : ".",
    ).join("");

    rows.push({
      offset: index.toString(16).padStart(4, "0"),
      hex,
      ascii,
    });
  }

  return rows;
}

function createDataUrl(bytes: Uint8Array, mimeType: string) {
  return `data:${mimeType || "application/octet-stream"};base64,${bytesToBase64(bytes)}`;
}

function createTimestampSlug(timestamp: number) {
  return new Date(timestamp).toISOString().replaceAll(":", "-");
}

function createOutputFilename(id: string, timestamp: number) {
  return `base64-tool-${id}-${createTimestampSlug(timestamp)}.txt`;
}

function renderOutputByMode(
  outputMode: Base64ToolOutputMode,
  bytes: Uint8Array,
  config: Pick<
    Base64ToolConfig,
    "textDecoding" | "dataUrlMimeType" | "keepBase64UrlPadding"
  >,
  sourceMimeType: string,
): RenderedOutput {
  if (outputMode === "base64") {
    return {
      id: "output-base64",
      title: "标准 Base64",
      description: "保留 `+`、`/` 和 `=` 补位，适合配置文件和传统接口字段。",
      value: bytesToBase64(bytes),
    };
  }

  if (outputMode === "base64url") {
    return {
      id: "output-base64url",
      title: "Base64URL",
      description:
        "URL 安全变体，适合 JWT、URL 参数和文件名。可按开关决定是否保留补位。",
      value: base64ToBase64Url(
        bytesToBase64(bytes),
        config.keepBase64UrlPadding,
      ),
    };
  }

  if (outputMode === "hex") {
    return {
      id: "output-hex",
      title: "Hex",
      description: "十六进制字节串，适合比对原始字节和排查乱码问题。",
      value: bytesToHex(bytes),
    };
  }

  if (outputMode === "data-url") {
    return {
      id: "output-data-url",
      title: "Data URL",
      description:
        "以 `data:*;base64,...` 形式输出，可直接用于前端资源内联或预览。",
      value: createDataUrl(bytes, sourceMimeType || config.dataUrlMimeType),
    };
  }

  return {
    id: "output-text",
    title: "文本结果",
    description:
      "按当前字符集把字节解码为文本，适合查看 JSON、日志、配置或 JWT 片段。",
    value: decodeText(bytes, config.textDecoding),
  };
}

function createOutputItem(rendered: RenderedOutput, timestamp: number) {
  return {
    ...rendered,
    filename: createOutputFilename(
      rendered.id.replace("output-", ""),
      timestamp,
    ),
    mimeType: "text/plain",
  } satisfies Base64ToolOutputItem;
}

function renderAllOutputs(
  bytes: Uint8Array,
  config: Base64ToolConfig,
  sourceMimeType: string,
) {
  const warnings: string[] = [];
  const outputs: Base64ToolOutputItem[] = [];
  const timestamp = Date.now();
  const primaryOutputId = `output-${config.outputMode}`;

  const outputModes: Base64ToolOutputMode[] = [
    "base64",
    "base64url",
    "text",
    "hex",
    "data-url",
  ];

  outputModes.forEach((outputMode) => {
    try {
      outputs.push(
        createOutputItem(
          renderOutputByMode(outputMode, bytes, config, sourceMimeType),
          timestamp,
        ),
      );
    } catch (error) {
      if (outputMode === config.outputMode) {
        throw error;
      }

      warnings.push(
        error instanceof Error
          ? error.message
          : "部分附加输出生成失败，请调整字符集后重试。",
      );
    }
  });

  return {
    outputs,
    primaryOutputId,
    warnings,
  };
}

function executeLineByLine(
  config: Base64ToolConfig,
  fileState?: {
    file: File | null;
    bytes: Uint8Array | null;
  },
) {
  if (config.inputMode === "file" || config.inputMode === "data-url") {
    throw new Error(
      "逐行处理当前仅支持文本、Base64、Base64URL 与 JWT 片段模式。",
    );
  }

  const lines = config.input.split(/\r?\n/);
  const outputModes: Base64ToolOutputMode[] = [
    "base64",
    "base64url",
    "text",
    "hex",
    "data-url",
  ];
  const renderedByMode = new Map<Base64ToolOutputMode, string[]>();
  let totalBytes = 0;

  outputModes.forEach((mode) => {
    renderedByMode.set(mode, []);
  });

  lines.forEach((line, index) => {
    if (!line) {
      outputModes.forEach((mode) => {
        renderedByMode.get(mode)?.push("");
      });
      return;
    }

    const source = getBytesFromInput(
      {
        ...config,
        input: line,
        lineByLine: false,
      },
      fileState,
    );
    totalBytes += source.bytes.length;

    outputModes.forEach((mode) => {
      try {
        const rendered = renderOutputByMode(
          mode,
          source.bytes,
          config,
          source.sourceMimeType,
        );

        renderedByMode.get(mode)?.push(rendered.value);
      } catch (error) {
        throw new Error(
          error instanceof Error
            ? `第 ${index + 1} 行处理失败：${error.message}`
            : `第 ${index + 1} 行处理失败。`,
        );
      }
    });
  });

  const timestamp = Date.now();
  const outputs = outputModes.map((mode) =>
    createOutputItem(
      renderOutputByMode(
        mode,
        new Uint8Array(0),
        config,
        config.dataUrlMimeType || "text/plain",
      ),
      timestamp,
    ),
  );

  outputs.forEach((output, index) => {
    output.value = renderedByMode.get(outputModes[index])?.join("\n") ?? "";
  });

  const primaryOutputId = `output-${config.outputMode}`;

  return {
    generatedAt: timestamp,
    summary: `已按逐行模式处理 ${lines.length} 行输入，累计 ${totalBytes} bytes，结果仅保留在当前页面内存中`,
    inputMode: config.inputMode,
    outputMode: config.outputMode,
    primaryOutputId,
    outputs,
    warnings: ["当前结果来自逐行处理模式，字节预览仅针对单段模式提供。"],
    byteLength: totalBytes,
    lineCount: lines.length,
    containsPadding:
      outputs
        .find((item) => item.id === "output-base64")
        ?.value.includes("=") ?? false,
    canDecodeText: true,
    detectedBinaryKind: "逐行处理结果",
    normalizedBase64:
      outputs.find((item) => item.id === "output-base64")?.value ?? "",
    normalizedBase64Url:
      outputs.find((item) => item.id === "output-base64url")?.value ?? "",
    textPreview: outputs.find((item) => item.id === "output-text")?.value ?? "",
    hexPreview: outputs.find((item) => item.id === "output-hex")?.value ?? "",
    asciiPreview: "",
    bytePreviewRows: [],
    file: null,
    dataUrl: null,
  } satisfies Base64ToolResult;
}

export function generateBase64ToolResult(
  config: Base64ToolConfig,
  fileState?: {
    file: File | null;
    bytes: Uint8Array | null;
  },
) {
  if (config.lineByLine) {
    return executeLineByLine(config, fileState);
  }

  const source = getBytesFromInput(config, fileState);
  const renderedOutputs = renderAllOutputs(
    source.bytes,
    config,
    source.sourceMimeType || config.dataUrlMimeType,
  );
  const textPreviewAttempt = tryDecodeText(source.bytes, config.textDecoding);
  const normalizedBase64 = bytesToBase64(source.bytes);
  const normalizedBase64Url = base64ToBase64Url(
    normalizedBase64,
    config.keepBase64UrlPadding,
  );
  const hexPreview = bytesToHex(source.bytes);
  const bytePreviewRows = createBytePreviewRows(source.bytes);
  const asciiPreview = bytePreviewRows.map((row) => row.ascii).join(" ");
  const detectedBinaryKind = detectBinaryKind(
    source.bytes,
    textPreviewAttempt.ok ? textPreviewAttempt.value : "",
  );

  return {
    generatedAt: Date.now(),
    summary: `输入已转换为 ${source.bytes.length} bytes，当前主输出为 ${getOutputModeLabel(config.outputMode)}`,
    inputMode: config.inputMode,
    outputMode: config.outputMode,
    primaryOutputId: renderedOutputs.primaryOutputId,
    outputs: renderedOutputs.outputs,
    warnings: [
      ...source.warnings,
      ...renderedOutputs.warnings,
      !textPreviewAttempt.ok
        ? `当前字节无法按 ${getTextDecodingLabel(config.textDecoding)} 稳定解码为文本，建议改看 Hex 或切换字符集。`
        : "",
    ].filter(Boolean),
    byteLength: source.bytes.length,
    lineCount: 1,
    containsPadding: normalizedBase64.includes("="),
    canDecodeText: textPreviewAttempt.ok,
    detectedBinaryKind,
    normalizedBase64,
    normalizedBase64Url,
    textPreview: textPreviewAttempt.ok
      ? textPreviewAttempt.value
      : EMPTY_TEXT_PREVIEW,
    hexPreview,
    asciiPreview,
    bytePreviewRows,
    file: source.file,
    dataUrl: source.dataUrl,
  } satisfies Base64ToolResult;
}

export function getInputModeLabel(value: Base64ToolInputMode) {
  return (
    BASE64_TOOL_INPUT_MODE_OPTIONS.find((option) => option.value === value)
      ?.label ?? value
  );
}

export function getOutputModeLabel(value: Base64ToolOutputMode) {
  return (
    BASE64_TOOL_OUTPUT_MODE_OPTIONS.find((option) => option.value === value)
      ?.label ?? value
  );
}

export function getTextDecodingLabel(value: Base64TextDecoding) {
  return (
    BASE64_TEXT_DECODING_OPTIONS.find((option) => option.value === value)
      ?.label ?? value
  );
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export async function copyToClipboard(value: string) {
  await navigator.clipboard.writeText(value);
}

export function downloadTextFile(
  filename: string,
  content: string,
  mimeType = "text/plain",
) {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(objectUrl);
}

export async function readFileAsBytes(file: File) {
  const buffer = await file.arrayBuffer();

  return new Uint8Array(buffer);
}

export function createExampleInput(inputMode: Base64ToolInputMode) {
  if (inputMode === "text") {
    return 'Hello Base64\n{"name":"Lynote Toolkit","mode":"text"}';
  }

  if (inputMode === "base64") {
    return "SGVsbG8gQmFzZTY0";
  }

  if (inputMode === "base64url") {
    return "eyJuYW1lIjoiTHlub3RlIFRvb2xraXQiLCJtb2RlIjoiYmFzZTY0dXJsIn0";
  }

  if (inputMode === "jwt-segment") {
    return "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9";
  }

  if (inputMode === "data-url") {
    return "data:text/plain;base64,SGVsbG8gRGF0YSBVUkw=";
  }

  return "";
}
