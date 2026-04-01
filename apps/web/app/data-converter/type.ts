/**
 * 左侧主输入区支持的数据类型。
 */
export type DataFormat = "json" | "yaml" | "xml";

/**
 * 右侧预览区支持的代码类型。
 */
export type CodeFormat = "typescript" | "zod" | "java" | "go" | "c";

/**
 * 右侧可选的全部输出类型。
 */
export type OutputFormat = DataFormat | CodeFormat;

/**
 * 编辑器面板位置。
 */
export type EditorSide = "left" | "right";

/**
 * 下拉选项定义。
 */
export type FormatOption<T extends string> = {
  value: T;
  label: string;
};

/**
 * 转换结果。
 */
export type TransformResult =
  | {
      ok: true;
      value: string;
    }
  | {
      ok: false;
      error: string;
    };

/**
 * XML 解析与输出配置。
 */
export type XmlOptions = {
  attributePrefix: string;
  textNodeName: string;
  forceArrayForTags: boolean;
};

/**
 * TypeScript 代码生成配置。
 */
export type TypeScriptOptions = {
  declarationStyle: "interface" | "type";
};

/**
 * Zod 代码生成配置。
 */
export type ZodOptions = {
  includeInferType: boolean;
};

/**
 * Go 代码生成配置。
 */
export type GoOptions = {
  includeJsonTag: boolean;
};

/**
 * 代码生成选项集合。
 */
export type CodeGenOptions = {
  typescript: TypeScriptOptions;
  zod: ZodOptions;
  go: GoOptions;
};
