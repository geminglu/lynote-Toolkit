import { clampRgb, converter, formatHex8, parse } from "culori";

import type {
  ColorFormatCardData,
  ColorFormatMode,
  InternalRgbColor,
} from "./type";

const toRgb = converter("rgb");
const toHsl = converter("hsl");
const toHwb = converter("hwb");
const toLab = converter("lab");
const toLch = converter("lch");
const toOklch = converter("oklch");

const MODE_TO_PARSER_MODE: Record<
  Exclude<ColorFormatMode, "hex">,
  "rgb" | "hsl" | "hwb" | "lab" | "lch" | "oklch"
> = {
  rgba: "rgb",
  hsla: "hsl",
  hwb: "hwb",
  lab: "lab",
  lch: "lch",
  oklch: "oklch",
};

const CHANNEL_DECIMALS = 3;
const PERCENT_DECIMALS = 1;
const HUE_DECIMALS = 1;

/**
 * 当前工具默认打开时的颜色。
 */
export const DEFAULT_COLOR = parse("oklch(68% 0.22 285 / 0.82)");

/**
 * 颜色格式卡片的展示顺序。
 */
export const COLOR_FORMAT_SEQUENCE: ColorFormatMode[] = [
  "hex",
  "rgba",
  "hsla",
  "hwb",
  "lab",
  "lch",
  "oklch",
];

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function normalizeHue(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  const normalized = value % 360;

  return normalized < 0 ? normalized + 360 : normalized;
}

function round(value: number, decimals = CHANNEL_DECIMALS) {
  const factor = 10 ** decimals;

  return Math.round(value * factor) / factor;
}

function formatNumber(value: number, decimals = CHANNEL_DECIMALS) {
  const normalized = round(value, decimals);

  return normalized.toString();
}

function formatPercent(value: number, decimals = PERCENT_DECIMALS) {
  return `${formatNumber(value, decimals)}%`;
}

function formatAlpha(value: number) {
  return formatNumber(clamp(value, 0, 1), CHANNEL_DECIMALS);
}

function formatHue(value: number) {
  return formatNumber(normalizeHue(value), HUE_DECIMALS);
}

function toRgb255(value: number) {
  return Math.round(clamp(value, 0, 1) * 255);
}

function fromRgb255(value: number) {
  return clamp(value, 0, 255) / 255;
}

function ensureColor<T>(color: T | undefined | null) {
  if (!color) {
    throw new Error("颜色初始化失败，请检查默认颜色配置。");
  }

  return color;
}

/**
 * 将任意可解析颜色收敛为工具内部使用的 RGB 状态。
 */
export function toInternalRgbColor(
  input: Parameters<typeof toRgb>[0],
): InternalRgbColor {
  const rgbColor = clampRgb(toRgb(input));

  if (!rgbColor) {
    throw new Error("当前颜色无法转换为 RGB。");
  }

  return {
    mode: "rgb",
    r: clamp(rgbColor.r ?? 0, 0, 1),
    g: clamp(rgbColor.g ?? 0, 0, 1),
    b: clamp(rgbColor.b ?? 0, 0, 1),
    alpha: clamp(rgbColor.alpha ?? 1, 0, 1),
  };
}

/**
 * 将输入字符串按指定格式解析成内部颜色状态。
 */
export function parseColorByMode(
  mode: ColorFormatMode,
  value: string,
): InternalRgbColor | null {
  const input = value.trim();

  if (!input) {
    return null;
  }

  if (mode === "hex" && !input.startsWith("#")) {
    return null;
  }

  const parsedColor = parse(input);

  if (!parsedColor) {
    return null;
  }

  if (mode !== "hex" && parsedColor.mode !== MODE_TO_PARSER_MODE[mode]) {
    return null;
  }

  return toInternalRgbColor(parsedColor);
}

function formatRgbaValue(color: InternalRgbColor) {
  return `rgba(${toRgb255(color.r)}, ${toRgb255(color.g)}, ${toRgb255(color.b)}, ${formatAlpha(color.alpha)})`;
}

function formatHslaValue(color: InternalRgbColor) {
  const hslColor = ensureColor(toHsl(color));

  return `hsl(${formatHue(hslColor.h ?? 0)} ${formatPercent((hslColor.s ?? 0) * 100)} ${formatPercent((hslColor.l ?? 0) * 100)} / ${formatAlpha(color.alpha)})`;
}

function formatHwbValue(color: InternalRgbColor) {
  const hwbColor = ensureColor(toHwb(color));

  return `hwb(${formatHue(hwbColor.h ?? 0)} ${formatPercent((hwbColor.w ?? 0) * 100)} ${formatPercent((hwbColor.b ?? 0) * 100)} / ${formatAlpha(color.alpha)})`;
}

function formatLabValue(color: InternalRgbColor) {
  const labColor = ensureColor(toLab(color));

  return `lab(${formatPercent(labColor.l ?? 0)} ${formatNumber(labColor.a ?? 0, 2)} ${formatNumber(labColor.b ?? 0, 2)} / ${formatAlpha(color.alpha)})`;
}

function formatLchValue(color: InternalRgbColor) {
  const lchColor = ensureColor(toLch(color));

  return `lch(${formatPercent(lchColor.l ?? 0)} ${formatNumber(lchColor.c ?? 0, 2)} ${formatHue(lchColor.h ?? 0)} / ${formatAlpha(color.alpha)})`;
}

function formatOklchValue(color: InternalRgbColor) {
  const oklchColor = ensureColor(toOklch(color));

  return `oklch(${formatPercent((oklchColor.l ?? 0) * 100)} ${formatNumber(oklchColor.c ?? 0, 3)} ${formatHue(oklchColor.h ?? 0)} / ${formatAlpha(color.alpha)})`;
}

/**
 * 根据内部颜色状态生成指定模式的规范化字符串。
 */
export function formatColorByMode(
  mode: ColorFormatMode,
  color: InternalRgbColor,
) {
  switch (mode) {
    case "hex":
      return formatHex8(color)?.toUpperCase() ?? "#000000FF";
    case "rgba":
      return formatRgbaValue(color);
    case "hsla":
      return formatHslaValue(color);
    case "hwb":
      return formatHwbValue(color);
    case "lab":
      return formatLabValue(color);
    case "lch":
      return formatLchValue(color);
    case "oklch":
      return formatOklchValue(color);
  }
}

function normalizeHwbChannels(w: number, b: number) {
  if (w + b <= 1) {
    return { w, b };
  }

  const sum = w + b;

  return {
    w: w / sum,
    b: b / sum,
  };
}

/**
 * 基于单个通道修改指定格式的颜色，并重新收敛回内部 RGB。
 */
export function updateColorChannel(
  color: InternalRgbColor,
  mode: ColorFormatMode,
  key: string,
  value: number,
) {
  switch (mode) {
    case "hex":
    case "rgba": {
      return toInternalRgbColor({
        mode: "rgb",
        r: key === "r" ? fromRgb255(value) : color.r,
        g: key === "g" ? fromRgb255(value) : color.g,
        b: key === "b" ? fromRgb255(value) : color.b,
        alpha: key === "alpha" ? clamp(value, 0, 1) : color.alpha,
      });
    }
    case "hsla": {
      const current = ensureColor(toHsl(color));

      return toInternalRgbColor({
        mode: "hsl",
        h: key === "h" ? normalizeHue(value) : (current.h ?? 0),
        s: key === "s" ? clamp(value / 100, 0, 1) : (current.s ?? 0),
        l: key === "l" ? clamp(value / 100, 0, 1) : (current.l ?? 0),
        alpha: key === "alpha" ? clamp(value, 0, 1) : color.alpha,
      });
    }
    case "hwb": {
      const current = ensureColor(toHwb(color));
      const nextW = key === "w" ? clamp(value / 100, 0, 1) : (current.w ?? 0);
      const nextB = key === "b" ? clamp(value / 100, 0, 1) : (current.b ?? 0);
      const normalized = normalizeHwbChannels(nextW, nextB);

      return toInternalRgbColor({
        mode: "hwb",
        h: key === "h" ? normalizeHue(value) : (current.h ?? 0),
        w: normalized.w,
        b: normalized.b,
        alpha: key === "alpha" ? clamp(value, 0, 1) : color.alpha,
      });
    }
    case "lab": {
      const current = ensureColor(toLab(color));

      return toInternalRgbColor({
        mode: "lab",
        l: key === "l" ? clamp(value, 0, 100) : (current.l ?? 0),
        a: key === "a" ? clamp(value, -125, 125) : (current.a ?? 0),
        b: key === "b" ? clamp(value, -125, 125) : (current.b ?? 0),
        alpha: key === "alpha" ? clamp(value, 0, 1) : color.alpha,
      });
    }
    case "lch": {
      const current = ensureColor(toLch(color));

      return toInternalRgbColor({
        mode: "lch",
        l: key === "l" ? clamp(value, 0, 100) : (current.l ?? 0),
        c: key === "c" ? clamp(value, 0, 150) : (current.c ?? 0),
        h: key === "h" ? normalizeHue(value) : (current.h ?? 0),
        alpha: key === "alpha" ? clamp(value, 0, 1) : color.alpha,
      });
    }
    case "oklch": {
      const current = ensureColor(toOklch(color));

      return toInternalRgbColor({
        mode: "oklch",
        l: key === "l" ? clamp(value / 100, 0, 1) : (current.l ?? 0),
        c: key === "c" ? clamp(value, 0, 0.4) : (current.c ?? 0),
        h: key === "h" ? normalizeHue(value) : (current.h ?? 0),
        alpha: key === "alpha" ? clamp(value, 0, 1) : color.alpha,
      });
    }
  }
}

/**
 * 当前颜色的主预览文本。
 */
export function getPrimaryPreviewValue(color: InternalRgbColor) {
  return formatColorByMode("oklch", color);
}

/**
 * 将颜色整理成用于渲染卡片的 UI 数据。
 */
export function createFormatCardData(
  color: InternalRgbColor,
): ColorFormatCardData[] {
  const hslColor = ensureColor(toHsl(color));
  const hwbColor = ensureColor(toHwb(color));
  const labColor = ensureColor(toLab(color));
  const lchColor = ensureColor(toLch(color));
  const oklchColor = ensureColor(toOklch(color));

  return [
    {
      mode: "hex",
      title: "HEXA",
      description: "适合 CSS 变量、设计标注和短文本复制。",
      placeholder: "#7C3AEDCC",
      formattedValue: formatColorByMode("hex", color),
      copyValue: formatColorByMode("hex", color),
      channels: [
        {
          key: "r",
          label: "R",
          min: 0,
          max: 255,
          step: 1,
          value: toRgb255(color.r),
        },
        {
          key: "g",
          label: "G",
          min: 0,
          max: 255,
          step: 1,
          value: toRgb255(color.g),
        },
        {
          key: "b",
          label: "B",
          min: 0,
          max: 255,
          step: 1,
          value: toRgb255(color.b),
        },
        {
          key: "alpha",
          label: "Alpha",
          min: 0,
          max: 1,
          step: 0.001,
          value: color.alpha,
        },
      ],
    },
    {
      mode: "rgba",
      title: "RGBA",
      description: "适合前端样式调试和浏览器开发者工具联调。",
      placeholder: "rgba(124, 58, 237, 0.82)",
      formattedValue: formatColorByMode("rgba", color),
      copyValue: formatColorByMode("rgba", color),
      channels: [
        {
          key: "r",
          label: "R",
          min: 0,
          max: 255,
          step: 1,
          value: toRgb255(color.r),
        },
        {
          key: "g",
          label: "G",
          min: 0,
          max: 255,
          step: 1,
          value: toRgb255(color.g),
        },
        {
          key: "b",
          label: "B",
          min: 0,
          max: 255,
          step: 1,
          value: toRgb255(color.b),
        },
        {
          key: "alpha",
          label: "Alpha",
          min: 0,
          max: 1,
          step: 0.001,
          value: color.alpha,
        },
      ],
    },
    {
      mode: "hsla",
      title: "HSLA",
      description: "适合围绕色相、饱和度和明度做视觉微调。",
      placeholder: "hsl(270 83.9% 58.8% / 0.82)",
      formattedValue: formatColorByMode("hsla", color),
      copyValue: formatColorByMode("hsla", color),
      channels: [
        {
          key: "h",
          label: "Hue",
          min: 0,
          max: 360,
          step: 0.1,
          value: normalizeHue(hslColor.h ?? 0),
        },
        {
          key: "s",
          label: "Saturation",
          min: 0,
          max: 100,
          step: 0.1,
          value: round((hslColor.s ?? 0) * 100, 1),
          unit: "%",
        },
        {
          key: "l",
          label: "Lightness",
          min: 0,
          max: 100,
          step: 0.1,
          value: round((hslColor.l ?? 0) * 100, 1),
          unit: "%",
        },
        {
          key: "alpha",
          label: "Alpha",
          min: 0,
          max: 1,
          step: 0.001,
          value: color.alpha,
        },
      ],
    },
    {
      mode: "hwb",
      title: "HWB",
      description: "适合基于白度和黑度快速拉近目标颜色。",
      placeholder: "hwb(270 22.7% 7.1% / 0.82)",
      formattedValue: formatColorByMode("hwb", color),
      copyValue: formatColorByMode("hwb", color),
      channels: [
        {
          key: "h",
          label: "Hue",
          min: 0,
          max: 360,
          step: 0.1,
          value: normalizeHue(hwbColor.h ?? 0),
        },
        {
          key: "w",
          label: "Whiteness",
          min: 0,
          max: 100,
          step: 0.1,
          value: round((hwbColor.w ?? 0) * 100, 1),
          unit: "%",
        },
        {
          key: "b",
          label: "Blackness",
          min: 0,
          max: 100,
          step: 0.1,
          value: round((hwbColor.b ?? 0) * 100, 1),
          unit: "%",
        },
        {
          key: "alpha",
          label: "Alpha",
          min: 0,
          max: 1,
          step: 0.001,
          value: color.alpha,
        },
      ],
    },
    {
      mode: "lab",
      title: "Lab",
      description: "适合做接近人眼感知的明度与色轴调整。",
      placeholder: "lab(41.8% 59.3 -74.1 / 0.82)",
      formattedValue: formatColorByMode("lab", color),
      copyValue: formatColorByMode("lab", color),
      channels: [
        {
          key: "l",
          label: "L",
          min: 0,
          max: 100,
          step: 0.1,
          value: round(labColor.l ?? 0, 1),
          unit: "%",
        },
        {
          key: "a",
          label: "a",
          min: -125,
          max: 125,
          step: 0.1,
          value: round(labColor.a ?? 0, 1),
        },
        {
          key: "b",
          label: "b",
          min: -125,
          max: 125,
          step: 0.1,
          value: round(labColor.b ?? 0, 1),
        },
        {
          key: "alpha",
          label: "Alpha",
          min: 0,
          max: 1,
          step: 0.001,
          value: color.alpha,
        },
      ],
    },
    {
      mode: "lch",
      title: "LCH",
      description: "适合在感知亮度基础上使用色度与色相调色。",
      placeholder: "lch(41.8% 95.4 308.7 / 0.82)",
      formattedValue: formatColorByMode("lch", color),
      copyValue: formatColorByMode("lch", color),
      channels: [
        {
          key: "l",
          label: "L",
          min: 0,
          max: 100,
          step: 0.1,
          value: round(lchColor.l ?? 0, 1),
          unit: "%",
        },
        {
          key: "c",
          label: "Chroma",
          min: 0,
          max: 150,
          step: 0.1,
          value: round(lchColor.c ?? 0, 1),
        },
        {
          key: "h",
          label: "Hue",
          min: 0,
          max: 360,
          step: 0.1,
          value: normalizeHue(lchColor.h ?? 0),
        },
        {
          key: "alpha",
          label: "Alpha",
          min: 0,
          max: 1,
          step: 0.001,
          value: color.alpha,
        },
      ],
    },
    {
      mode: "oklch",
      title: "OKLCH",
      description: "适合现代设计系统和跨主题颜色调优。",
      placeholder: "oklch(68% 0.22 285 / 0.82)",
      formattedValue: formatColorByMode("oklch", color),
      copyValue: formatColorByMode("oklch", color),
      channels: [
        {
          key: "l",
          label: "L",
          min: 0,
          max: 100,
          step: 0.1,
          value: round((oklchColor.l ?? 0) * 100, 1),
          unit: "%",
        },
        {
          key: "c",
          label: "Chroma",
          min: 0,
          max: 0.4,
          step: 0.001,
          value: round(oklchColor.c ?? 0, 3),
        },
        {
          key: "h",
          label: "Hue",
          min: 0,
          max: 360,
          step: 0.1,
          value: normalizeHue(oklchColor.h ?? 0),
        },
        {
          key: "alpha",
          label: "Alpha",
          min: 0,
          max: 1,
          step: 0.001,
          value: color.alpha,
        },
      ],
    },
  ];
}

/**
 * 颜色输入解析失败时的提示文案。
 */
export function getModeErrorMessage(mode: ColorFormatMode) {
  switch (mode) {
    case "hex":
      return "请输入合法的 HEXA，例如 #7C3AEDCC。";
    case "rgba":
      return "请输入合法的 RGBA，例如 rgba(124, 58, 237, 0.82)。";
    case "hsla":
      return "请输入合法的 HSLA，例如 hsl(270 83.9% 58.8% / 0.82)。";
    case "hwb":
      return "请输入合法的 HWB，例如 hwb(270 22.7% 7.1% / 0.82)。";
    case "lab":
      return "请输入合法的 lab()，例如 lab(41.8% 59.3 -74.1 / 0.82)。";
    case "lch":
      return "请输入合法的 lch()，例如 lch(41.8% 95.4 308.7 / 0.82)。";
    case "oklch":
      return "请输入合法的 oklch()，例如 oklch(68% 0.22 285 / 0.82)。";
  }
}
