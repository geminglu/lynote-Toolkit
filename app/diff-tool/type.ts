/**
 * Monaco DiffEditor 两侧模型标识。
 *
 * `original` 对应 DiffEditor 左侧的原始版本，`modified` 对应右侧的修改后版本。
 * 文件上传、复制、下载和内容更新都会用这个类型明确目标侧，避免在 UI 文案
 * 与 Monaco 内部 original / modified 命名之间产生混淆。
 */
export type DiffSide = "original" | "modified";

/**
 * 文本对比视图模式。
 *
 * `side-by-side` 使用左右并排视图，适合宽屏代码审查；`inline` 使用逐行视图，
 * 适合窄屏或希望按单列阅读差异的场景。
 */
export type DiffViewMode = "side-by-side" | "inline";

/**
 * Monaco 语言选择项。
 *
 * 该结构兼容 Monaco `languages.getLanguages()` 返回的信息，并额外保留扩展名列表。
 * 上传文件时会根据 `extensions` 自动推断语法高亮，手动切换高亮时使用 `value`
 * 作为 `setModelLanguage` 的 language id。
 */
export interface DiffLanguageOption {
  /**
   * Monaco language id，例如 `json`、`typescript`、`markdown`。
   */
  value: string;
  /**
   * 展示给用户的语言名称，优先来自 Monaco alias，缺失时回退到 language id。
   */
  label: string;
  /**
   * 可识别的文件扩展名列表，用于上传文件后的自动语言推断。
   */
  extensions: string[];
}

/**
 * 上传后的文件元信息。
 *
 * 只保存展示和下载相关的轻量信息，不保存 File 对象本身，避免把浏览器文件句柄
 * 长期留在 React 状态里。
 */
export interface DiffFileInfo {
  /**
   * 用户上传的原始文件名。
   */
  name: string;
  /**
   * 文件字节大小，用于 UI 展示和排查上传限制。
   */
  size: number;
  /**
   * 根据文件名识别出的 Monaco language id。
   */
  language: string;
}

/**
 * Monaco 差异统计。
 *
 * `changes` 统计 diff block 数量，`additions` 和 `deletions` 统计两侧变更行数。
 * 这些数值来自 Monaco `getLineChanges()`，用于工具栏展示和差异跳转状态。
 */
export interface DiffStats {
  /**
   * 差异块数量。
   */
  changes: number;
  /**
   * 修改后文本中新增或替换产生的行数。
   */
  additions: number;
  /**
   * 原始文本中删除或替换掉的行数。
   */
  deletions: number;
}
