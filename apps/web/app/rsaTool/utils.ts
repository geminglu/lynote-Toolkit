import type {
  RsaBinaryEncoding,
  RsaHashAlgorithm,
  RsaKeyFormat,
  RsaKeyInfo,
  RsaKeyKind,
  RsaOutputItem,
  RsaSignatureAlgorithm,
  RsaToolConfig,
  RsaToolMode,
  RsaToolResult,
} from "./type";

type Option<T extends string> = {
  label: string;
  value: T;
  description?: string;
  compatibility?: boolean;
};

type ParsedPem = {
  label: string;
  bytes: Uint8Array;
};

type RsaImportTarget = {
  format: RsaKeyFormat;
  keyText: string;
  kind: RsaKeyKind;
  algorithm: RsaEncryptionImportAlgorithm | RsaSignatureImportAlgorithm;
};

type RsaEncryptionImportAlgorithm = {
  name: "RSA-OAEP";
  hash: { name: string };
};

type RsaSignatureImportAlgorithm = {
  name: "RSASSA-PKCS1-v1_5" | "RSA-PSS";
  hash: { name: string };
};

const BASE64_CHUNK_SIZE = 32768;

const RSA_ENCRYPTION_USAGE_LABELS: Record<RsaKeyKind, string[]> = {
  public: ["加密"],
  private: ["解密"],
};

const RSA_SIGNATURE_USAGE_LABELS: Record<RsaKeyKind, string[]> = {
  public: ["验签"],
  private: ["签名"],
};

export const RSA_MODE_OPTIONS: Array<Option<RsaToolMode>> = [
  {
    label: "加密",
    value: "encrypt",
    description: "使用 RSA 公钥对短文本加密，适合联调和对称密钥封装。",
  },
  {
    label: "解密",
    value: "decrypt",
    description: "使用 RSA 私钥解密当前密文，明文按 UTF-8 文本展示。",
  },
  {
    label: "签名",
    value: "sign",
    description: "使用 RSA 私钥对文本签名，用于证明来源和完整性。",
  },
  {
    label: "验签",
    value: "verify",
    description: "使用 RSA 公钥校验签名是否与原文完全匹配。",
  },
  {
    label: "密钥检查",
    value: "inspect",
    description: "识别 RSA 密钥类型、位数和可用用途，帮助快速排错。",
  },
];

export const RSA_KEY_FORMAT_OPTIONS: Array<Option<RsaKeyFormat>> = [
  {
    label: "PEM",
    value: "pem",
    description: "适合复制粘贴和与 OpenSSL、后端框架互通。",
  },
  {
    label: "JWK",
    value: "jwk",
    description: "JSON Web Key，适合浏览器和 JOSE 生态。",
  },
];

export const RSA_HASH_OPTIONS: Array<Option<RsaHashAlgorithm>> = [
  { label: "SHA-256", value: "sha-256" },
  { label: "SHA-384", value: "sha-384" },
  { label: "SHA-512", value: "sha-512" },
  {
    label: "SHA-1",
    value: "sha-1",
    compatibility: true,
    description: "仅建议用于兼容旧系统。",
  },
];

export const RSA_SIGNATURE_ALGORITHM_OPTIONS: Array<
  Option<RsaSignatureAlgorithm>
> = [
  {
    label: "RSASSA-PKCS1-v1_5",
    value: "rsassa-pkcs1-v1_5",
    description: "兼容性较好，常见于传统接口和开放平台签名。",
  },
  {
    label: "RSA-PSS",
    value: "rsa-pss",
    description: "更现代的签名方案，需要签名和验签双方 saltLength 一致。",
  },
];

export const RSA_BINARY_ENCODING_OPTIONS: Array<Option<RsaBinaryEncoding>> = [
  { label: "Base64", value: "base64" },
  { label: "Base64URL", value: "base64url" },
  { label: "Hex", value: "hex" },
];

export const DEFAULT_RSA_TOOL_CONFIG: RsaToolConfig = {
  mode: "encrypt",
  keyFormat: "pem",
  keyText: "",
  encryptionHash: "sha-256",
  signatureAlgorithm: "rsassa-pkcs1-v1_5",
  signatureHash: "sha-256",
  outputEncoding: "base64",
  ciphertextEncoding: "base64",
  signatureEncoding: "base64",
  plaintext: "",
  ciphertext: "",
  message: "",
  signature: "",
  pssSaltLength: 32,
};

function toUint8Array(buffer: ArrayBuffer) {
  return new Uint8Array(buffer);
}

function toArrayBuffer(bytes: Uint8Array) {
  return new Uint8Array(bytes).buffer;
}

function concatBytes(...parts: Uint8Array[]) {
  const totalLength = parts.reduce((sum, part) => sum + part.length, 0);
  const merged = new Uint8Array(totalLength);
  let offset = 0;

  for (const part of parts) {
    merged.set(part, offset);
    offset += part.length;
  }

  return merged;
}

function encodeDerLength(length: number) {
  if (length < 128) {
    return new Uint8Array([length]);
  }

  const octets: number[] = [];
  let remaining = length;

  while (remaining > 0) {
    octets.unshift(remaining & 0xff);
    remaining >>= 8;
  }

  return new Uint8Array([0x80 | octets.length, ...octets]);
}

function createDerBlock(tag: number, content: Uint8Array) {
  return concatBytes(
    new Uint8Array([tag]),
    encodeDerLength(content.length),
    content,
  );
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

function base64ToBytes(value: string) {
  const normalized = value.replace(/\s+/g, "");
  const binary = atob(normalized);

  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function base64ToBase64Url(value: string) {
  return value.replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/g, "");
}

function base64UrlToBase64(value: string) {
  const normalized = value
    .replace(/\s+/g, "")
    .replaceAll("-", "+")
    .replaceAll("_", "/");
  const padding =
    normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));

  return `${normalized}${padding}`;
}

function encodeBytes(bytes: Uint8Array, encoding: RsaBinaryEncoding) {
  if (encoding === "hex") {
    return bytesToHex(bytes);
  }

  const base64 = bytesToBase64(bytes);

  return encoding === "base64url" ? base64ToBase64Url(base64) : base64;
}

function decodeBytes(value: string, encoding: RsaBinaryEncoding) {
  if (!value.trim()) {
    throw new Error("请输入需要处理的密文或签名内容。");
  }

  if (encoding === "hex") {
    const normalized = value.replace(/\s+/g, "");

    if (!/^[0-9a-fA-F]+$/.test(normalized) || normalized.length % 2 !== 0) {
      throw new Error("Hex 输入不合法，请检查是否包含非法字符或长度不是偶数。");
    }

    return Uint8Array.from(normalized.match(/.{2}/g) ?? [], (item) =>
      Number.parseInt(item, 16),
    );
  }

  try {
    return base64ToBytes(
      encoding === "base64url" ? base64UrlToBase64(value) : value,
    );
  } catch {
    throw new Error(
      encoding === "base64"
        ? "Base64 输入不合法，请检查是否有缺失字符或额外空格。"
        : "Base64URL 输入不合法，请检查是否使用了错误的字符集。",
    );
  }
}

function createTimestampSlug(timestamp: number) {
  return new Date(timestamp).toISOString().replaceAll(":", "-");
}

function createOutputFilename(
  mode: RsaToolMode,
  timestamp: number,
  suffix: string,
) {
  return `rsa-tool-${mode}-${suffix}-${createTimestampSlug(timestamp)}`;
}

function createOutput(
  input: Omit<RsaOutputItem, "filename"> & {
    mode: RsaToolMode;
    timestamp: number;
    extension: string;
  },
): RsaOutputItem {
  return {
    id: input.id,
    title: input.title,
    description: input.description,
    value: input.value,
    mimeType: input.mimeType,
    filename: `${createOutputFilename(input.mode, input.timestamp, input.id)}.${input.extension}`,
  };
}

function parsePem(value: string): ParsedPem {
  const trimmed = value.trim();
  const matched = trimmed.match(
    /-----BEGIN ([A-Z ]+)-----([\s\S]*?)-----END \1-----/,
  );

  if (!matched) {
    throw new Error("PEM 格式不合法，请确认头尾标记是否完整。");
  }

  return {
    label: matched[1],
    bytes: base64ToBytes(matched[2].replace(/\s+/g, "")),
  };
}

function wrapPkcs1PublicKeyToSpki(publicKeyBytes: Uint8Array) {
  const algorithmIdentifier = createDerBlock(
    0x30,
    concatBytes(
      new Uint8Array([
        0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01,
      ]),
      new Uint8Array([0x05, 0x00]),
    ),
  );

  const subjectPublicKey = createDerBlock(
    0x03,
    concatBytes(new Uint8Array([0x00]), publicKeyBytes),
  );

  return createDerBlock(
    0x30,
    concatBytes(algorithmIdentifier, subjectPublicKey),
  );
}

function wrapPkcs1PrivateKeyToPkcs8(privateKeyBytes: Uint8Array) {
  const version = new Uint8Array([0x02, 0x01, 0x00]);
  const algorithmIdentifier = createDerBlock(
    0x30,
    concatBytes(
      new Uint8Array([
        0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01,
      ]),
      new Uint8Array([0x05, 0x00]),
    ),
  );
  const privateKey = createDerBlock(0x04, privateKeyBytes);

  return createDerBlock(
    0x30,
    concatBytes(version, algorithmIdentifier, privateKey),
  );
}

function getHashLabel(hash: RsaHashAlgorithm) {
  return hash.toUpperCase();
}

function getHashAlgorithmName(hash: RsaHashAlgorithm) {
  return hash.toUpperCase();
}

function getHashSize(hash: RsaHashAlgorithm) {
  switch (hash) {
    case "sha-1":
      return 20;
    case "sha-256":
      return 32;
    case "sha-384":
      return 48;
    case "sha-512":
      return 64;
  }
}

export function getModeLabel(mode: RsaToolMode) {
  return (
    RSA_MODE_OPTIONS.find((option) => option.value === mode)?.label ?? mode
  );
}

export function getBinaryEncodingLabel(encoding: RsaBinaryEncoding) {
  return (
    RSA_BINARY_ENCODING_OPTIONS.find((option) => option.value === encoding)
      ?.label ?? encoding
  );
}

export function getKeyFormatLabel(format: RsaKeyFormat) {
  return (
    RSA_KEY_FORMAT_OPTIONS.find((option) => option.value === format)?.label ??
    format
  );
}

export function getSignatureAlgorithmLabel(algorithm: RsaSignatureAlgorithm) {
  return (
    RSA_SIGNATURE_ALGORITHM_OPTIONS.find((option) => option.value === algorithm)
      ?.label ?? algorithm
  );
}

function getEncryptionImportAlgorithm(hash: RsaHashAlgorithm) {
  return {
    name: "RSA-OAEP" as const,
    hash: { name: getHashAlgorithmName(hash) },
  };
}

function getSignatureImportAlgorithm(
  algorithm: RsaSignatureAlgorithm,
  hash: RsaHashAlgorithm,
) {
  return {
    name:
      algorithm === "rsa-pss"
        ? ("RSA-PSS" as const)
        : ("RSASSA-PKCS1-v1_5" as const),
    hash: { name: getHashAlgorithmName(hash) },
  };
}

function normalizeImportedJwk(value: JsonWebKey) {
  const normalized: JsonWebKey = { ...value };

  delete normalized.alg;
  delete normalized.ext;
  delete normalized.key_ops;
  delete normalized.use;

  return normalized;
}

function getJwkKind(value: JsonWebKey): RsaKeyKind {
  return value.d ? "private" : "public";
}

function getPemKind(label: string): RsaKeyKind | null {
  if (label === "PUBLIC KEY" || label === "RSA PUBLIC KEY") {
    return "public";
  }

  if (label === "PRIVATE KEY" || label === "RSA PRIVATE KEY") {
    return "private";
  }

  return null;
}

function getPemImportPayload(parsedPem: ParsedPem, expectedKind: RsaKeyKind) {
  const detectedKind = getPemKind(parsedPem.label);

  if (!detectedKind) {
    throw new Error("当前 PEM 标签不受支持，请使用 RSA 公钥或私钥内容。");
  }

  if (detectedKind !== expectedKind) {
    throw new Error(
      expectedKind === "public"
        ? "当前操作需要公钥，请确认没有误填成私钥。"
        : "当前操作需要私钥，请确认没有误填成公钥。",
    );
  }

  if (parsedPem.label === "RSA PUBLIC KEY") {
    return {
      format: "spki" as const,
      data: wrapPkcs1PublicKeyToSpki(parsedPem.bytes),
      label: parsedPem.label,
    };
  }

  if (parsedPem.label === "RSA PRIVATE KEY") {
    return {
      format: "pkcs8" as const,
      data: wrapPkcs1PrivateKeyToPkcs8(parsedPem.bytes),
      label: parsedPem.label,
    };
  }

  return {
    format: expectedKind === "public" ? ("spki" as const) : ("pkcs8" as const),
    data: parsedPem.bytes,
    label: parsedPem.label,
  };
}

async function importRsaKey(target: RsaImportTarget) {
  if (target.format === "pem") {
    const parsedPem = parsePem(target.keyText);
    const pemPayload = getPemImportPayload(parsedPem, target.kind);

    const key = await crypto.subtle.importKey(
      pemPayload.format,
      toArrayBuffer(pemPayload.data),
      target.algorithm,
      true,
      target.kind === "public"
        ? target.algorithm.name === "RSA-OAEP"
          ? ["encrypt"]
          : ["verify"]
        : target.algorithm.name === "RSA-OAEP"
          ? ["decrypt"]
          : ["sign"],
    );

    return {
      key,
      pemLabel: pemPayload.label,
    };
  }

  let jwk: JsonWebKey;

  try {
    jwk = JSON.parse(target.keyText) as JsonWebKey;
  } catch {
    throw new Error("JWK 解析失败，请确认输入的是合法 JSON。");
  }

  if (jwk.kty !== "RSA") {
    throw new Error("当前 JWK 不是 RSA 密钥，请检查 `kty` 是否为 `RSA`。");
  }

  const jwkKind = getJwkKind(jwk);

  if (jwkKind !== target.kind) {
    throw new Error(
      target.kind === "public"
        ? "当前操作需要公钥，请确认 JWK 中不包含私钥字段。"
        : "当前操作需要私钥，请确认 JWK 中包含 `d` 等私钥字段。",
    );
  }

  const key = await crypto.subtle.importKey(
    "jwk",
    normalizeImportedJwk(jwk),
    target.algorithm,
    true,
    target.kind === "public"
      ? target.algorithm.name === "RSA-OAEP"
        ? ["encrypt"]
        : ["verify"]
      : target.algorithm.name === "RSA-OAEP"
        ? ["decrypt"]
        : ["sign"],
  );

  return {
    key,
    pemLabel: undefined,
  };
}

function createKeyInfo(
  key: CryptoKey,
  format: RsaKeyFormat,
  kind: RsaKeyKind,
  pemLabel?: string,
): RsaKeyInfo {
  const algorithm = key.algorithm as RsaHashedKeyAlgorithm;
  const usageLabels =
    algorithm.name === "RSA-OAEP"
      ? RSA_ENCRYPTION_USAGE_LABELS[kind]
      : RSA_SIGNATURE_USAGE_LABELS[kind];
  const hashLabel =
    typeof algorithm.hash === "object" && algorithm.hash
      ? ` / ${algorithm.hash.name}`
      : "";

  return {
    format,
    kind,
    pemLabel,
    modulusLength: algorithm.modulusLength,
    usages: usageLabels,
    algorithmLabel: `${algorithm.name}${hashLabel}`,
  };
}

function getOperationSummary(config: RsaToolConfig) {
  switch (config.mode) {
    case "encrypt":
      return `已使用 RSA-OAEP / ${getHashLabel(config.encryptionHash)} 生成密文。`;
    case "decrypt":
      return `已使用 RSA-OAEP / ${getHashLabel(config.encryptionHash)} 解密当前密文。`;
    case "sign":
      return `已使用 ${getSignatureAlgorithmLabel(config.signatureAlgorithm)} / ${getHashLabel(config.signatureHash)} 生成签名。`;
    case "verify":
      return `已使用 ${getSignatureAlgorithmLabel(config.signatureAlgorithm)} / ${getHashLabel(config.signatureHash)} 完成验签。`;
    case "inspect":
      return "已完成当前密钥的结构识别与可用性检查。";
  }
}

function createInspectionText(info: RsaKeyInfo) {
  return [
    `密钥格式：${getKeyFormatLabel(info.format)}`,
    `密钥类型：${info.kind === "public" ? "公钥" : "私钥"}`,
    info.pemLabel ? `PEM 标签：${info.pemLabel}` : "",
    typeof info.modulusLength === "number" ? `位数：${info.modulusLength}` : "",
    `当前识别算法：${info.algorithmLabel}`,
    `当前可用用途：${info.usages.join(" / ")}`,
  ]
    .filter(Boolean)
    .join("\n");
}

function getWarnings(config: RsaToolConfig) {
  const warnings: string[] = [];

  if (
    (config.mode === "encrypt" || config.mode === "decrypt") &&
    config.encryptionHash === "sha-1"
  ) {
    warnings.push("`SHA-1` 仅建议用于兼容旧系统，不建议用于新的安全敏感场景。");
  }

  if (
    (config.mode === "sign" || config.mode === "verify") &&
    config.signatureHash === "sha-1"
  ) {
    warnings.push("`SHA-1` 仅建议用于兼容旧系统，不建议用于新的安全敏感场景。");
  }

  if (
    (config.mode === "sign" || config.mode === "verify") &&
    config.signatureAlgorithm === "rsa-pss"
  ) {
    warnings.push("`RSA-PSS` 需要签名和验签双方保持相同的 `saltLength`。");
  }

  return warnings;
}

function downloadTextFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.click();

  URL.revokeObjectURL(objectUrl);
}

export function getModePrimaryInputLabel(mode: RsaToolMode) {
  switch (mode) {
    case "encrypt":
      return "明文内容";
    case "decrypt":
      return "密文内容";
    case "sign":
      return "签名原文";
    case "verify":
      return "原文内容";
    case "inspect":
      return "";
  }
}

export function getModePrimaryInputDescription(mode: RsaToolMode) {
  switch (mode) {
    case "encrypt":
      return "文本将按 UTF-8 编码加密。RSA 更适合短文本或对称密钥封装。";
    case "decrypt":
      return "请确认当前密文的编码格式与左侧选择一致。";
    case "sign":
      return "签名针对原文计算，不会生成可逆的明文恢复结果。";
    case "verify":
      return "验签会同时使用原文、公钥、签名值和算法参数进行判断。";
    case "inspect":
      return "";
  }
}

export function getRecommendedKeyHint(mode: RsaToolMode) {
  switch (mode) {
    case "encrypt":
    case "verify":
      return "当前操作需要公钥。";
    case "decrypt":
    case "sign":
      return "当前操作需要私钥。";
    case "inspect":
      return "支持粘贴 RSA 公钥或私钥，PEM 与 JWK 均可识别。";
  }
}

export function copyToClipboard(value: string) {
  return navigator.clipboard.writeText(value);
}

export function downloadOutputItem(output: RsaOutputItem) {
  downloadTextFile(output.filename, output.value, output.mimeType);
}

function assertKeyText(value: string) {
  if (!value.trim()) {
    throw new Error("请先输入 RSA 密钥内容。");
  }
}

function getMaxPlaintextLength(modulusLength: number, hash: RsaHashAlgorithm) {
  return modulusLength / 8 - 2 * getHashSize(hash) - 2;
}

function getPssSaltLength(config: RsaToolConfig) {
  return Math.max(0, Math.floor(config.pssSaltLength || 0));
}

async function inspectRsaKey(config: RsaToolConfig): Promise<RsaToolResult> {
  assertKeyText(config.keyText);

  const format = config.keyFormat;
  const kind =
    format === "pem"
      ? (() => {
          const parsedPem = parsePem(config.keyText);
          const pemKind = getPemKind(parsedPem.label);

          if (!pemKind) {
            throw new Error("当前 PEM 不是可识别的 RSA 公钥或私钥。");
          }

          return pemKind;
        })()
      : (() => {
          let jwk: JsonWebKey;

          try {
            jwk = JSON.parse(config.keyText) as JsonWebKey;
          } catch {
            throw new Error("JWK 解析失败，请确认输入的是合法 JSON。");
          }

          if (jwk.kty !== "RSA") {
            throw new Error(
              "当前 JWK 不是 RSA 密钥，请检查 `kty` 是否为 `RSA`。",
            );
          }

          return getJwkKind(jwk);
        })();

  const imported = await importRsaKey({
    format,
    keyText: config.keyText,
    kind,
    algorithm: getEncryptionImportAlgorithm("sha-256"),
  });
  const keyInfo = createKeyInfo(imported.key, format, kind, imported.pemLabel);
  const timestamp = Date.now();

  return {
    mode: config.mode,
    generatedAt: timestamp,
    summary: getOperationSummary(config),
    keyInfo,
    warnings: [],
    outputs: [
      createOutput({
        id: "inspection",
        title: "密钥检查结果",
        description:
          "可复制这份摘要发给联调同学，快速确认密钥格式、位数和用途。",
        value: createInspectionText(keyInfo),
        mode: config.mode,
        timestamp,
        extension: "txt",
        mimeType: "text/plain",
      }),
    ],
  };
}

async function encryptWithRsa(config: RsaToolConfig): Promise<RsaToolResult> {
  assertKeyText(config.keyText);

  const imported = await importRsaKey({
    format: config.keyFormat,
    keyText: config.keyText,
    kind: "public",
    algorithm: getEncryptionImportAlgorithm(config.encryptionHash),
  });
  const keyInfo = createKeyInfo(
    imported.key,
    config.keyFormat,
    "public",
    imported.pemLabel,
  );
  const plaintextBytes = new TextEncoder().encode(config.plaintext);
  const maxPlaintextLength =
    typeof keyInfo.modulusLength === "number"
      ? getMaxPlaintextLength(keyInfo.modulusLength, config.encryptionHash)
      : undefined;

  if (!config.plaintext) {
    throw new Error("请输入需要加密的明文内容。");
  }

  if (
    typeof maxPlaintextLength === "number" &&
    plaintextBytes.length > maxPlaintextLength
  ) {
    throw new Error(
      `当前明文过长，RSA-OAEP / ${getHashLabel(config.encryptionHash)} 在 ${keyInfo.modulusLength}-bit 密钥下最多支持 ${maxPlaintextLength} bytes。`,
    );
  }

  const encrypted = await crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    imported.key,
    plaintextBytes,
  );
  const timestamp = Date.now();

  return {
    mode: config.mode,
    generatedAt: timestamp,
    summary: getOperationSummary(config),
    keyInfo,
    warnings: getWarnings(config),
    inputLength: plaintextBytes.length,
    maxPlaintextLength,
    outputs: [
      createOutput({
        id: "ciphertext",
        title: "密文结果",
        description: `已按 ${getBinaryEncodingLabel(config.outputEncoding)} 输出，可直接复制到接口调试或后端配置中。`,
        value: encodeBytes(toUint8Array(encrypted), config.outputEncoding),
        mode: config.mode,
        timestamp,
        extension: "txt",
        mimeType: "text/plain",
      }),
    ],
  };
}

async function decryptWithRsa(config: RsaToolConfig): Promise<RsaToolResult> {
  assertKeyText(config.keyText);

  if (!config.ciphertext.trim()) {
    throw new Error("请输入需要解密的密文内容。");
  }

  const imported = await importRsaKey({
    format: config.keyFormat,
    keyText: config.keyText,
    kind: "private",
    algorithm: getEncryptionImportAlgorithm(config.encryptionHash),
  });
  const ciphertextBytes = decodeBytes(
    config.ciphertext,
    config.ciphertextEncoding,
  );
  const decrypted = await crypto.subtle.decrypt(
    { name: "RSA-OAEP" },
    imported.key,
    ciphertextBytes,
  );
  const plaintext = new TextDecoder().decode(decrypted);
  const timestamp = Date.now();

  return {
    mode: config.mode,
    generatedAt: timestamp,
    summary: getOperationSummary(config),
    keyInfo: createKeyInfo(
      imported.key,
      config.keyFormat,
      "private",
      imported.pemLabel,
    ),
    warnings: getWarnings(config),
    inputLength: ciphertextBytes.length,
    outputs: [
      createOutput({
        id: "plaintext",
        title: "明文结果",
        description:
          "已按 UTF-8 文本展示。如果目标内容不是文本，请改为使用 Base64 或 Hex 流程保存原始字节。",
        value: plaintext,
        mode: config.mode,
        timestamp,
        extension: "txt",
        mimeType: "text/plain",
      }),
    ],
  };
}

async function signWithRsa(config: RsaToolConfig): Promise<RsaToolResult> {
  assertKeyText(config.keyText);

  if (!config.message) {
    throw new Error("请输入需要签名的原文内容。");
  }

  const importAlgorithm = getSignatureImportAlgorithm(
    config.signatureAlgorithm,
    config.signatureHash,
  );
  const imported = await importRsaKey({
    format: config.keyFormat,
    keyText: config.keyText,
    kind: "private",
    algorithm: importAlgorithm,
  });
  const messageBytes = new TextEncoder().encode(config.message);
  const signed = await crypto.subtle.sign(
    config.signatureAlgorithm === "rsa-pss"
      ? { name: "RSA-PSS", saltLength: getPssSaltLength(config) }
      : { name: "RSASSA-PKCS1-v1_5" },
    imported.key,
    messageBytes,
  );
  const timestamp = Date.now();

  return {
    mode: config.mode,
    generatedAt: timestamp,
    summary: getOperationSummary(config),
    keyInfo: createKeyInfo(
      imported.key,
      config.keyFormat,
      "private",
      imported.pemLabel,
    ),
    warnings: getWarnings(config),
    inputLength: messageBytes.length,
    outputs: [
      createOutput({
        id: "signature",
        title: "签名结果",
        description: `已按 ${getBinaryEncodingLabel(config.outputEncoding)} 输出，可用于服务端验签或第三方联调。`,
        value: encodeBytes(toUint8Array(signed), config.outputEncoding),
        mode: config.mode,
        timestamp,
        extension: "txt",
        mimeType: "text/plain",
      }),
    ],
  };
}

async function verifyWithRsa(config: RsaToolConfig): Promise<RsaToolResult> {
  assertKeyText(config.keyText);

  if (!config.message) {
    throw new Error("请输入需要验签的原文内容。");
  }

  if (!config.signature.trim()) {
    throw new Error("请输入需要校验的签名值。");
  }

  const importAlgorithm = getSignatureImportAlgorithm(
    config.signatureAlgorithm,
    config.signatureHash,
  );
  const imported = await importRsaKey({
    format: config.keyFormat,
    keyText: config.keyText,
    kind: "public",
    algorithm: importAlgorithm,
  });
  const messageBytes = new TextEncoder().encode(config.message);
  const signatureBytes = decodeBytes(
    config.signature,
    config.signatureEncoding,
  );
  const verified = await crypto.subtle.verify(
    config.signatureAlgorithm === "rsa-pss"
      ? { name: "RSA-PSS", saltLength: getPssSaltLength(config) }
      : { name: "RSASSA-PKCS1-v1_5" },
    imported.key,
    signatureBytes,
    messageBytes,
  );
  const timestamp = Date.now();

  return {
    mode: config.mode,
    generatedAt: timestamp,
    summary: getOperationSummary(config),
    keyInfo: createKeyInfo(
      imported.key,
      config.keyFormat,
      "public",
      imported.pemLabel,
    ),
    warnings: getWarnings(config),
    verified,
    inputLength: messageBytes.length,
    outputs: [
      createOutput({
        id: "verification",
        title: "验签结果",
        description: verified
          ? "签名和原文、公钥、算法参数完全匹配。"
          : "签名未通过，请重点检查原文、密钥、编码格式和 saltLength。",
        value: verified ? "验签通过" : "验签失败",
        mode: config.mode,
        timestamp,
        extension: "txt",
        mimeType: "text/plain",
      }),
    ],
  };
}

export async function executeRsaTool(config: RsaToolConfig) {
  try {
    switch (config.mode) {
      case "encrypt":
        return await encryptWithRsa(config);
      case "decrypt":
        return await decryptWithRsa(config);
      case "sign":
        return await signWithRsa(config);
      case "verify":
        return await verifyWithRsa(config);
      case "inspect":
        return await inspectRsaKey(config);
    }

    throw new Error("当前操作模式暂不支持。");
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }

    throw new Error("RSA 操作失败，请重试。");
  }
}
