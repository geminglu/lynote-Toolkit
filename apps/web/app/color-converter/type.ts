/**
 * 颜色格式模块标识。
 */
export type ColorFormatMode =
  | "hex"
  | "rgba"
  | "hsla"
  | "hwb"
  | "lab"
  | "lch"
  | "oklch";

/**
 * 工具内部统一维护的 RGBA 颜色状态。
 *
 * `culori` 的 `rgb` 通道使用 `0-1` 浮点数，因此这里沿用该表示。
 */
export type InternalRgbColor = {
  mode: "rgb";
  r: number;
  g: number;
  b: number;
  alpha: number;
};

/**
 * 单个通道的展示与编辑配置。
 */
export type ColorChannelDefinition = {
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  unit?: string;
};

/**
 * 单个颜色格式卡片的派生数据。
 */
export type ColorFormatCardData = {
  mode: ColorFormatMode;
  title: string;
  description: string;
  placeholder: string;
  formattedValue: string;
  copyValue: string;
  channels: ColorChannelDefinition[];
};
