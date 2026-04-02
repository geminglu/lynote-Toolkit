/**
 * Base64 工具支持的输入模式。
 */
export type Base64ToolInputMode =
  | "text"
  | "base64"
  | "base64url"
  | "data-url"
  | "file"
  | "jwt-segment";

/**
 * Base64 工具支持的输出模式。
 */
export type Base64ToolOutputMode =
  | "base64"
  | "base64url"
  | "text"
  | "hex"
  | "data-url";

/**
 * 文本预览时使用的字符集。
 */
export type Base64TextDecoding =
  | "utf-8"
  | "utf-16le"
  | "windows-1252"
  | "gbk"
  | "shift_jis";

/**
 * Base64 工具配置。
 */
export interface Base64ToolConfig {
  input: string;
  inputMode: Base64ToolInputMode;
  outputMode: Base64ToolOutputMode;
  textDecoding: Base64TextDecoding;
  dataUrlMimeType: string;
  ignoreWhitespace: boolean;
  autoPad: boolean;
  keepBase64UrlPadding: boolean;
  lineByLine: boolean;
}

/**
 * 文件输入的元信息。
 */
export interface Base64FileMetadata {
  name: string;
  size: number;
  type: string;
  lastModified: number;
}

/**
 * Data URL 的解析结果。
 */
export interface DataUrlMetadata {
  header: string;
  mimeType: string;
  isBase64: boolean;
  payloadLength: number;
}

/**
 * 字节预览中的单行数据。
 */
export interface BytePreviewRow {
  offset: string;
  hex: string;
  ascii: string;
}

/**
 * 单个可复制或下载的输出项。
 */
export interface Base64ToolOutputItem {
  id: string;
  title: string;
  description: string;
  value: string;
  filename: string;
  mimeType: string;
}

/**
 * Base64 工具的计算结果。
 */
export interface Base64ToolResult {
  generatedAt: number;
  summary: string;
  inputMode: Base64ToolInputMode;
  outputMode: Base64ToolOutputMode;
  primaryOutputId: string;
  outputs: Base64ToolOutputItem[];
  warnings: string[];
  byteLength: number;
  lineCount: number;
  containsPadding: boolean;
  canDecodeText: boolean;
  detectedBinaryKind: string;
  normalizedBase64: string;
  normalizedBase64Url: string;
  textPreview: string;
  hexPreview: string;
  asciiPreview: string;
  bytePreviewRows: BytePreviewRow[];
  file: Base64FileMetadata | null;
  dataUrl: DataUrlMetadata | null;
}
