import type {
  ApiKeyCharset,
  ApiKeyEncoding,
  KeyGenerationResult,
  KeyGeneratorConfig,
  KeyGeneratorType,
  KeyOutputItem,
  RsaEncoding,
  SecretEncoding,
} from "./type";

type Option<T extends string> = {
  label: string;
  value: T;
};

const API_KEY_CHARSETS: Record<ApiKeyCharset, string> = {
  alphanumeric:
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
  "url-safe":
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_",
  "alphanumeric-symbols":
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_-+=[]{}",
};

const BASE64_CHUNK_SIZE = 32768;

export const KEY_TYPE_OPTIONS: Array<Option<KeyGeneratorType>> = [
  { label: "API Key", value: "api-key" },
  { label: "JWT Secret", value: "jwt-secret" },
  { label: "AES-256 Key", value: "aes-256" },
  { label: "HMAC-SHA256 Secret", value: "hmac-sha256" },
  { label: "RSA Key Pair", value: "rsa-key-pair" },
];

export const API_KEY_ENCODING_OPTIONS: Array<Option<ApiKeyEncoding>> = [
  { label: "纯文本", value: "plain" },
  { label: "Hex", value: "hex" },
  { label: "Base64", value: "base64" },
  { label: "Base64URL", value: "base64url" },
];

export const SECRET_ENCODING_OPTIONS: Array<
  Option<Exclude<SecretEncoding, "jwk">>
> = [
  { label: "Hex", value: "hex" },
  { label: "Base64", value: "base64" },
  { label: "Base64URL", value: "base64url" },
];

export const EXPORTABLE_SECRET_ENCODING_OPTIONS: Array<Option<SecretEncoding>> =
  [
    { label: "Hex", value: "hex" },
    { label: "Base64", value: "base64" },
    { label: "Base64URL", value: "base64url" },
    { label: "JWK", value: "jwk" },
  ];

export const RSA_ENCODING_OPTIONS: Array<Option<RsaEncoding>> = [
  { label: "PEM", value: "pem" },
  { label: "JWK", value: "jwk" },
];

export const API_KEY_CHARSET_OPTIONS: Array<Option<ApiKeyCharset>> = [
  { label: "字母数字", value: "alphanumeric" },
  { label: "URL Safe", value: "url-safe" },
  { label: "字母数字 + 常见符号", value: "alphanumeric-symbols" },
];

export const DEFAULT_KEY_GENERATOR_CONFIG: KeyGeneratorConfig = {
  type: "api-key",
  encoding: "plain",
  length: 32,
  charset: "alphanumeric",
};

export function getDefaultConfigByType(
  type: KeyGeneratorType,
): KeyGeneratorConfig {
  switch (type) {
    case "api-key":
      return {
        type,
        encoding: "plain",
        length: 32,
        charset: "alphanumeric",
      };
    case "jwt-secret":
      return {
        type,
        encoding: "base64url",
        bytes: 64,
      };
    case "aes-256":
      return {
        type,
        encoding: "base64",
      };
    case "hmac-sha256":
      return {
        type,
        encoding: "base64",
        bytes: 32,
      };
    case "rsa-key-pair":
      return {
        type,
        encoding: "pem",
        modulusLength: 2048,
      };
  }
}

export function clampNumber(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function toUint8Array(buffer: ArrayBuffer) {
  return new Uint8Array(buffer);
}

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join(
    "",
  );
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

function encodeBytes(
  bytes: Uint8Array,
  encoding: Exclude<ApiKeyEncoding | SecretEncoding, "plain" | "jwk">,
) {
  if (encoding === "hex") {
    return bytesToHex(bytes);
  }

  const base64 = bytesToBase64(bytes);

  if (encoding === "base64url") {
    return base64ToBase64Url(base64);
  }

  return base64;
}

function generateRandomBytes(length: number) {
  return crypto.getRandomValues(new Uint8Array(length));
}

function generateRandomString(length: number, charset: ApiKeyCharset) {
  const availableCharacters = API_KEY_CHARSETS[charset];
  const randomValues = generateRandomBytes(length);

  return Array.from(
    randomValues,
    (value) => availableCharacters[value % availableCharacters.length],
  ).join("");
}

function formatPem(label: "PUBLIC KEY" | "PRIVATE KEY", buffer: ArrayBuffer) {
  const encoded = bytesToBase64(toUint8Array(buffer));
  const lines = encoded.match(/.{1,64}/g) ?? [];

  return `-----BEGIN ${label}-----\n${lines.join("\n")}\n-----END ${label}-----`;
}

function createTimestampSlug(timestamp: number) {
  return new Date(timestamp).toISOString().replaceAll(":", "-");
}

function createOutputFilename(
  type: KeyGeneratorType,
  timestamp: number,
  suffix: string,
) {
  return `key-generator-${type}-${suffix}-${createTimestampSlug(timestamp)}`;
}

function createOutput(
  input: Omit<KeyOutputItem, "filename"> & {
    type: KeyGeneratorType;
    timestamp: number;
    extension: string;
  },
): KeyOutputItem {
  return {
    id: input.id,
    title: input.title,
    description: input.description,
    value: input.value,
    sensitive: input.sensitive,
    mimeType: input.mimeType,
    filename: `${createOutputFilename(input.type, input.timestamp, input.id)}.${input.extension}`,
  };
}

function createJwkOutputValue(value: JsonWebKey) {
  return JSON.stringify(value, null, 2);
}

function getConfigSummary(config: KeyGeneratorConfig) {
  switch (config.type) {
    case "api-key":
      return `API Key，编码 ${getEncodingLabel(config.encoding)}，长度 ${config.length}`;
    case "jwt-secret":
      return `JWT Secret，编码 ${getEncodingLabel(config.encoding)}，随机字节 ${config.bytes}`;
    case "aes-256":
      return `AES-256，导出 ${getEncodingLabel(config.encoding)}`;
    case "hmac-sha256":
      return `HMAC-SHA256，导出 ${getEncodingLabel(config.encoding)}，密钥长度 ${config.bytes} bytes`;
    case "rsa-key-pair":
      return `RSA Key Pair，位数 ${config.modulusLength}，导出 ${getEncodingLabel(config.encoding)}`;
  }
}

export function getKeyTypeLabel(type: KeyGeneratorType) {
  return (
    KEY_TYPE_OPTIONS.find((option) => option.value === type)?.label ?? type
  );
}

export function getEncodingLabel(
  encoding: ApiKeyEncoding | SecretEncoding | RsaEncoding,
) {
  return (
    API_KEY_ENCODING_OPTIONS.find((option) => option.value === encoding)
      ?.label ??
    EXPORTABLE_SECRET_ENCODING_OPTIONS.find(
      (option) => option.value === encoding,
    )?.label ??
    RSA_ENCODING_OPTIONS.find((option) => option.value === encoding)?.label ??
    encoding
  );
}

export function getApiLengthLabel(encoding: ApiKeyEncoding) {
  return encoding === "plain" ? "长度" : "随机字节数";
}

export function getApiLengthDescription(encoding: ApiKeyEncoding) {
  return encoding === "plain"
    ? "纯文本模式下表示最终字符数。"
    : "编码模式下表示先生成多少随机字节，再按所选格式输出。";
}

export function getJwtBytesDescription() {
  return "建议至少使用 32 bytes，默认提供 64 bytes。";
}

export function getHmacBytesDescription() {
  return "用于生成 HMAC 原始密钥，最终输出格式取决于导出方式。";
}

export function createMaskedValue(value: string) {
  const lines = value.split("\n");

  if (lines.length > 1) {
    return "[内容已隐藏，点击“显示敏感内容”后查看完整结果]";
  }

  return "*".repeat(Math.min(Math.max(value.length, 12), 48));
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

async function exportSecretKey(
  key: CryptoKey,
  encoding: SecretEncoding,
): Promise<string> {
  if (encoding === "jwk") {
    return createJwkOutputValue(await crypto.subtle.exportKey("jwk", key));
  }

  const raw = await crypto.subtle.exportKey("raw", key);

  return encodeBytes(toUint8Array(raw), encoding);
}

async function generateApiKeyResult(
  config: Extract<KeyGeneratorConfig, { type: "api-key" }>,
): Promise<KeyGenerationResult> {
  const timestamp = Date.now();
  const length = clampNumber(config.length, 16, 256);
  const value =
    config.encoding === "plain"
      ? generateRandomString(length, config.charset)
      : encodeBytes(generateRandomBytes(length), config.encoding);

  return {
    generatedAt: timestamp,
    summary: getConfigSummary({ ...config, length }),
    outputs: [
      createOutput({
        id: "secret",
        title: "生成结果",
        description: "适用于普通 API Key、测试 Token 或临时凭证。",
        value,
        sensitive: true,
        type: config.type,
        timestamp,
        extension: "txt",
        mimeType: "text/plain",
      }),
    ],
  };
}

async function generateJwtSecretResult(
  config: Extract<KeyGeneratorConfig, { type: "jwt-secret" }>,
): Promise<KeyGenerationResult> {
  const timestamp = Date.now();
  const bytes = clampNumber(config.bytes, 32, 256);
  const value = encodeBytes(generateRandomBytes(bytes), config.encoding);

  return {
    generatedAt: timestamp,
    summary: getConfigSummary({ ...config, bytes }),
    outputs: [
      createOutput({
        id: "secret",
        title: "JWT Secret",
        description:
          "适用于 HS256 / HS384 / HS512 等基于共享密钥的 JWT 签名场景。",
        value,
        sensitive: true,
        type: config.type,
        timestamp,
        extension: "txt",
        mimeType: "text/plain",
      }),
    ],
  };
}

async function generateAesResult(
  config: Extract<KeyGeneratorConfig, { type: "aes-256" }>,
): Promise<KeyGenerationResult> {
  const timestamp = Date.now();
  const key = await crypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"],
  );

  const value = await exportSecretKey(key, config.encoding);
  const extension = config.encoding === "jwk" ? "json" : "txt";
  const mimeType =
    config.encoding === "jwk" ? "application/json" : "text/plain";

  return {
    generatedAt: timestamp,
    summary: getConfigSummary(config),
    outputs: [
      createOutput({
        id: "secret",
        title: config.encoding === "jwk" ? "AES-256 JWK" : "AES-256 Key",
        description: "通过 Web Crypto API 生成，可用于 AES-GCM 兼容场景。",
        value,
        sensitive: true,
        type: config.type,
        timestamp,
        extension,
        mimeType,
      }),
    ],
  };
}

async function generateHmacResult(
  config: Extract<KeyGeneratorConfig, { type: "hmac-sha256" }>,
): Promise<KeyGenerationResult> {
  const timestamp = Date.now();
  const bytes = clampNumber(config.bytes, 32, 128);
  const key = await crypto.subtle.generateKey(
    {
      name: "HMAC",
      hash: "SHA-256",
      length: bytes * 8,
    },
    true,
    ["sign", "verify"],
  );

  const value = await exportSecretKey(key, config.encoding);
  const extension = config.encoding === "jwk" ? "json" : "txt";
  const mimeType =
    config.encoding === "jwk" ? "application/json" : "text/plain";

  return {
    generatedAt: timestamp,
    summary: getConfigSummary({ ...config, bytes }),
    outputs: [
      createOutput({
        id: "secret",
        title: config.encoding === "jwk" ? "HMAC JWK" : "HMAC Secret",
        description: "适用于签名、Webhook 验签和服务间消息摘要校验。",
        value,
        sensitive: true,
        type: config.type,
        timestamp,
        extension,
        mimeType,
      }),
    ],
  };
}

async function generateRsaResult(
  config: Extract<KeyGeneratorConfig, { type: "rsa-key-pair" }>,
): Promise<KeyGenerationResult> {
  const timestamp = Date.now();
  const keyPair = await crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
      modulusLength: config.modulusLength,
      publicExponent: new Uint8Array([1, 0, 1]),
    },
    true,
    ["encrypt", "decrypt"],
  );

  if (config.encoding === "jwk") {
    const publicJwk = await crypto.subtle.exportKey("jwk", keyPair.publicKey);
    const privateJwk = await crypto.subtle.exportKey("jwk", keyPair.privateKey);

    return {
      generatedAt: timestamp,
      summary: getConfigSummary(config),
      outputs: [
        createOutput({
          id: "public",
          title: "Public JWK",
          description: "公钥可以安全分发给需要加密数据或校验身份的调用方。",
          value: createJwkOutputValue(publicJwk),
          sensitive: false,
          type: config.type,
          timestamp,
          extension: "json",
          mimeType: "application/json",
        }),
        createOutput({
          id: "private",
          title: "Private JWK",
          description: "私钥请谨慎保管，仅在当前页面内存中存在。",
          value: createJwkOutputValue(privateJwk),
          sensitive: true,
          type: config.type,
          timestamp,
          extension: "json",
          mimeType: "application/json",
        }),
      ],
    };
  }

  const publicKey = await crypto.subtle.exportKey("spki", keyPair.publicKey);
  const privateKey = await crypto.subtle.exportKey("pkcs8", keyPair.privateKey);

  return {
    generatedAt: timestamp,
    summary: getConfigSummary(config),
    outputs: [
      createOutput({
        id: "public",
        title: "Public Key",
        description: "PEM 格式公钥，适合共享给接入方或导入其它系统。",
        value: formatPem("PUBLIC KEY", publicKey),
        sensitive: false,
        type: config.type,
        timestamp,
        extension: "pem",
        mimeType: "application/x-pem-file",
      }),
      createOutput({
        id: "private",
        title: "Private Key",
        description: "PEM 格式私钥，请及时复制或下载并妥善保管。",
        value: formatPem("PRIVATE KEY", privateKey),
        sensitive: true,
        type: config.type,
        timestamp,
        extension: "pem",
        mimeType: "application/x-pem-file",
      }),
    ],
  };
}

export async function generateKeyResult(config: KeyGeneratorConfig) {
  switch (config.type) {
    case "api-key":
      return generateApiKeyResult(config);
    case "jwt-secret":
      return generateJwtSecretResult(config);
    case "aes-256":
      return generateAesResult(config);
    case "hmac-sha256":
      return generateHmacResult(config);
    case "rsa-key-pair":
      return generateRsaResult(config);
  }
}
