export type KeyGeneratorType =
  | "api-key"
  | "jwt-secret"
  | "aes-256"
  | "hmac-sha256"
  | "rsa-key-pair";

export type ApiKeyEncoding = "plain" | "hex" | "base64" | "base64url";
export type SecretEncoding = "hex" | "base64" | "base64url" | "jwk";
export type RsaEncoding = "pem" | "jwk";
export type KeyGeneratorEncoding =
  | ApiKeyEncoding
  | SecretEncoding
  | RsaEncoding;

export type ApiKeyCharset =
  | "alphanumeric"
  | "url-safe"
  | "alphanumeric-symbols";

export interface ApiKeyConfig {
  type: "api-key";
  encoding: ApiKeyEncoding;
  length: number;
  charset: ApiKeyCharset;
}

export interface JwtSecretConfig {
  type: "jwt-secret";
  encoding: Exclude<SecretEncoding, "jwk">;
  bytes: number;
}

export interface AesKeyConfig {
  type: "aes-256";
  encoding: SecretEncoding;
}

export interface HmacKeyConfig {
  type: "hmac-sha256";
  encoding: SecretEncoding;
  bytes: number;
}

export interface RsaKeyPairConfig {
  type: "rsa-key-pair";
  encoding: RsaEncoding;
  modulusLength: 2048 | 3072 | 4096;
}

export type KeyGeneratorConfig =
  | ApiKeyConfig
  | JwtSecretConfig
  | AesKeyConfig
  | HmacKeyConfig
  | RsaKeyPairConfig;

export interface KeyOutputItem {
  id: string;
  title: string;
  description: string;
  value: string;
  sensitive: boolean;
  filename: string;
  mimeType: string;
}

export interface KeyGenerationResult {
  outputs: KeyOutputItem[];
  generatedAt: number;
  summary: string;
}
