import {
  createHMAC,
  createMD5,
  createSHA1,
  createSHA256,
  createSHA384,
  createSHA512,
  type IHasher,
} from "hash-wasm";

import type {
  GeneratorAlgorithm,
  HashAlgorithm,
  HashCompareStatus,
  HashEncoding,
  HashGenerationResult,
  HashGeneratorConfig,
  HashInputType,
  HashMode,
  HashOutputItem,
  HmacAlgorithm,
} from "./type";

type Option<T extends string> = {
  label: string;
  value: T;
  description?: string;
  compatibility?: boolean;
};

type IncrementalHasherFactory = () => Promise<IHasher>;

const HASHER_FACTORIES: Record<HashAlgorithm, IncrementalHasherFactory> = {
  md5: createMD5 as IncrementalHasherFactory,
  "sha-1": createSHA1 as IncrementalHasherFactory,
  "sha-256": createSHA256 as IncrementalHasherFactory,
  "sha-384": createSHA384 as IncrementalHasherFactory,
  "sha-512": createSHA512 as IncrementalHasherFactory,
};

const HMAC_BASE_ALGORITHM_MAP: Record<HmacAlgorithm, HashAlgorithm> = {
  "hmac-md5": "md5",
  "hmac-sha-1": "sha-1",
  "hmac-sha-256": "sha-256",
  "hmac-sha-384": "sha-384",
  "hmac-sha-512": "sha-512",
};

const BASE64_CHUNK_SIZE = 32768;
const FILE_CHUNK_SIZE = 4 * 1024 * 1024;

export const MAX_FILE_SIZE_BYTES = 512 * 1024 * 1024;

export const HASH_MODE_OPTIONS: Array<Option<HashMode>> = [
  {
    label: "Hash",
    value: "hash",
    description: "直接对输入内容生成摘要，不需要额外 Secret。",
  },
  {
    label: "HMAC",
    value: "hmac",
    description: "基于 Secret 和摘要算法生成消息认证码，适合签名与验签。",
  },
];

export const HASH_INPUT_TYPE_OPTIONS: Array<Option<HashInputType>> = [
  {
    label: "文本",
    value: "text",
    description: "适合请求签名、JSON 片段、配置文本等内容。",
  },
  {
    label: "单文件",
    value: "file",
    description: "适合安装包、图片、压缩包或构建产物校验。",
  },
];

export const HASH_ALGORITHM_OPTIONS: Array<Option<HashAlgorithm>> = [
  {
    label: "SHA-256",
    value: "sha-256",
    description: "通用性最好，适合大多数现代校验场景。",
  },
  {
    label: "SHA-384",
    value: "sha-384",
    description: "输出更长，适合需要更高摘要强度的场景。",
  },
  {
    label: "SHA-512",
    value: "sha-512",
    description: "输出最长，适合偏保守的校验策略。",
  },
  {
    label: "MD5",
    value: "md5",
    description: "仅推荐用于旧系统兼容或常见文件校验。",
    compatibility: true,
  },
  {
    label: "SHA-1",
    value: "sha-1",
    description: "仅推荐用于旧系统兼容，不建议新安全场景继续使用。",
    compatibility: true,
  },
];

export const HMAC_ALGORITHM_OPTIONS: Array<Option<HmacAlgorithm>> = [
  {
    label: "HMAC-SHA256",
    value: "hmac-sha-256",
    description: "现代场景最常见的 HMAC 算法，适合 Webhook 与接口签名。",
  },
  {
    label: "HMAC-SHA384",
    value: "hmac-sha-384",
    description: "摘要长度更长，适合对接指定算法的系统。",
  },
  {
    label: "HMAC-SHA512",
    value: "hmac-sha-512",
    description: "输出更长，适合偏保守的签名策略。",
  },
  {
    label: "HMAC-MD5",
    value: "hmac-md5",
    description: "仅推荐用于旧系统兼容场景。",
    compatibility: true,
  },
  {
    label: "HMAC-SHA1",
    value: "hmac-sha-1",
    description: "仅推荐用于旧系统兼容或遗留验签流程。",
    compatibility: true,
  },
];

export const HASH_ENCODING_OPTIONS: Array<Option<HashEncoding>> = [
  { label: "Hex", value: "hex" },
  { label: "Base64", value: "base64" },
  { label: "Base64URL", value: "base64url" },
];

const DEFAULT_ALGORITHMS_BY_MODE: Record<HashMode, GeneratorAlgorithm[]> = {
  hash: ["sha-256"],
  hmac: ["hmac-sha-256"],
};

export const DEFAULT_HASH_GENERATOR_CONFIG: HashGeneratorConfig = {
  mode: "hash",
  inputType: "text",
  text: "",
  algorithms: [...DEFAULT_ALGORITHMS_BY_MODE.hash],
  encoding: "hex",
  expectedHash: "",
  secret: "",
};

function toUint8Array(buffer: ArrayBuffer) {
  return new Uint8Array(buffer);
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";

  for (let index = 0; index < bytes.length; index += BASE64_CHUNK_SIZE) {
    const chunk = bytes.subarray(index, index + BASE64_CHUNK_SIZE);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
}

function base64ToBase64Url(value: string) {
  return value.replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/g, "");
}

function createTimestampSlug(timestamp: number) {
  return new Date(timestamp).toISOString().replaceAll(":", "-");
}

function createOutputFilename(
  inputType: HashInputType,
  algorithm: GeneratorAlgorithm,
  timestamp: number,
) {
  return `hash-generator-${inputType}-${algorithm}-${createTimestampSlug(timestamp)}.txt`;
}

function normalizeExpectedHash(expectedHash: string, encoding: HashEncoding) {
  const trimmed = expectedHash.trim();

  if (!trimmed) {
    return "";
  }

  return encoding === "hex" ? trimmed.toLowerCase() : trimmed;
}

function getCompareStatus(
  value: string,
  expectedHash: string,
  encoding: HashEncoding,
): HashCompareStatus {
  const normalizedExpectedHash = normalizeExpectedHash(expectedHash, encoding);

  if (!normalizedExpectedHash) {
    return "idle";
  }

  return value === normalizedExpectedHash ? "match" : "mismatch";
}

function createHashOutput(
  input: Omit<HashOutputItem, "filename" | "mimeType"> & {
    inputType: HashInputType;
    timestamp: number;
  },
): HashOutputItem {
  return {
    ...input,
    filename: createOutputFilename(
      input.inputType,
      input.algorithm,
      input.timestamp,
    ),
    mimeType: "text/plain",
  };
}

function createSummary(config: HashGeneratorConfig, bytes: number) {
  const algorithms = config.algorithms.map((algorithm) =>
    getAlgorithmLabel(algorithm),
  );
  const source =
    config.inputType === "text"
      ? `文本输入，${config.text.length} 个字符 / ${bytes} bytes`
      : `文件输入，${formatFileSize(bytes)}`;
  const modeSummary =
    config.mode === "hmac"
      ? `模式 HMAC，Secret ${config.secret.length} 个字符`
      : "模式 Hash";

  return `${source}，${modeSummary}，输出 ${getEncodingLabel(config.encoding)}，算法 ${algorithms.join("、")}`;
}

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join(
    "",
  );
}

function encodeDigestBytes(bytes: Uint8Array, encoding: HashEncoding) {
  if (encoding === "hex") {
    return bytesToHex(bytes);
  }

  const base64 = bytesToBase64(bytes);

  return encoding === "base64url" ? base64ToBase64Url(base64) : base64;
}

async function createHasher(algorithm: HashAlgorithm) {
  const hasher = await HASHER_FACTORIES[algorithm]();

  hasher.init();

  return hasher;
}

async function createHmacHasher(algorithm: HmacAlgorithm, secret: string) {
  const secretBytes = new TextEncoder().encode(secret);
  const hasher = await createHMAC(
    HASHER_FACTORIES[HMAC_BASE_ALGORITHM_MAP[algorithm]](),
    secretBytes,
  );

  hasher.init();

  return hasher;
}

async function hashText(text: string, algorithm: HashAlgorithm) {
  const hasher = await createHasher(algorithm);
  const encodedText = new TextEncoder().encode(text);

  hasher.update(encodedText);

  return {
    digestBytes: hasher.digest("binary"),
    bytes: encodedText.length,
  };
}

async function hashFile(file: File, algorithm: HashAlgorithm) {
  const hasher = await createHasher(algorithm);

  for (let offset = 0; offset < file.size; offset += FILE_CHUNK_SIZE) {
    const chunk = file.slice(offset, offset + FILE_CHUNK_SIZE);
    const buffer = await chunk.arrayBuffer();

    hasher.update(toUint8Array(buffer));
  }

  return hasher.digest("binary");
}

async function hmacText(
  text: string,
  algorithm: HmacAlgorithm,
  secret: string,
) {
  const hasher = await createHmacHasher(algorithm, secret);
  const encodedText = new TextEncoder().encode(text);

  hasher.update(encodedText);

  return {
    digestBytes: hasher.digest("binary"),
    bytes: encodedText.length,
  };
}

async function hmacFile(file: File, algorithm: HmacAlgorithm, secret: string) {
  const hasher = await createHmacHasher(algorithm, secret);

  for (let offset = 0; offset < file.size; offset += FILE_CHUNK_SIZE) {
    const chunk = file.slice(offset, offset + FILE_CHUNK_SIZE);
    const buffer = await chunk.arrayBuffer();

    hasher.update(toUint8Array(buffer));
  }

  return hasher.digest("binary");
}

export function getDefaultAlgorithmsByMode(
  mode: HashMode,
): GeneratorAlgorithm[] {
  return [...DEFAULT_ALGORITHMS_BY_MODE[mode]];
}

export function getAlgorithmLabel(algorithm: GeneratorAlgorithm) {
  return (
    HASH_ALGORITHM_OPTIONS.find((option) => option.value === algorithm)
      ?.label ??
    HMAC_ALGORITHM_OPTIONS.find((option) => option.value === algorithm)
      ?.label ??
    algorithm
  );
}

export function getEncodingLabel(encoding: HashEncoding) {
  return (
    HASH_ENCODING_OPTIONS.find((option) => option.value === encoding)?.label ??
    encoding
  );
}

export function getModeLabel(mode: HashMode) {
  return (
    HASH_MODE_OPTIONS.find((option) => option.value === mode)?.label ?? mode
  );
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(2)} KB`;
  }

  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function downloadTextFile(
  filename: string,
  content: string,
  mimeType: string,
) {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.click();

  URL.revokeObjectURL(objectUrl);
}

export function createMaskedComparisonTarget(expectedHash: string) {
  if (!expectedHash.trim()) {
    return "";
  }

  return expectedHash.trim();
}

function validateHashConfig(config: HashGeneratorConfig) {
  if (config.algorithms.length === 0) {
    throw new Error("请至少选择一种算法。");
  }

  if (config.mode === "hmac" && config.secret.length === 0) {
    throw new Error("HMAC 模式下请先输入 Secret。");
  }

  if (config.inputType === "file") {
    if (!config.file) {
      throw new Error("请先选择一个文件。");
    }

    if (config.file.size > MAX_FILE_SIZE_BYTES) {
      throw new Error(
        `文件大小超出限制，当前仅支持不超过 ${formatFileSize(MAX_FILE_SIZE_BYTES)} 的单文件。`,
      );
    }
  }
}

export async function generateHashResult(
  config: HashGeneratorConfig,
): Promise<HashGenerationResult> {
  validateHashConfig(config);

  const timestamp = Date.now();
  const algorithms = Array.from(new Set(config.algorithms));

  if (config.inputType === "text") {
    const bytes = new TextEncoder().encode(config.text).length;
    const outputs = await Promise.all(
      algorithms.map(async (algorithm) => {
        const { digestBytes } =
          config.mode === "hmac"
            ? await hmacText(
                config.text,
                algorithm as HmacAlgorithm,
                config.secret,
              )
            : await hashText(config.text, algorithm as HashAlgorithm);
        const value = encodeDigestBytes(digestBytes, config.encoding);

        return createHashOutput({
          id: algorithm,
          algorithm,
          title: getAlgorithmLabel(algorithm),
          description:
            config.mode === "hmac"
              ? `文本内容按 ${getAlgorithmLabel(algorithm)} 和当前 Secret 生成的结果。`
              : `文本内容按 ${getAlgorithmLabel(algorithm)} 生成的哈希结果。`,
          value,
          compareStatus: getCompareStatus(
            value,
            config.expectedHash,
            config.encoding,
          ),
          compareTarget: createMaskedComparisonTarget(config.expectedHash),
          inputType: config.inputType,
          timestamp,
        });
      }),
    );

    return {
      outputs,
      generatedAt: timestamp,
      summary: createSummary({ ...config, algorithms }, bytes),
      mode: config.mode,
      inputType: config.inputType,
      encoding: config.encoding,
      textLength: config.text.length,
    };
  }

  const selectedFile = config.file;

  if (!selectedFile) {
    throw new Error("请先选择一个文件。");
  }

  const outputs = await Promise.all(
    algorithms.map(async (algorithm) => {
      const digestBytes =
        config.mode === "hmac"
          ? await hmacFile(
              selectedFile,
              algorithm as HmacAlgorithm,
              config.secret,
            )
          : await hashFile(selectedFile, algorithm as HashAlgorithm);
      const value = encodeDigestBytes(digestBytes, config.encoding);

      return createHashOutput({
        id: algorithm,
        algorithm,
        title: getAlgorithmLabel(algorithm),
        description:
          config.mode === "hmac"
            ? `文件内容按 ${getAlgorithmLabel(algorithm)} 和当前 Secret 生成的结果。`
            : `文件内容按 ${getAlgorithmLabel(algorithm)} 生成的哈希结果。`,
        value,
        compareStatus: getCompareStatus(
          value,
          config.expectedHash,
          config.encoding,
        ),
        compareTarget: createMaskedComparisonTarget(config.expectedHash),
        inputType: config.inputType,
        timestamp,
      });
    }),
  );

  return {
    outputs,
    generatedAt: timestamp,
    summary: createSummary(
      { ...config, algorithms, file: selectedFile },
      selectedFile.size,
    ),
    mode: config.mode,
    inputType: config.inputType,
    encoding: config.encoding,
    file: {
      name: selectedFile.name,
      size: selectedFile.size,
      type: selectedFile.type,
      lastModified: selectedFile.lastModified,
    },
  };
}
