import bwipjs from "bwip-js/browser";
import type { ClipboardEvent } from "react";

import type {
  BarcodeDownloadFormat,
  BarcodeGenerateResult,
  BarcodeParseResult,
  BarcodeSymbology,
  BarcodeToolConfig,
  BarcodeToolMode,
} from "./type";

type BwipRenderOptions = Parameters<typeof bwipjs.toSVG>[0];

type SelectOption<T extends string> = {
  label: string;
  value: T;
  description: string;
};

/**
 * 单个码制的字段约束与示例，用于校验、占位提示和示例填充。
 */
interface SymbologyMeta {
  label: string;
  description: string;
  /** 内容输入框占位提示 */
  placeholder: string;
  /** 示例值，用于“填充示例”按钮 */
  example: string;
  /** 是否一维线性码（影响是否展示一维高度/可读字配置） */
  linear: boolean;
  /** 输入字符校验与提示 */
  validate?: (text: string) => string | null;
}

const MAX_PARSE_FILE_SIZE = 12 * 1024 * 1024;
const MAX_PARSE_CANVAS_SIZE = 1600;

export const PARSE_FILE_SIZE_LIMIT = MAX_PARSE_FILE_SIZE;

export const BARCODE_MODE_OPTIONS: Array<SelectOption<BarcodeToolMode>> = [
  {
    label: "生成条形码",
    value: "generate",
    description: "选择码制并输入内容，实时预览并导出 PNG / SVG。",
  },
  {
    label: "解析条形码",
    value: "parse",
    description: "上传、拖拽或粘贴条形码图片，自动识别码制和原始值。",
  },
];

export const BARCODE_SYMBOLOGY_META: Record<BarcodeSymbology, SymbologyMeta> = {
  code128: {
    label: "CODE128",
    description: "通用一维码，支持任意 ASCII 字符，物流和办公最常见。",
    placeholder: "支持任意 ASCII 字符，例如订单号或批次编码",
    example: "LYN-128-20260521",
    linear: true,
  },
  ean13: {
    label: "EAN-13",
    description: "13 位国际商品条码，自动计算第 13 位校验位。",
    placeholder: "请输入 12 位数字（校验位会自动补齐）",
    example: "690123456789",
    linear: true,
    validate: (text) => {
      if (!/^\d{12,13}$/.test(text)) {
        return "EAN-13 需要 12 位数字内容（也可直接输入 13 位包含校验位）。";
      }
      return null;
    },
  },
  ean8: {
    label: "EAN-8",
    description: "8 位国际短码，常用于小尺寸包装。",
    placeholder: "请输入 7 位数字（校验位会自动补齐）",
    example: "1234567",
    linear: true,
    validate: (text) => {
      if (!/^\d{7,8}$/.test(text)) {
        return "EAN-8 需要 7 位数字内容（也可直接输入 8 位包含校验位）。";
      }
      return null;
    },
  },
  upca: {
    label: "UPC-A",
    description: "12 位北美商品条码，与 EAN-13 兼容。",
    placeholder: "请输入 11 位数字（校验位会自动补齐）",
    example: "01234567890",
    linear: true,
    validate: (text) => {
      if (!/^\d{11,12}$/.test(text)) {
        return "UPC-A 需要 11 位数字内容（也可直接输入 12 位包含校验位）。";
      }
      return null;
    },
  },
  upce: {
    label: "UPC-E",
    description: "UPC-A 的 6 位压缩形式，适合小型包装。",
    placeholder: "请输入 6 位或 8 位数字",
    example: "01245678",
    linear: true,
    validate: (text) => {
      if (!/^\d{6,8}$/.test(text)) {
        return "UPC-E 需要 6 至 8 位数字内容。";
      }
      return null;
    },
  },
  code39: {
    label: "Code 39",
    description: "工业常用一维码，支持大写字母、数字和少量符号。",
    placeholder: "支持 0-9、A-Z 和 -.$/+%* 空格",
    example: "LYN-39-ABCDE",
    linear: true,
    validate: (text) => {
      if (!/^[0-9A-Z\-. $/+%*]+$/.test(text)) {
        return "Code 39 仅支持大写字母、数字和 -.$/+%* 空格等基本字符。";
      }
      return null;
    },
  },
  code93: {
    label: "Code 93",
    description: "对 Code 39 的扩展，编码更紧凑，常用于工业环境。",
    placeholder: "支持 0-9、A-Z 和常见符号",
    example: "LYN-93-CODE",
    linear: true,
  },
  itf14: {
    label: "ITF-14",
    description: "14 位物流外箱条码，必须为定长数字。",
    placeholder: "请输入 13 位数字（校验位会自动补齐）",
    example: "1234567890123",
    linear: true,
    validate: (text) => {
      if (!/^\d{13,14}$/.test(text)) {
        return "ITF-14 需要 13 位数字内容（也可直接输入 14 位包含校验位）。";
      }
      return null;
    },
  },
  interleaved2of5: {
    label: "Interleaved 2 of 5",
    description: "高密度数字一维码，常用于仓储和票据。",
    placeholder: "请输入偶数位数字",
    example: "12345678",
    linear: true,
    validate: (text) => {
      if (!/^\d+$/.test(text)) {
        return "Interleaved 2 of 5 仅支持数字。";
      }
      if (text.length % 2 !== 0) {
        return "Interleaved 2 of 5 长度需为偶数，建议补齐前导 0。";
      }
      return null;
    },
  },
  codabar: {
    label: "Codabar",
    description: "医学、库存领域的传统一维码，以 A-D 字符作为起止符。",
    placeholder: "例如 A12345678B，首尾字母为 A-D",
    example: "A12345678B",
    linear: true,
    validate: (text) => {
      if (!/^[A-D][0-9\-$:/.+]*[A-D]$/.test(text)) {
        return "Codabar 需要以 A-D 字符作为起止符，中间可包含数字和 -$:/.+ 等符号。";
      }
      return null;
    },
  },
  datamatrix: {
    label: "DataMatrix",
    description: "正方形二维码，密度高，工业标识与零部件追溯常用。",
    placeholder: "支持文本、URL、序列号等任意内容",
    example: "https://lynote.dev/docs/datamatrix",
    linear: false,
  },
  pdf417: {
    label: "PDF417",
    description: "条形堆叠式二维码，常见于证件、登机牌和发票。",
    placeholder: "支持中等长度文本与二进制数据",
    example: "Lynote Toolkit PDF417 示例内容",
    linear: false,
  },
  azteccode: {
    label: "Aztec",
    description: "中心定位的二维码，票务与公共交通使用广泛。",
    placeholder: "支持任意文本，包括 URL",
    example: "https://lynote.dev/docs/aztec",
    linear: false,
  },
};

export const BARCODE_SYMBOLOGY_OPTIONS: Array<SelectOption<BarcodeSymbology>> =
  (Object.keys(BARCODE_SYMBOLOGY_META) as BarcodeSymbology[]).map((value) => ({
    label: BARCODE_SYMBOLOGY_META[value].label,
    value,
    description: BARCODE_SYMBOLOGY_META[value].description,
  }));

export const BARCODE_DOWNLOAD_FORMAT_OPTIONS: Array<
  SelectOption<BarcodeDownloadFormat>
> = [
  {
    label: "PNG",
    value: "png",
    description: "适合截图、办公文档和大多数标签打印。",
  },
  {
    label: "SVG",
    value: "svg",
    description: "无损矢量，适合继续设计编辑或高精度打印。",
  },
];

export const BARCODE_TEXT_POSITION_OPTIONS: Array<
  SelectOption<BarcodeToolConfig["textPosition"]>
> = [
  {
    label: "下方",
    value: "below",
    description: "最常见的可读字位置，与多数扫码标签一致。",
  },
  {
    label: "上方",
    value: "above",
    description: "适合带标题或品牌信息的标签布局。",
  },
];

export const BARCODE_ROTATE_OPTIONS: Array<
  SelectOption<BarcodeToolConfig["rotate"]>
> = [
  {
    label: "默认",
    value: "N",
    description: "水平方向，标准识别角度。",
  },
  {
    label: "顺时针 90°",
    value: "R",
    description: "适合竖向标签或侧贴。",
  },
  {
    label: "逆时针 90°",
    value: "L",
    description: "适合反向竖向标签。",
  },
  {
    label: "倒置 180°",
    value: "I",
    description: "用于特殊扫码方向，需配合扫码器测试。",
  },
];

export const DEFAULT_BARCODE_TOOL_CONFIG: BarcodeToolConfig = {
  mode: "generate",
  symbology: "code128",
  text: "LYN-128-20260521",
  scale: 3,
  height: 14,
  includeText: true,
  textPosition: "below",
  foregroundColor: "#111827",
  backgroundColor: "#ffffff",
  transparentBackground: false,
  padding: 8,
  rotate: "N",
  downloadFormat: "png",
};

export function getSymbologyMeta(symbology: BarcodeSymbology) {
  return BARCODE_SYMBOLOGY_META[symbology];
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

/**
 * 把 hex 颜色字符串转成 bwip-js 期望的 `RRGGBB` 字符串（无 #）。
 */
function normalizeHexColor(hex: string) {
  const trimmed = hex.replace("#", "").trim();

  if (/^[0-9a-fA-F]{3}$/.test(trimmed)) {
    return trimmed
      .split("")
      .map((char) => `${char}${char}`)
      .join("")
      .toUpperCase();
  }

  if (/^[0-9a-fA-F]{6}$/.test(trimmed)) {
    return trimmed.toUpperCase();
  }

  return "000000";
}

function buildBwipOptions(config: BarcodeToolConfig): BwipRenderOptions {
  const meta = getSymbologyMeta(config.symbology);
  const baseOptions: BwipRenderOptions = {
    bcid: config.symbology,
    text: config.text,
    scale: config.scale,
    includetext: meta.linear ? config.includeText : false,
    paddingwidth: config.padding,
    paddingheight: config.padding,
    rotate: config.rotate,
    barcolor: normalizeHexColor(config.foregroundColor),
    textcolor: normalizeHexColor(config.foregroundColor),
  };

  if (meta.linear) {
    baseOptions.height = config.height;
    baseOptions.textyalign = config.textPosition;
  }

  if (!config.transparentBackground) {
    baseOptions.backgroundcolor = normalizeHexColor(config.backgroundColor);
  }

  return baseOptions;
}

function getEstimatedWarnings(
  config: BarcodeToolConfig,
  meta: SymbologyMeta,
): string[] {
  const warnings: string[] = [];

  if (config.transparentBackground) {
    warnings.push(
      "当前启用了透明背景，建议放在纯色浅底上使用，避免扫码区域识别失败。",
    );
  }

  if (config.scale < 2) {
    warnings.push("缩放倍数偏低，打印或远距离扫码时可能识别困难。");
  }

  if (meta.linear && config.height < 8) {
    warnings.push(
      "一维码高度偏低，建议保持 10 以上以方便扫码枪从不同角度读取。",
    );
  }

  if (config.rotate !== "N") {
    warnings.push("旋转后部分扫码器仍按水平识别，请提前在目标设备上测试方向。");
  }

  return warnings;
}

/**
 * 在浏览器中通过 bwip-js 同步渲染条形码，返回 PNG dataURL、SVG 字符串与尺寸。
 */
export function generateBarcodeResult(
  config: BarcodeToolConfig,
): BarcodeGenerateResult {
  const trimmed = config.text.trim();

  if (!trimmed) {
    throw new Error("请输入条形码内容。");
  }

  const meta = getSymbologyMeta(config.symbology);
  const formatError = meta.validate?.(trimmed);

  if (formatError) {
    throw new Error(formatError);
  }

  const options = buildBwipOptions({ ...config, text: trimmed });
  const canvas = document.createElement("canvas");

  try {
    bwipjs.toCanvas(canvas, options);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "当前内容不符合所选码制的要求。";
    throw new Error(`条形码生成失败：${message}`);
  }

  const pngDataUrl = canvas.toDataURL("image/png");
  const svgMarkup = bwipjs.toSVG(options);

  return {
    text: trimmed,
    symbology: config.symbology,
    pngDataUrl,
    svgMarkup,
    width: canvas.width,
    height: canvas.height,
    warnings: getEstimatedWarnings(config, meta),
  };
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

interface PreparedImage {
  imageDataUrl: string;
  width: number;
  height: number;
  imageElement: HTMLImageElement;
}

async function prepareImageFromFile(file: File): Promise<PreparedImage> {
  const imageDataUrl = await readFileAsDataUrl(file);
  const image = await loadImageElement(imageDataUrl);
  const scale = Math.min(
    1,
    MAX_PARSE_CANVAS_SIZE / Math.max(image.width, image.height),
  );
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));

  // 如果需要等比缩放，重新画到一张 canvas 上再换源
  if (scale < 1) {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("当前浏览器无法创建图像解析上下文。");
    }

    canvas.width = width;
    canvas.height = height;
    context.drawImage(image, 0, 0, width, height);

    const scaledDataUrl = canvas.toDataURL("image/png");
    const scaledImage = await loadImageElement(scaledDataUrl);

    return {
      imageDataUrl: scaledDataUrl,
      width,
      height,
      imageElement: scaledImage,
    };
  }

  return {
    imageDataUrl,
    width,
    height,
    imageElement: image,
  };
}

/**
 * 使用 @zxing/browser 识别一维与常见二维码，返回原始值和码制。
 */
export async function parseBarcodeFromFile(
  file: File,
): Promise<BarcodeParseResult> {
  if (file.size > MAX_PARSE_FILE_SIZE) {
    throw new Error(
      `当前图片超过 ${formatFileSize(MAX_PARSE_FILE_SIZE)}，请压缩后再试。`,
    );
  }

  const [{ BrowserMultiFormatReader }, prepared] = await Promise.all([
    import("@zxing/browser"),
    prepareImageFromFile(file),
  ]);

  const reader = new BrowserMultiFormatReader();

  let result;
  try {
    result = await reader.decodeFromImageElement(prepared.imageElement);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "未在当前图片中识别到条形码，请尝试更清晰的截图或原图。";
    throw new Error(message || "未识别到条形码，请尝试更清晰的图片。");
  }

  const warnings: string[] = [];

  if (prepared.width < 200 || prepared.height < 200) {
    warnings.push("当前图片分辨率偏低，识别可能不稳定，建议上传更清晰的原图。");
  }

  return {
    rawValue: result.getText(),
    format: String(result.getBarcodeFormat()),
    imageName: file.name,
    imageSize: file.size,
    width: prepared.width,
    height: prepared.height,
    scannedAt: Date.now(),
    imageDataUrl: prepared.imageDataUrl,
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

export function createBarcodeFileName(config: BarcodeToolConfig) {
  return `barcode-${config.symbology}`;
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

export function dataUrlToBlob(dataUrl: string): Blob {
  const [meta, base64] = dataUrl.split(",");
  const mimeMatch = /data:([^;]+)/.exec(meta);
  const mime = mimeMatch?.[1] ?? "application/octet-stream";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new Blob([bytes], { type: mime });
}

export function svgStringToBlob(svg: string): Blob {
  return new Blob([svg], { type: "image/svg+xml" });
}
