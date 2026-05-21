/**
 * 条形码工具的主模式。
 */
export type BarcodeToolMode = "generate" | "parse";

/**
 * 工具支持的码制标识，对应 bwip-js 的 bcid 与 ZXing 的 BarcodeFormat。
 */
export type BarcodeSymbology =
  | "code128"
  | "ean13"
  | "ean8"
  | "upca"
  | "upce"
  | "code39"
  | "code93"
  | "itf14"
  | "interleaved2of5"
  | "codabar"
  | "datamatrix"
  | "pdf417"
  | "azteccode";

/**
 * 人眼可读字符的位置。
 */
export type BarcodeTextPosition = "below" | "above";

/**
 * 下载/导出图片的格式。
 */
export type BarcodeDownloadFormat = "png" | "svg";

/**
 * 条形码工具的配置项。
 */
export interface BarcodeToolConfig {
  mode: BarcodeToolMode;
  symbology: BarcodeSymbology;
  text: string;
  scale: number;
  height: number;
  includeText: boolean;
  textPosition: BarcodeTextPosition;
  foregroundColor: string;
  backgroundColor: string;
  transparentBackground: boolean;
  padding: number;
  rotate: "N" | "L" | "R" | "I";
  downloadFormat: BarcodeDownloadFormat;
}

/**
 * 生成模式的渲染结果。
 */
export interface BarcodeGenerateResult {
  text: string;
  symbology: BarcodeSymbology;
  pngDataUrl: string;
  svgMarkup: string;
  width: number;
  height: number;
  warnings: string[];
}

/**
 * 图片解析结果。
 */
export interface BarcodeParseResult {
  rawValue: string;
  format: string;
  imageName: string;
  imageSize: number;
  width: number;
  height: number;
  scannedAt: number;
  imageDataUrl: string;
  warnings: string[];
}
