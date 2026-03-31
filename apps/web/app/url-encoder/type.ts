export type UrlToolInputMode = "full-url" | "component" | "query-string";

export type UrlToolOperation = "encode" | "decode" | "parse";

export type UrlToolDetectedInputType =
  | "empty"
  | "full-url"
  | "query-string"
  | "component";

/**
 * URL 工具配置
 */
export interface UrlToolConfig {
  input: string;
  inputMode: UrlToolInputMode;
  operation: UrlToolOperation;
  plusAsSpace: boolean;
}

/**
 * Query 参数条目
 */
export interface UrlQueryEntry {
  id: string;
  rawSegment: string;
  rawKey: string;
  rawValue: string;
  decodedKey: string;
  decodedValue: string;
  hasExplicitValue: boolean;
}

/**
 * 完整 URL 的拆解结果
 */
export interface UrlParts {
  href: string;
  origin: string;
  protocol: string;
  host: string;
  hostname: string;
  port: string;
  pathname: string;
  search: string;
  hash: string;
}

/**
 * 单个结果输出项
 */
export interface UrlToolOutputItem {
  id: string;
  title: string;
  description: string;
  value: string;
}

/**
 * URL 工具执行结果
 */
export interface UrlToolResult {
  generatedAt: number;
  summary: string;
  detectedInputType: UrlToolDetectedInputType;
  operation: UrlToolOperation;
  inputMode: UrlToolInputMode;
  primaryTitle: string;
  primaryDescription: string;
  primaryResult: string;
  warnings: string[];
  urlParts: UrlParts | null;
  queryEntries: UrlQueryEntry[];
  queryJsonText: string;
  rebuiltQuery: string;
  rebuiltUrl: string;
  outputs: UrlToolOutputItem[];
}
