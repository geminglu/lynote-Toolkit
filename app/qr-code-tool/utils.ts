import type { Options } from "qr-code-styling";
import type { ClipboardEvent } from "react";

import type {
  ParsedQrContent,
  QrCodeToolConfig,
  QrContentType,
  QrGenerateResult,
  QrLogoState,
  QrParseResult,
  WifiEncryption,
} from "./type";

type SelectOption<T extends string> = {
  label: string;
  value: T;
  description: string;
};

const WIFI_FIELD_SEPARATOR = /(?<!\\);/;
const MAX_QR_IMAGE_SIZE = 12 * 1024 * 1024;
const MAX_PARSE_CANVAS_SIZE = 1600;
const UTF8_CHUNK_SIZE = 32768;

export const MAX_LOGO_FILE_SIZE = 4 * 1024 * 1024;
export const MAX_PARSE_FILE_SIZE = MAX_QR_IMAGE_SIZE;

export const QR_MODE_OPTIONS: Array<SelectOption<"generate" | "parse">> = [
  {
    label: "生成二维码",
    value: "generate",
    description: "把文本、网址、Wi-Fi 等结构化内容生成二维码。",
  },
  {
    label: "解析二维码",
    value: "parse",
    description: "上传、拖拽或粘贴二维码图片，并做结构化识别。",
  },
];

export const QR_CONTENT_TYPE_OPTIONS: Array<SelectOption<QrContentType>> = [
  {
    label: "文本",
    value: "text",
    description: "适合普通说明、备注、代码片段或任意文本内容。",
  },
  {
    label: "网址",
    value: "url",
    description: "适合网页链接、活动落地页、文档地址和下载地址。",
  },
  {
    label: "Wi-Fi",
    value: "wifi",
    description: "适合访客联网、门店网络或家庭设备快速配网。",
  },
  {
    label: "电话",
    value: "phone",
    description: "扫码后可直接发起拨号，适合客服和商务联系方式。",
  },
  {
    label: "短信",
    value: "sms",
    description: "扫码后可自动带出手机号和短信内容。",
  },
  {
    label: "邮箱",
    value: "email",
    description: "生成带收件人、主题和正文的邮件二维码。",
  },
];

export const WIFI_ENCRYPTION_OPTIONS: Array<SelectOption<WifiEncryption>> = [
  {
    label: "WPA / WPA2",
    value: "WPA",
    description: "当前最常见的无线网络加密方式。",
  },
  {
    label: "WEP",
    value: "WEP",
    description: "仅适用于部分旧设备，不建议新环境继续使用。",
  },
  {
    label: "无密码",
    value: "nopass",
    description: "开放网络，不会携带 Wi-Fi 密码字段。",
  },
];

export const QR_DOT_STYLE_OPTIONS: Array<
  SelectOption<QrCodeToolConfig["dotStyle"]>
> = [
  {
    label: "方块",
    value: "square",
    description: "最稳妥的标准样式，适合打印与远距离扫码。",
  },
  {
    label: "圆点",
    value: "dots",
    description: "视觉更轻，适合海报和社交分享图。",
  },
  {
    label: "圆角",
    value: "rounded",
    description: "兼顾美观与可读性，是首版默认推荐样式。",
  },
  {
    label: "Classy",
    value: "classy",
    description: "风格更活跃，适合品牌物料。",
  },
  {
    label: "Classy Rounded",
    value: "classy-rounded",
    description: "在艺术感和识别率之间做折中。",
  },
  {
    label: "Extra Rounded",
    value: "extra-rounded",
    description: "更柔和，但建议搭配较高容错等级。",
  },
];

export const QR_CORNER_SQUARE_OPTIONS: Array<
  SelectOption<QrCodeToolConfig["cornerSquareStyle"]>
> = [
  {
    label: "方角",
    value: "square",
    description: "默认识别稳定性最好。",
  },
  {
    label: "圆角",
    value: "rounded",
    description: "更柔和，适合品牌风格统一。",
  },
  {
    label: "点状",
    value: "dot",
    description: "适合更轻的视觉表现。",
  },
  {
    label: "Extra Rounded",
    value: "extra-rounded",
    description: "更明显的圆角轮廓。",
  },
  {
    label: "Classy",
    value: "classy",
    description: "偏装饰性的定位角样式。",
  },
  {
    label: "Classy Rounded",
    value: "classy-rounded",
    description: "更适合海报类视觉稿。",
  },
];

export const QR_CORNER_DOT_OPTIONS: Array<
  SelectOption<QrCodeToolConfig["cornerDotStyle"]>
> = [
  {
    label: "方块",
    value: "square",
    description: "默认最稳妥。",
  },
  {
    label: "圆点",
    value: "dot",
    description: "与圆点主体更统一。",
  },
  {
    label: "圆角",
    value: "rounded",
    description: "适合更柔和的品牌视觉。",
  },
  {
    label: "Extra Rounded",
    value: "extra-rounded",
    description: "风格更明显，建议注意识别率。",
  },
  {
    label: "Classy",
    value: "classy",
    description: "偏装饰性的角点样式。",
  },
  {
    label: "Classy Rounded",
    value: "classy-rounded",
    description: "适合更强的美化风格。",
  },
];

export const QR_ERROR_CORRECTION_OPTIONS: Array<
  SelectOption<QrCodeToolConfig["errorCorrectionLevel"]>
> = [
  {
    label: "L",
    value: "L",
    description: "容错最低，码点更简洁，适合无 Logo 的简单场景。",
  },
  {
    label: "M",
    value: "M",
    description: "常规默认级别，兼顾识别率和密度。",
  },
  {
    label: "Q",
    value: "Q",
    description: "更适合加 Logo 或轻度美化场景。",
  },
  {
    label: "H",
    value: "H",
    description: "容错最高，更适合较大 Logo 或复杂样式。",
  },
];

export const QR_DOWNLOAD_FORMAT_OPTIONS: Array<
  SelectOption<QrCodeToolConfig["downloadFormat"]>
> = [
  {
    label: "PNG",
    value: "png",
    description: "适合大多数分享、海报和办公使用。",
  },
  {
    label: "SVG",
    value: "svg",
    description: "适合继续设计编辑和矢量输出。",
  },
  {
    label: "JPEG",
    value: "jpeg",
    description: "适合兼容某些仅接受 JPG 的场景。",
  },
  {
    label: "WebP",
    value: "webp",
    description: "体积更小，适合现代 Web 资源。",
  },
];

export const DEFAULT_QR_CODE_TOOL_CONFIG: QrCodeToolConfig = {
  mode: "generate",
  contentType: "url",
  textValue: "欢迎使用 Lynote Toolkit 二维码工具",
  urlValue: "https://lynote.dev",
  autoPrependProtocol: true,
  wifiSsid: "Lynote Guest WiFi",
  wifiPassword: "guest-2026",
  wifiEncryption: "WPA",
  wifiHidden: false,
  phoneNumber: "+86 13800138000",
  smsNumber: "+86 13800138000",
  smsMessage: "你好，我想咨询一下二维码工具的用法。",
  emailTo: "hello@example.com",
  emailSubject: "二维码工具咨询",
  emailBody: "你好，我想进一步了解这个工具的使用方式。",
  size: 320,
  margin: 12,
  foregroundColor: "#111827",
  backgroundColor: "#ffffff",
  transparentBackground: false,
  dotStyle: "rounded",
  cornerSquareStyle: "extra-rounded",
  cornerDotStyle: "dot",
  errorCorrectionLevel: "Q",
  logoScale: 0.22,
  logoMargin: 6,
  downloadFormat: "png",
};

function escapeWifiValue(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/([;,:"])/g, "\\$1");
}

function unescapeWifiValue(value: string) {
  return value.replace(/\\([\\;,:"])/g, "$1");
}

function ensureUrlProtocol(value: string) {
  if (/^[a-z][a-z0-9+.-]*:/i.test(value)) {
    return value;
  }

  return `https://${value}`;
}

function normalizeUrl(value: string, autoPrependProtocol: boolean) {
  const trimmed = value.trim();

  if (!trimmed) {
    throw new Error("请输入网址内容。");
  }

  const normalized = autoPrependProtocol ? ensureUrlProtocol(trimmed) : trimmed;

  try {
    const parsed = new URL(normalized);

    if (!parsed.protocol || !parsed.host) {
      throw new Error("invalid");
    }
  } catch {
    throw new Error("网址格式不合法，请输入完整链接或开启自动补全协议。");
  }

  return normalized;
}

function buildMailToUrl(config: QrCodeToolConfig) {
  const emailTo = config.emailTo.trim();

  if (!emailTo) {
    throw new Error("请输入收件邮箱地址。");
  }

  const mailto = new URL(`mailto:${emailTo}`);

  if (config.emailSubject.trim()) {
    mailto.searchParams.set("subject", config.emailSubject.trim());
  }

  if (config.emailBody.trim()) {
    mailto.searchParams.set("body", config.emailBody.trim());
  }

  return mailto.toString();
}

function buildWifiPayload(config: QrCodeToolConfig) {
  const ssid = config.wifiSsid.trim();

  if (!ssid) {
    throw new Error("请输入 Wi-Fi 名称（SSID）。");
  }

  if (config.wifiEncryption !== "nopass" && !config.wifiPassword.trim()) {
    throw new Error("当前 Wi-Fi 加密方式需要填写密码。");
  }

  const fields = [`T:${config.wifiEncryption}`, `S:${escapeWifiValue(ssid)}`];

  if (config.wifiEncryption !== "nopass") {
    fields.push(`P:${escapeWifiValue(config.wifiPassword.trim())}`);
  }

  if (config.wifiHidden) {
    fields.push("H:true");
  }

  return `WIFI:${fields.join(";")};;`;
}

function parseWifiPayload(rawValue: string) {
  const content = rawValue.slice(5).replace(/;;$/, "");
  const entries = content.split(WIFI_FIELD_SEPARATOR).filter(Boolean);
  const fields = new Map<string, string>();

  for (const entry of entries) {
    const separatorIndex = entry.indexOf(":");

    if (separatorIndex === -1) {
      continue;
    }

    const key = entry.slice(0, separatorIndex);
    const value = entry.slice(separatorIndex + 1);
    fields.set(key, unescapeWifiValue(value));
  }

  const encryption = fields.get("T") || "WPA";
  const ssid = fields.get("S") || "";
  const password = fields.get("P") || "";
  const hidden = fields.get("H") === "true";

  return createParsedContent({
    type: "wifi",
    title: "Wi-Fi 二维码",
    description: "已识别出无线网络配置，可用于访客联网或设备配网。",
    fields: [
      { label: "SSID", value: ssid || "未识别" },
      { label: "加密方式", value: encryption },
      { label: "密码", value: password || "无密码" },
      { label: "隐藏网络", value: hidden ? "是" : "否" },
    ],
    actions: [],
  });
}

function parseMailToPayload(rawValue: string) {
  try {
    const parsed = new URL(rawValue);

    return createParsedContent({
      type: "email",
      title: "邮件二维码",
      description: "扫码后可直接打开邮件客户端并填充基础内容。",
      fields: [
        { label: "收件人", value: parsed.pathname || "未填写" },
        {
          label: "主题",
          value: parsed.searchParams.get("subject") || "未填写",
        },
        { label: "正文", value: parsed.searchParams.get("body") || "未填写" },
      ],
      actions: [{ label: "打开邮件客户端", href: rawValue }],
    });
  } catch {
    return createTextContent(rawValue);
  }
}

function parseSmsPayload(rawValue: string) {
  const smsToMatched = /^SMSTO:([^:]*):([\s\S]*)$/i.exec(rawValue);

  if (smsToMatched) {
    return createParsedContent({
      type: "sms",
      title: "短信二维码",
      description: "扫码后可直接带出手机号和短信内容。",
      fields: [
        { label: "手机号", value: smsToMatched[1] || "未填写" },
        { label: "短信内容", value: smsToMatched[2] || "未填写" },
      ],
      actions: [{ label: "发短信", href: `sms:${smsToMatched[1]}` }],
    });
  }

  try {
    const parsed = new URL(rawValue);

    return createParsedContent({
      type: "sms",
      title: "短信二维码",
      description: "已识别出短信协议链接。",
      fields: [
        { label: "手机号", value: parsed.pathname || "未填写" },
        {
          label: "短信内容",
          value: parsed.searchParams.get("body") || "未填写",
        },
      ],
      actions: [{ label: "发短信", href: rawValue }],
    });
  } catch {
    return createTextContent(rawValue);
  }
}

function createParsedContent(content: ParsedQrContent) {
  return content;
}

function createTextContent(rawValue: string) {
  return createParsedContent({
    type: "text",
    title: "文本二维码",
    description: "当前内容不属于常见结构化协议，按普通文本展示。",
    fields: [
      {
        label: "文本内容",
        value: rawValue,
      },
    ],
    actions: [],
  });
}

function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "");
  const fullHex =
    normalized.length === 3
      ? normalized
          .split("")
          .map((char) => `${char}${char}`)
          .join("")
      : normalized;

  const parsed = Number.parseInt(fullHex, 16);

  return {
    r: (parsed >> 16) & 255,
    g: (parsed >> 8) & 255,
    b: parsed & 255,
  };
}

function getRelativeLuminance(hex: string) {
  const { r, g, b } = hexToRgb(hex);

  const normalize = (channel: number) => {
    const value = channel / 255;

    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };

  return 0.2126 * normalize(r) + 0.7152 * normalize(g) + 0.0722 * normalize(b);
}

function getContrastRatio(foreground: string, background: string) {
  const foregroundLuminance = getRelativeLuminance(foreground);
  const backgroundLuminance = getRelativeLuminance(background);
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);

  return (lighter + 0.05) / (darker + 0.05);
}

function getEstimatedComplexity(payloadLength: number) {
  if (payloadLength <= 40) {
    return "低";
  }

  if (payloadLength <= 120) {
    return "中";
  }

  if (payloadLength <= 240) {
    return "高";
  }

  return "较高，二维码会更密集";
}

function encodeUtf8ForQr(value: string) {
  const bytes = new TextEncoder().encode(value);
  let encoded = "";

  for (let index = 0; index < bytes.length; index += UTF8_CHUNK_SIZE) {
    const chunk = bytes.subarray(index, index + UTF8_CHUNK_SIZE);
    encoded += String.fromCharCode(...chunk);
  }

  return encoded;
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getContentTypeLabel(value: QrContentType) {
  return (
    QR_CONTENT_TYPE_OPTIONS.find((option) => option.value === value)?.label ??
    value
  );
}

export function getParseModeLabel(value: QrCodeToolConfig["mode"]) {
  return (
    QR_MODE_OPTIONS.find((option) => option.value === value)?.label ?? value
  );
}

export function buildQrPayload(config: QrCodeToolConfig) {
  switch (config.contentType) {
    case "text": {
      const textValue = config.textValue.trim();

      if (!textValue) {
        throw new Error("请输入文本内容。");
      }

      return textValue;
    }
    case "url":
      return normalizeUrl(config.urlValue, config.autoPrependProtocol);
    case "wifi":
      return buildWifiPayload(config);
    case "phone": {
      const phoneNumber = config.phoneNumber.trim();

      if (!phoneNumber) {
        throw new Error("请输入电话号码。");
      }

      return `tel:${phoneNumber}`;
    }
    case "sms": {
      const smsNumber = config.smsNumber.trim();

      if (!smsNumber) {
        throw new Error("请输入短信接收手机号。");
      }

      return `SMSTO:${smsNumber}:${config.smsMessage.trim()}`;
    }
    case "email":
      return buildMailToUrl(config);
    default:
      return config.textValue.trim();
  }
}

export function parseQrContent(rawValue: string): ParsedQrContent {
  const trimmed = rawValue.trim();

  if (!trimmed) {
    return createTextContent("");
  }

  if (/^WIFI:/i.test(trimmed)) {
    return parseWifiPayload(trimmed);
  }

  if (/^mailto:/i.test(trimmed)) {
    return parseMailToPayload(trimmed);
  }

  if (/^SMSTO:/i.test(trimmed) || /^sms:/i.test(trimmed)) {
    return parseSmsPayload(trimmed);
  }

  if (/^tel:/i.test(trimmed)) {
    const numberValue = trimmed.replace(/^tel:/i, "");

    return createParsedContent({
      type: "phone",
      title: "电话二维码",
      description: "扫码后可直接发起拨号。",
      fields: [{ label: "电话号码", value: numberValue || "未填写" }],
      actions: [{ label: "拨打电话", href: trimmed }],
    });
  }

  try {
    const parsedUrl = new URL(trimmed);

    if (parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:") {
      return createParsedContent({
        type: "url",
        title: "网址二维码",
        description: "已识别出网页链接，适合跳转官网、文档或活动页。",
        fields: [
          {
            label: "协议",
            value: parsedUrl.protocol.replace(":", "").toUpperCase(),
          },
          { label: "主机", value: parsedUrl.host },
          { label: "路径", value: parsedUrl.pathname || "/" },
          { label: "完整链接", value: parsedUrl.toString() },
        ],
        actions: [{ label: "打开链接", href: parsedUrl.toString() }],
      });
    }
  } catch {
    // ignore url parse failure
  }

  return createTextContent(trimmed);
}

export function generateQrResult(
  config: QrCodeToolConfig,
  logoState: QrLogoState | null,
): QrGenerateResult {
  const payload = buildQrPayload(config);
  const warnings: string[] = [];

  if (config.transparentBackground) {
    warnings.push(
      "当前启用了透明背景，建议放在纯色浅底上使用，避免扫码区域丢失。",
    );
  }

  if (!config.transparentBackground) {
    const contrastRatio = getContrastRatio(
      config.foregroundColor,
      config.backgroundColor,
    );

    if (contrastRatio < 2.5) {
      warnings.push("前景色与背景色对比度偏低，可能会影响扫码识别率。");
    }
  }

  if (logoState && config.logoScale > 0.3) {
    warnings.push("Logo 占比偏大，建议控制在 30% 以内并使用更高容错等级。");
  }

  if (
    logoState &&
    config.errorCorrectionLevel !== "Q" &&
    config.errorCorrectionLevel !== "H"
  ) {
    warnings.push("当前已添加 Logo，建议把容错等级提升到 Q 或 H。");
  }

  if (payload.length > 200) {
    warnings.push(
      "当前内容较长，二维码会更密集，建议优先控制扫码尺寸和打印清晰度。",
    );
  }

  if (config.contentType === "url" && /^http:\/\//i.test(payload)) {
    warnings.push("当前链接为 HTTP 非加密地址，公开传播时建议改为 HTTPS。");
  }

  return {
    payload,
    parsed: parseQrContent(payload),
    warnings,
    payloadLength: payload.length,
    estimatedComplexity: getEstimatedComplexity(payload.length),
  };
}

export function createQrStylingOptions(
  config: QrCodeToolConfig,
  payload: string,
  logoState: QrLogoState | null,
): Partial<Options> {
  return {
    type: "svg",
    width: config.size,
    height: config.size,
    data: encodeUtf8ForQr(payload),
    image: logoState?.dataUrl,
    margin: config.margin,
    qrOptions: {
      errorCorrectionLevel: config.errorCorrectionLevel,
      mode: "Byte",
    },
    dotsOptions: {
      color: config.foregroundColor,
      type: config.dotStyle,
    },
    cornersSquareOptions: {
      color: config.foregroundColor,
      type: config.cornerSquareStyle,
    },
    cornersDotOptions: {
      color: config.foregroundColor,
      type: config.cornerDotStyle,
    },
    backgroundOptions: {
      color: config.transparentBackground
        ? "transparent"
        : config.backgroundColor,
    },
    imageOptions: {
      hideBackgroundDots: true,
      imageSize: logoState ? config.logoScale : 0,
      margin: logoState ? config.logoMargin : 0,
      saveAsBlob: true,
    },
  };
}

export function getExampleValue(contentType: QrContentType) {
  switch (contentType) {
    case "text":
      return "欢迎使用 Lynote Toolkit，本二维码可用于文本分享。";
    case "url":
      return "docs.lynote.dev/toolkit/qr-code-tool";
    case "wifi":
      return "Lynote Guest WiFi";
    case "phone":
      return "+86 13800138000";
    case "sms":
      return "你好，我想了解一下二维码工具。";
    case "email":
      return "hello@example.com";
    default:
      return "";
  }
}

export async function readFileAsDataUrl(file: File) {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("图片读取失败，请重试。"));
    };

    reader.onerror = () => {
      reject(new Error("图片读取失败，请重试。"));
    };

    reader.readAsDataURL(file);
  });
}

async function loadImageElement(dataUrl: string) {
  return await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();

    image.onload = () => {
      resolve(image);
    };

    image.onerror = () => {
      reject(new Error("图片无法正常加载，请确认文件格式是否正确。"));
    };

    image.src = dataUrl;
  });
}

async function getImageDataFromFile(file: File) {
  const imageDataUrl = await readFileAsDataUrl(file);
  const image = await loadImageElement(imageDataUrl);
  const scale = Math.min(
    1,
    MAX_PARSE_CANVAS_SIZE / Math.max(image.width, image.height),
  );
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { willReadFrequently: true });

  if (!context) {
    throw new Error("当前浏览器无法创建图像解析上下文。");
  }

  canvas.width = width;
  canvas.height = height;
  context.drawImage(image, 0, 0, width, height);

  return {
    imageDataUrl,
    width,
    height,
    pixels: context.getImageData(0, 0, width, height).data,
  };
}

export async function parseQrFromFile(file: File): Promise<QrParseResult> {
  if (file.size > MAX_PARSE_FILE_SIZE) {
    throw new Error(
      `当前图片超过 ${formatFileSize(MAX_PARSE_FILE_SIZE)}，请压缩后再试。`,
    );
  }

  const [{ default: jsQR }, imageData] = await Promise.all([
    import("jsqr"),
    getImageDataFromFile(file),
  ]);
  const qrCode = jsQR(imageData.pixels, imageData.width, imageData.height, {
    inversionAttempts: "attemptBoth",
  });

  if (!qrCode) {
    throw new Error("未在当前图片中识别到二维码，请尝试更清晰的截图或原图。");
  }

  const warnings: string[] = [];

  if (imageData.width < 200 || imageData.height < 200) {
    warnings.push("当前图片分辨率较低，如有识别异常，建议上传更清晰的原图。");
  }

  return {
    rawValue: qrCode.data,
    parsed: parseQrContent(qrCode.data),
    imageName: file.name,
    imageSize: file.size,
    width: imageData.width,
    height: imageData.height,
    scannedAt: Date.now(),
    imageDataUrl: imageData.imageDataUrl,
    warnings,
  };
}

export async function extractImageFileFromClipboard(
  event: ClipboardEvent<HTMLElement>,
) {
  const file = Array.from(event.clipboardData.items)
    .find((item) => item.type.startsWith("image/"))
    ?.getAsFile();

  return file ?? null;
}

export function createQrFileName(config: QrCodeToolConfig) {
  return `qr-${config.contentType}-${config.downloadFormat}`;
}

export function createImageMimeType(
  format: QrCodeToolConfig["downloadFormat"],
) {
  if (format === "svg") {
    return "image/svg+xml";
  }

  if (format === "jpeg") {
    return "image/jpeg";
  }

  if (format === "webp") {
    return "image/webp";
  }

  return "image/png";
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  anchor.click();

  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 0);
}
