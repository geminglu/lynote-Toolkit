import type {
  JwtDebuggerConfig,
  JwtDebuggerResult,
  JwtOutputItem,
  JwtSupportedAlgorithm,
  JwtTimeClaimInfo,
  JwtTimeClaimName,
  JwtTimeClaimStatus,
  JwtVerificationKeyType,
  JwtVerificationResult,
} from "./type";

type Option<T extends string> = {
  label: string;
  value: T;
  description: string;
};

type ParsedPem = {
  label: string;
  bytes: Uint8Array;
};

type RsaPublicPemKind = "spki" | "pkcs1";

const JWT_SUPPORTED_ALGORITHMS: JwtSupportedAlgorithm[] = [
  "HS256",
  "HS384",
  "HS512",
  "RS256",
  "RS384",
  "RS512",
];

const JWT_TIME_CLAIMS: JwtTimeClaimName[] = ["exp", "nbf", "iat"];

export const JWT_VERIFICATION_KEY_TYPE_OPTIONS: Array<
  Option<JwtVerificationKeyType>
> = [
  {
    label: "Secret",
    value: "secret",
    description: "适用于 `HS256`、`HS384`、`HS512` 等共享密钥签名场景。",
  },
  {
    label: "PEM Public Key",
    value: "pem",
    description:
      "适用于 `RS256`、`RS384`、`RS512`，支持 `PUBLIC KEY` 与 `RSA PUBLIC KEY`。",
  },
  {
    label: "JWK",
    value: "jwk",
    description: "适用于 JOSE 生态中的 RSA 公钥 `JWK`。",
  },
];

export const DEFAULT_JWT_DEBUGGER_CONFIG: JwtDebuggerConfig = {
  token: "",
  verificationEnabled: false,
  verificationKeyType: "secret",
  verificationKey: "",
  clockToleranceSeconds: 0,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toArrayBuffer(bytes: Uint8Array) {
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;
}

function base64ToBytes(value: string) {
  const normalized = value.replace(/\s+/g, "");
  const binary = atob(normalized);

  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
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

function decodeBase64UrlUtf8(value: string, label: "Header" | "Payload") {
  if (!value) {
    throw new Error(`JWT ${label} 不能为空，请确认 token 结构是否完整。`);
  }

  try {
    const bytes = base64ToBytes(base64UrlToBase64(value));

    return new TextDecoder().decode(bytes);
  } catch {
    throw new Error(
      `JWT ${label} 不是合法的 Base64URL 编码，请检查 token 内容。`,
    );
  }
}

function parseJsonRecord(text: string, label: "Header" | "Payload") {
  try {
    const parsed = JSON.parse(text) as unknown;

    if (!isRecord(parsed)) {
      throw new Error();
    }

    return parsed;
  } catch {
    throw new Error(`JWT ${label} 不是合法 JSON 对象，请检查编码后的内容。`);
  }
}

function getHashNameFromAlgorithm(algorithm: JwtSupportedAlgorithm) {
  switch (algorithm) {
    case "HS256":
    case "RS256":
      return "SHA-256";
    case "HS384":
    case "RS384":
      return "SHA-384";
    case "HS512":
    case "RS512":
      return "SHA-512";
  }
}

function getAlgorithmFamily(algorithm: string) {
  if (algorithm.startsWith("HS")) {
    return "hs";
  }

  if (algorithm.startsWith("RS")) {
    return "rs";
  }

  if (algorithm === "none") {
    return "none";
  }

  return "unsupported";
}

function getRsaImportAlgorithm(algorithm: JwtSupportedAlgorithm) {
  return {
    name: "RSASSA-PKCS1-v1_5" as const,
    hash: { name: getHashNameFromAlgorithm(algorithm) },
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

function concatBytes(...chunks: Uint8Array[]) {
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;

  chunks.forEach((chunk) => {
    result.set(chunk, offset);
    offset += chunk.length;
  });

  return result;
}

function createDerBlock(tag: number, content: Uint8Array) {
  return concatBytes(
    new Uint8Array([tag]),
    encodeDerLength(content.length),
    content,
  );
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

function getPemPublicKeyKind(label: string): RsaPublicPemKind | null {
  if (label === "PUBLIC KEY") {
    return "spki";
  }

  if (label === "RSA PUBLIC KEY") {
    return "pkcs1";
  }

  return null;
}

function normalizeImportedJwk(value: JsonWebKey) {
  const normalized: JsonWebKey = { ...value };

  delete normalized.alg;
  delete normalized.ext;
  delete normalized.key_ops;
  delete normalized.use;

  return normalized;
}

async function importVerificationKey(
  keyType: JwtVerificationKeyType,
  keyText: string,
  algorithm: JwtSupportedAlgorithm,
) {
  const algorithmFamily = getAlgorithmFamily(algorithm);

  if (algorithmFamily === "hs") {
    if (keyType !== "secret") {
      throw new Error(
        "当前 Token 使用的是 HS 系列算法，请输入 Secret，而不是 PEM 或 JWK 公钥。",
      );
    }

    const trimmed = keyText.trim();

    if (!trimmed) {
      throw new Error("请输入用于 HS 系列验签的 Secret。");
    }

    return crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(trimmed),
      {
        name: "HMAC",
        hash: { name: getHashNameFromAlgorithm(algorithm) },
      },
      false,
      ["verify"],
    );
  }

  if (algorithmFamily === "rs") {
    if (keyType === "secret") {
      throw new Error(
        "当前 Token 使用的是 RS 系列算法，请输入公钥或 RSA JWK，而不是共享 Secret。",
      );
    }

    if (!keyText.trim()) {
      throw new Error("请输入用于 RS 系列验签的公钥内容。");
    }

    if (keyType === "pem") {
      const parsedPem = parsePem(keyText);
      const pemKind = getPemPublicKeyKind(parsedPem.label);

      if (!pemKind) {
        throw new Error(
          "当前 PEM 不是受支持的 RSA 公钥，请使用 `PUBLIC KEY` 或 `RSA PUBLIC KEY`。",
        );
      }

      const keyBytes =
        pemKind === "pkcs1"
          ? wrapPkcs1PublicKeyToSpki(parsedPem.bytes)
          : parsedPem.bytes;

      return crypto.subtle.importKey(
        "spki",
        toArrayBuffer(keyBytes),
        getRsaImportAlgorithm(algorithm),
        false,
        ["verify"],
      );
    }

    let jwk: JsonWebKey;

    try {
      jwk = JSON.parse(keyText) as JsonWebKey;
    } catch {
      throw new Error("JWK 解析失败，请确认输入的是合法 JSON。");
    }

    if (jwk.kty !== "RSA") {
      throw new Error("当前 JWK 不是 RSA 密钥，请检查 `kty` 是否为 `RSA`。");
    }

    if (jwk.d) {
      throw new Error("当前操作需要公钥，请确认输入的 JWK 不包含私钥字段。");
    }

    return crypto.subtle.importKey(
      "jwk",
      normalizeImportedJwk(jwk),
      getRsaImportAlgorithm(algorithm),
      false,
      ["verify"],
    );
  }

  throw new Error("当前算法暂不支持签名验证。");
}

function formatLocalTime(seconds: number) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(seconds * 1000));
}

function getTimeClaimLabel(claim: JwtTimeClaimName) {
  switch (claim) {
    case "exp":
      return "过期时间 exp";
    case "nbf":
      return "生效时间 nbf";
    case "iat":
      return "签发时间 iat";
  }
}

function getNumericClaimValue(rawValue: unknown) {
  if (typeof rawValue === "number" && Number.isFinite(rawValue)) {
    return rawValue;
  }

  if (
    typeof rawValue === "string" &&
    rawValue.trim() &&
    Number.isFinite(Number(rawValue))
  ) {
    return Number(rawValue);
  }

  return null;
}

function createTimeClaimInfo(
  claim: JwtTimeClaimName,
  rawValue: unknown,
  nowSeconds: number,
  toleranceSeconds: number,
): JwtTimeClaimInfo {
  const label = getTimeClaimLabel(claim);

  if (typeof rawValue === "undefined") {
    return {
      claim,
      label,
      rawValue,
      numericValue: null,
      isoTime: "",
      status: "missing",
      description: `当前 Payload 中未包含 ${claim}。`,
    };
  }

  const numericValue = getNumericClaimValue(rawValue);

  if (numericValue === null) {
    return {
      claim,
      label,
      rawValue,
      numericValue: null,
      isoTime: "",
      status: "invalid",
      description: `${claim} 不是标准秒级 Unix 时间戳，请检查 claim 格式。`,
    };
  }

  const isoTime = formatLocalTime(numericValue);

  if (claim === "exp") {
    if (nowSeconds > numericValue + toleranceSeconds) {
      const secondsAgo = Math.max(0, Math.floor(nowSeconds - numericValue));

      return {
        claim,
        label,
        rawValue,
        numericValue,
        isoTime,
        status: "expired",
        description: `Token 已过期，距现在约 ${secondsAgo} 秒。`,
      };
    }

    const remainingSeconds = Math.max(0, Math.floor(numericValue - nowSeconds));

    return {
      claim,
      label,
      rawValue,
      numericValue,
      isoTime,
      status: "valid",
      description: `Token 当前仍在有效期内，剩余约 ${remainingSeconds} 秒。`,
    };
  }

  if (claim === "nbf") {
    if (nowSeconds + toleranceSeconds < numericValue) {
      const waitSeconds = Math.max(0, Math.floor(numericValue - nowSeconds));

      return {
        claim,
        label,
        rawValue,
        numericValue,
        isoTime,
        status: "not-yet-valid",
        description: `Token 尚未到生效时间，距离生效约 ${waitSeconds} 秒。`,
      };
    }

    return {
      claim,
      label,
      rawValue,
      numericValue,
      isoTime,
      status: "valid",
      description: "Token 已达到生效时间。",
    };
  }

  if (nowSeconds + toleranceSeconds < numericValue) {
    const driftSeconds = Math.max(0, Math.floor(numericValue - nowSeconds));

    return {
      claim,
      label,
      rawValue,
      numericValue,
      isoTime,
      status: "future",
      description: `签发时间晚于当前本地时间，可能存在约 ${driftSeconds} 秒时钟偏移。`,
    };
  }

  return {
    claim,
    label,
    rawValue,
    numericValue,
    isoTime,
    status: "valid",
    description: "签发时间看起来正常。",
  };
}

async function verifyJwtSignature(
  algorithm: string,
  signature: string,
  signingInput: string,
  keyType: JwtVerificationKeyType,
  keyText: string,
): Promise<JwtVerificationResult> {
  if (!algorithm) {
    return {
      status: "warning",
      title: "未执行验签",
      message: "当前 Header 缺少 `alg` 字段，无法确定应使用的签名算法。",
    };
  }

  if (algorithm === "none") {
    return {
      status: "warning",
      title: "未执行验签",
      message:
        "检测到 `alg = none`，该 Token 没有签名保护，请确认这是否符合你的系统设计。",
    };
  }

  if (!JWT_SUPPORTED_ALGORITHMS.includes(algorithm as JwtSupportedAlgorithm)) {
    return {
      status: "warning",
      title: "暂不支持当前算法",
      message: `当前仅支持 ${JWT_SUPPORTED_ALGORITHMS.join(" / ")} 的验签。`,
    };
  }

  let signatureBytes: Uint8Array;

  try {
    signatureBytes = base64ToBytes(base64UrlToBase64(signature));
  } catch {
    throw new Error(
      "JWT Signature 不是合法的 Base64URL 编码，请检查 token 内容。",
    );
  }

  const supportedAlgorithm = algorithm as JwtSupportedAlgorithm;
  const key = await importVerificationKey(keyType, keyText, supportedAlgorithm);
  const payloadBytes = new TextEncoder().encode(signingInput);

  const verified = await crypto.subtle.verify(
    getAlgorithmFamily(supportedAlgorithm) === "hs"
      ? "HMAC"
      : "RSASSA-PKCS1-v1_5",
    key,
    toArrayBuffer(signatureBytes),
    toArrayBuffer(payloadBytes),
  );

  return verified
    ? {
        status: "success",
        title: "签名验证通过",
        message: "当前 token、算法与密钥材料匹配，签名校验成功。",
      }
    : {
        status: "error",
        title: "签名验证失败",
        message:
          "请检查 token 内容是否被改动、Header 中的 `alg` 是否正确，以及当前 Secret / 公钥是否与签发方完全一致。",
      };
}

function parseJwtToken(token: string) {
  const normalizedToken = token.replace(/\s+/g, "").trim();

  if (!normalizedToken) {
    throw new Error("请输入需要解析的 JWT Token。");
  }

  const segments = normalizedToken.split(".");

  if (segments.length !== 3) {
    throw new Error(
      "当前输入不是合法的 JWT 三段式结构，请确认包含 `header.payload.signature`。",
    );
  }

  const [headerBase64Url, payloadBase64Url, signature] = segments;
  const headerText = decodeBase64UrlUtf8(headerBase64Url, "Header");
  const payloadText = decodeBase64UrlUtf8(payloadBase64Url, "Payload");
  const header = parseJsonRecord(headerText, "Header");
  const payload = parseJsonRecord(payloadText, "Payload");

  return {
    normalizedToken,
    header,
    payload,
    headerText: JSON.stringify(header, null, 2),
    payloadText: JSON.stringify(payload, null, 2),
    signature,
    signingInput: `${headerBase64Url}.${payloadBase64Url}`,
    algorithm:
      typeof header.alg === "string" && header.alg.trim()
        ? header.alg.trim()
        : "",
  };
}

function createWarnings(
  algorithm: string,
  signature: string,
  claimInfos: JwtTimeClaimInfo[],
  header: Record<string, unknown>,
) {
  const warnings: string[] = [];

  if (!algorithm) {
    warnings.push("当前 Header 缺少 `alg` 字段，无法自动判断签名算法。");
  } else if (algorithm === "none") {
    warnings.push(
      "检测到 `alg = none`，这通常意味着当前 Token 没有签名保护，应谨慎使用。",
    );
  } else if (
    !JWT_SUPPORTED_ALGORITHMS.includes(algorithm as JwtSupportedAlgorithm)
  ) {
    warnings.push(
      `当前算法 ${algorithm} 暂未纳入首版支持，现阶段仅支持 ${JWT_SUPPORTED_ALGORITHMS.join(" / ")}。`,
    );
  }

  if (!signature && algorithm !== "none") {
    warnings.push(
      "当前 Token 的 Signature 为空，若目标系统要求签名，这通常是不合法的。",
    );
  }

  if (typeof header.kid === "string" && header.kid.trim()) {
    warnings.push(
      "Header 中包含 `kid`，如果目标系统依赖多个公钥，后续可以考虑补充 `JWKS / kid` 自动匹配能力。",
    );
  }

  claimInfos.forEach((claimInfo) => {
    if (claimInfo.status === "invalid") {
      warnings.push(claimInfo.description);
    }
  });

  return warnings;
}

function createSummary(
  algorithm: string,
  header: Record<string, unknown>,
  payload: Record<string, unknown>,
  verificationEnabled: boolean,
) {
  return [
    `已解析当前 JWT`,
    algorithm ? `识别算法 ${algorithm}` : "未识别到签名算法",
    `Header ${Object.keys(header).length} 个字段`,
    `Payload ${Object.keys(payload).length} 个字段`,
    verificationEnabled ? "已执行签名验证" : "未执行签名验证",
  ].join("，");
}

function createOutput(
  id: string,
  title: string,
  description: string,
  value: string,
) {
  const output: JwtOutputItem = {
    id,
    title,
    description,
    value,
  };

  return output;
}

export function getVerificationKeyTypeLabel(keyType: JwtVerificationKeyType) {
  return (
    JWT_VERIFICATION_KEY_TYPE_OPTIONS.find((option) => option.value === keyType)
      ?.label ?? keyType
  );
}

export function getVerificationKeyPlaceholder(
  keyType: JwtVerificationKeyType,
  algorithmHint?: string,
) {
  if (keyType === "secret") {
    return algorithmHint?.startsWith("RS")
      ? "当前 token 看起来是 RS 系列算法，请改填 PEM Public Key 或 JWK。"
      : "输入用于 HS256 / HS384 / HS512 验签的 Secret。";
  }

  if (keyType === "pem") {
    return algorithmHint?.startsWith("HS")
      ? "当前 token 看起来是 HS 系列算法，请改填 Secret。"
      : "粘贴 RSA PEM 公钥，例如 -----BEGIN PUBLIC KEY-----";
  }

  return algorithmHint?.startsWith("HS")
    ? "当前 token 看起来是 HS 系列算法，请改填 Secret。"
    : '粘贴 RSA JWK 公钥，例如 {"kty":"RSA","n":"...","e":"AQAB"}';
}

export function getTimeClaimStatusLabel(status: JwtTimeClaimStatus) {
  switch (status) {
    case "valid":
      return "正常";
    case "expired":
      return "已过期";
    case "not-yet-valid":
      return "尚未生效";
    case "future":
      return "时间偏移";
    case "missing":
      return "未提供";
    case "invalid":
      return "格式异常";
  }
}

export function getTimeClaimStatusTone(status: JwtTimeClaimStatus) {
  switch (status) {
    case "valid":
      return "success";
    case "missing":
      return "muted";
    case "expired":
    case "not-yet-valid":
    case "future":
    case "invalid":
      return "warning";
  }
}

export function formatClaimValue(value: unknown) {
  if (typeof value === "undefined") {
    return "未提供";
  }

  if (typeof value === "string") {
    return value;
  }

  return JSON.stringify(value);
}

export function detectJwtAlgorithm(token: string) {
  try {
    return parseJwtToken(token).algorithm;
  } catch {
    return "";
  }
}

export async function executeJwtDebugger(
  config: JwtDebuggerConfig,
): Promise<JwtDebuggerResult> {
  const parsed = parseJwtToken(config.token);
  const nowSeconds = Date.now() / 1000;
  const claimInfos = JWT_TIME_CLAIMS.map((claim) =>
    createTimeClaimInfo(
      claim,
      parsed.payload[claim],
      nowSeconds,
      config.clockToleranceSeconds,
    ),
  );
  const warnings = createWarnings(
    parsed.algorithm,
    parsed.signature,
    claimInfos,
    parsed.header,
  );
  const verification: JwtVerificationResult = config.verificationEnabled
    ? await verifyJwtSignature(
        parsed.algorithm,
        parsed.signature,
        parsed.signingInput,
        config.verificationKeyType,
        config.verificationKey,
      )
    : {
        status: "skipped",
        title: "未执行验签",
        message: "当前仅解析 JWT 结构与 claim，没有进行签名验证。",
      };

  return {
    generatedAt: Date.now(),
    summary: createSummary(
      parsed.algorithm,
      parsed.header,
      parsed.payload,
      config.verificationEnabled,
    ),
    normalizedToken: parsed.normalizedToken,
    tokenLength: parsed.normalizedToken.length,
    algorithm: parsed.algorithm,
    supportedAlgorithm: JWT_SUPPORTED_ALGORITHMS.includes(
      parsed.algorithm as JwtSupportedAlgorithm,
    ),
    header: parsed.header,
    payload: parsed.payload,
    headerText: parsed.headerText,
    payloadText: parsed.payloadText,
    signature: parsed.signature,
    signingInput: parsed.signingInput,
    warnings,
    claimInfos,
    verification,
    outputs: [
      createOutput(
        "header",
        "Header JSON",
        "当前 JWT Header 的格式化 JSON，可直接复制到接口调试或文档中。",
        parsed.headerText,
      ),
      createOutput(
        "payload",
        "Payload JSON",
        "当前 JWT Payload 的格式化 JSON，便于查看 claim 与业务字段。",
        parsed.payloadText,
      ),
      createOutput(
        "signature",
        "Signature",
        "原始 Signature 段，保持 Base64URL 形式展示。",
        parsed.signature,
      ),
      createOutput(
        "signing-input",
        "验签输入串",
        "签名验证实际参与计算的是 `header.payload` 两段拼接结果。",
        parsed.signingInput,
      ),
    ],
  };
}

export async function copyToClipboard(value: string) {
  await navigator.clipboard.writeText(value);
}
