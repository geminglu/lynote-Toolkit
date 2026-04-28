export type RsaToolMode = "encrypt" | "decrypt" | "sign" | "verify" | "inspect";

export type RsaKeyFormat = "pem" | "jwk";

export type RsaHashAlgorithm = "sha-1" | "sha-256" | "sha-384" | "sha-512";

export type RsaSignatureAlgorithm = "rsassa-pkcs1-v1_5" | "rsa-pss";

export type RsaBinaryEncoding = "hex" | "base64" | "base64url";

export type RsaKeyKind = "public" | "private";

/**
 * RSA 工具配置
 */
export interface RsaToolConfig {
  mode: RsaToolMode;
  keyFormat: RsaKeyFormat;
  keyText: string;
  encryptionHash: RsaHashAlgorithm;
  signatureAlgorithm: RsaSignatureAlgorithm;
  signatureHash: RsaHashAlgorithm;
  outputEncoding: RsaBinaryEncoding;
  ciphertextEncoding: RsaBinaryEncoding;
  signatureEncoding: RsaBinaryEncoding;
  plaintext: string;
  ciphertext: string;
  message: string;
  signature: string;
  pssSaltLength: number;
}

/**
 * 单个结果输出项
 */
export interface RsaOutputItem {
  id: string;
  title: string;
  description: string;
  value: string;
  filename: string;
  mimeType: string;
}

/**
 * 密钥检查结果摘要
 */
export interface RsaKeyInfo {
  format: RsaKeyFormat;
  kind: RsaKeyKind;
  modulusLength?: number;
  pemLabel?: string;
  usages: string[];
  algorithmLabel: string;
}

/**
 * RSA 操作结果
 */
export interface RsaToolResult {
  mode: RsaToolMode;
  generatedAt: number;
  summary: string;
  outputs: RsaOutputItem[];
  keyInfo: RsaKeyInfo | null;
  warnings: string[];
  verified?: boolean;
  maxPlaintextLength?: number;
  inputLength?: number;
}
