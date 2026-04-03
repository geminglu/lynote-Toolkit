import type {
  CornerDotType,
  CornerSquareType,
  DotType,
  ErrorCorrectionLevel,
  FileExtension,
} from "qr-code-styling";

/**
 * 二维码工具的主模式。
 */
export type QrCodeToolMode = "generate" | "parse";

/**
 * 二维码内容类型。
 */
export type QrContentType = "text" | "url" | "wifi" | "phone" | "sms" | "email";

/**
 * Wi-Fi 二维码支持的加密方式。
 */
export type WifiEncryption = "WPA" | "WEP" | "nopass";

/**
 * 解析结果中的二维码类型。
 */
export type ParsedQrType = QrContentType | "unknown";

/**
 * 结构化字段展示项。
 */
export interface ParsedQrField {
  label: string;
  value: string;
}

/**
 * 可快捷执行的解析动作。
 */
export interface ParsedQrAction {
  label: string;
  href: string;
}

/**
 * 结构化解析结果。
 */
export interface ParsedQrContent {
  type: ParsedQrType;
  title: string;
  description: string;
  fields: ParsedQrField[];
  actions: ParsedQrAction[];
}

/**
 * 生成模式的配置项。
 */
export interface QrCodeToolConfig {
  mode: QrCodeToolMode;
  contentType: QrContentType;
  textValue: string;
  urlValue: string;
  autoPrependProtocol: boolean;
  wifiSsid: string;
  wifiPassword: string;
  wifiEncryption: WifiEncryption;
  wifiHidden: boolean;
  phoneNumber: string;
  smsNumber: string;
  smsMessage: string;
  emailTo: string;
  emailSubject: string;
  emailBody: string;
  size: number;
  margin: number;
  foregroundColor: string;
  backgroundColor: string;
  transparentBackground: boolean;
  dotStyle: DotType;
  cornerSquareStyle: CornerSquareType;
  cornerDotStyle: CornerDotType;
  errorCorrectionLevel: ErrorCorrectionLevel;
  logoScale: number;
  logoMargin: number;
  downloadFormat: FileExtension;
}

/**
 * 上传的 Logo 元信息。
 */
export interface QrLogoState {
  name: string;
  size: number;
  dataUrl: string;
}

/**
 * 生成模式的计算结果。
 */
export interface QrGenerateResult {
  payload: string;
  parsed: ParsedQrContent;
  warnings: string[];
  payloadLength: number;
  estimatedComplexity: string;
}

/**
 * 图片解析结果。
 */
export interface QrParseResult {
  rawValue: string;
  parsed: ParsedQrContent;
  imageName: string;
  imageSize: number;
  width: number;
  height: number;
  scannedAt: number;
  imageDataUrl: string;
  warnings: string[];
}
