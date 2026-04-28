export type JwtSupportedAlgorithm =
  | "HS256"
  | "HS384"
  | "HS512"
  | "RS256"
  | "RS384"
  | "RS512";

export type JwtVerificationKeyType = "secret" | "pem" | "jwk";

export type JwtTimeClaimName = "exp" | "nbf" | "iat";

export type JwtTimeClaimStatus =
  | "valid"
  | "expired"
  | "not-yet-valid"
  | "future"
  | "missing"
  | "invalid";

export type JwtVerificationStatus = "skipped" | "success" | "error" | "warning";

/**
 * JWT 调试工具配置
 */
export interface JwtDebuggerConfig {
  token: string;
  verificationEnabled: boolean;
  verificationKeyType: JwtVerificationKeyType;
  verificationKey: string;
  clockToleranceSeconds: number;
}

/**
 * 时间类 claim 的解析结果
 */
export interface JwtTimeClaimInfo {
  claim: JwtTimeClaimName;
  label: string;
  rawValue: unknown;
  numericValue: number | null;
  isoTime: string;
  status: JwtTimeClaimStatus;
  description: string;
}

/**
 * 签名验证结果
 */
export interface JwtVerificationResult {
  status: JwtVerificationStatus;
  title: string;
  message: string;
}

/**
 * 单个结果输出项
 */
export interface JwtOutputItem {
  id: string;
  title: string;
  description: string;
  value: string;
}

/**
 * JWT 调试结果
 */
export interface JwtDebuggerResult {
  generatedAt: number;
  summary: string;
  normalizedToken: string;
  tokenLength: number;
  algorithm: string;
  supportedAlgorithm: boolean;
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  headerText: string;
  payloadText: string;
  signature: string;
  signingInput: string;
  warnings: string[];
  claimInfos: JwtTimeClaimInfo[];
  verification: JwtVerificationResult;
  outputs: JwtOutputItem[];
}
