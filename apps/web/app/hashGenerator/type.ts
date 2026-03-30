export type HashInputType = "text" | "file";

export type HashAlgorithm = "md5" | "sha-1" | "sha-256" | "sha-384" | "sha-512";
export type HmacAlgorithm =
  | "hmac-md5"
  | "hmac-sha-1"
  | "hmac-sha-256"
  | "hmac-sha-384"
  | "hmac-sha-512";
export type GeneratorAlgorithm = HashAlgorithm | HmacAlgorithm;
export type HashMode = "hash" | "hmac";

export type HashEncoding = "hex" | "base64" | "base64url";

export type HashCompareStatus = "idle" | "match" | "mismatch";

export interface TextInputConfig {
  inputType: "text";
  text: string;
}

export interface FileInputConfig {
  inputType: "file";
  file: File | null;
}

type SharedHashConfig = {
  mode: HashMode;
  algorithms: GeneratorAlgorithm[];
  encoding: HashEncoding;
  expectedHash: string;
  secret: string;
};

export type HashGeneratorConfig =
  | (TextInputConfig & SharedHashConfig)
  | (FileInputConfig & SharedHashConfig);

export interface HashOutputItem {
  id: string;
  algorithm: GeneratorAlgorithm;
  title: string;
  description: string;
  value: string;
  compareStatus: HashCompareStatus;
  compareTarget: string;
  filename: string;
  mimeType: string;
}

export interface HashFileMetadata {
  name: string;
  size: number;
  type: string;
  lastModified: number;
}

export interface HashGenerationResult {
  outputs: HashOutputItem[];
  generatedAt: number;
  summary: string;
  mode: HashMode;
  inputType: HashInputType;
  encoding: HashEncoding;
  textLength?: number;
  file?: HashFileMetadata;
}
