import { XMLBuilder, XMLParser, XMLValidator } from "fast-xml-parser";
import YAML from "yaml";

import type {
  CodeGenOptions,
  DataFormat,
  FormatOption,
  OutputFormat,
  TransformResult,
  XmlOptions,
} from "./type";

/**
 * 左侧输入区的数据类型选项。
 */
export const DATA_FORMAT_OPTIONS: FormatOption<DataFormat>[] = [
  { value: "json", label: "JSON" },
  { value: "yaml", label: "YAML" },
  { value: "xml", label: "XML" },
];

/**
 * 右侧结果区的全部输出类型选项。
 */
export const OUTPUT_FORMAT_OPTIONS: FormatOption<OutputFormat>[] = [
  { value: "json", label: "JSON" },
  { value: "yaml", label: "YAML" },
  { value: "xml", label: "XML" },
  { value: "typescript", label: "TypeScript" },
  { value: "zod", label: "Zod" },
  { value: "java", label: "Java" },
  { value: "go", label: "Go" },
  { value: "c", label: "C" },
];

const DEFAULT_ROOT_NAME = "RootModel";

export const DEFAULT_XML_OPTIONS: XmlOptions = {
  attributePrefix: "@",
  textNodeName: "#text",
  forceArrayForTags: false,
};

export const DEFAULT_CODE_GEN_OPTIONS: CodeGenOptions = {
  typescript: {
    declarationStyle: "interface",
  },
  zod: {
    includeInferType: true,
  },
  go: {
    includeJsonTag: true,
  },
};

/**
 * 结构推断后的属性定义。
 */
type SchemaProperty = {
  name: string;
  schema: SchemaNode;
  optional: boolean;
};

/**
 * 用于代码生成的简化结构描述。
 */
type SchemaNode =
  | { kind: "string" }
  | { kind: "number" }
  | { kind: "boolean" }
  | { kind: "null" }
  | { kind: "unknown" }
  | { kind: "array"; items: SchemaNode }
  | { kind: "object"; properties: Record<string, SchemaProperty> }
  | { kind: "union"; variants: SchemaNode[] };

function createSuccess(value: string): TransformResult {
  return {
    ok: true,
    value,
  };
}

function createFailure(error: string): TransformResult {
  return {
    ok: false,
    error,
  };
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function uniqueVariants(variants: SchemaNode[]) {
  const map = new Map<string, SchemaNode>();

  variants.forEach((item) => {
    map.set(JSON.stringify(item), item);
  });

  return [...map.values()];
}

function mergeSchema(first: SchemaNode, second: SchemaNode): SchemaNode {
  if (JSON.stringify(first) === JSON.stringify(second)) {
    return first;
  }

  if (first.kind === "array" && second.kind === "array") {
    return {
      kind: "array",
      items: mergeSchema(first.items, second.items),
    };
  }

  if (first.kind === "object" && second.kind === "object") {
    const allKeys = new Set([
      ...Object.keys(first.properties),
      ...Object.keys(second.properties),
    ]);
    const properties: Record<string, SchemaProperty> = {};

    allKeys.forEach((key) => {
      const firstProperty = first.properties[key];
      const secondProperty = second.properties[key];

      if (firstProperty && secondProperty) {
        properties[key] = {
          name: key,
          optional: firstProperty.optional || secondProperty.optional,
          schema: mergeSchema(firstProperty.schema, secondProperty.schema),
        };
        return;
      }

      const existingProperty = firstProperty ?? secondProperty;

      if (!existingProperty) {
        return;
      }

      properties[key] = {
        ...existingProperty,
        optional: true,
      };
    });

    return {
      kind: "object",
      properties,
    };
  }

  const variants = uniqueVariants(
    first.kind === "union" ? [...first.variants] : [first],
  );
  const mergedVariants = uniqueVariants(
    second.kind === "union"
      ? [...variants, ...second.variants]
      : [...variants, second],
  );

  return {
    kind: "union",
    variants: mergedVariants,
  };
}

function inferSchema(value: unknown): SchemaNode {
  if (value === null) {
    return { kind: "null" };
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return {
        kind: "array",
        items: { kind: "unknown" },
      };
    }

    return {
      kind: "array",
      items: value
        .map((item) => inferSchema(item))
        .reduce((previous, current) => mergeSchema(previous, current)),
    };
  }

  if (isPlainObject(value)) {
    const properties = Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [
        key,
        {
          name: key,
          optional: false,
          schema: inferSchema(nestedValue),
        },
      ]),
    );

    return {
      kind: "object",
      properties,
    };
  }

  switch (typeof value) {
    case "string":
      return { kind: "string" };
    case "number":
      return { kind: "number" };
    case "boolean":
      return { kind: "boolean" };
    default:
      return { kind: "unknown" };
  }
}

function toWords(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function toPascalCase(value: string) {
  const words = toWords(value);

  if (words.length === 0) {
    return DEFAULT_ROOT_NAME;
  }

  return words
    .map((item) => item[0].toUpperCase() + item.slice(1).toLowerCase())
    .join("");
}

function toCamelCase(value: string) {
  const pascalName = toPascalCase(value);
  return pascalName[0].toLowerCase() + pascalName.slice(1);
}

function safeRootName(value: string) {
  return toPascalCase(value || DEFAULT_ROOT_NAME);
}

function isValidIdentifier(value: string) {
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(value);
}

function quoteObjectKeyIfNeeded(value: string) {
  return isValidIdentifier(value) ? value : JSON.stringify(value);
}

function normalizePrimitiveText(value: string) {
  return value.replace(/\r\n/g, "\n").trim();
}

function createXmlParser(xmlOptions: XmlOptions) {
  return new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: xmlOptions.attributePrefix,
    textNodeName: xmlOptions.textNodeName,
    parseAttributeValue: true,
    parseTagValue: true,
    trimValues: false,
    isArray: () => xmlOptions.forceArrayForTags,
  });
}

function createXmlBuilder(xmlOptions: XmlOptions, pretty: boolean) {
  return new XMLBuilder({
    format: pretty,
    indentBy: "  ",
    ignoreAttributes: false,
    attributeNamePrefix: xmlOptions.attributePrefix,
    textNodeName: xmlOptions.textNodeName,
    suppressEmptyNode: false,
  });
}

function parseJsonText(value: string) {
  return JSON.parse(value);
}

function parseYamlText(value: string) {
  return YAML.parse(value);
}

function parseXmlText(value: string, xmlOptions: XmlOptions) {
  const validateResult = XMLValidator.validate(value);

  if (validateResult !== true) {
    const errorMessage =
      typeof validateResult === "object" && "err" in validateResult
        ? `${validateResult.err.msg} (line ${validateResult.err.line})`
        : "XML 解析失败";
    throw new Error(errorMessage);
  }

  return createXmlParser(xmlOptions).parse(value);
}

function wrapXmlRoot(value: unknown, rootName: string) {
  if (isPlainObject(value) && Object.keys(value).length === 1) {
    return value;
  }

  return {
    [toCamelCase(rootName)]: value,
  };
}

function toDataValue(
  format: DataFormat,
  value: string,
  xmlOptions: XmlOptions,
) {
  switch (format) {
    case "json":
      return parseJsonText(value);
    case "yaml":
      return parseYamlText(value);
    case "xml":
      return parseXmlText(value, xmlOptions);
  }
}

function formatJsonText(value: string) {
  return JSON.stringify(parseJsonText(value), null, 2);
}

function formatYamlText(value: string) {
  return YAML.stringify(parseYamlText(value), {
    indent: 2,
    lineWidth: 0,
  });
}

function formatXmlText(value: string, xmlOptions: XmlOptions) {
  return createXmlBuilder(xmlOptions, true).build(
    parseXmlText(value, xmlOptions),
  );
}

function buildDataOutput(
  value: unknown,
  format: DataFormat,
  rootName: string,
  xmlOptions: XmlOptions,
  pretty = true,
) {
  switch (format) {
    case "json":
      return JSON.stringify(value, null, pretty ? 2 : 0);
    case "yaml":
      return YAML.stringify(value, {
        indent: 2,
        lineWidth: 0,
      });
    case "xml":
      return createXmlBuilder(xmlOptions, pretty).build(
        wrapXmlRoot(value, rootName),
      );
  }
}

function getTsTypeText(node: SchemaNode, indentLevel: number): string {
  const indent = "  ".repeat(indentLevel);
  const nextIndent = "  ".repeat(indentLevel + 1);

  switch (node.kind) {
    case "string":
      return "string";
    case "number":
      return "number";
    case "boolean":
      return "boolean";
    case "null":
      return "null";
    case "unknown":
      return "unknown";
    case "array": {
      const itemText = getTsTypeText(node.items, indentLevel);
      return /^(string|number|boolean|null|unknown)$/.test(itemText)
        ? `${itemText}[]`
        : `Array<${itemText}>`;
    }
    case "union":
      return node.variants
        .map((item) => getTsTypeText(item, indentLevel))
        .join(" | ");
    case "object": {
      const lines = Object.values(node.properties).map((property) => {
        const keyText = quoteObjectKeyIfNeeded(property.name);
        return `${nextIndent}${keyText}${property.optional ? "?" : ""}: ${getTsTypeText(property.schema, indentLevel + 1)};`;
      });

      if (lines.length === 0) {
        return "{\n" + `${nextIndent}[key: string]: unknown;` + `\n${indent}}`;
      }

      return `{\n${lines.join("\n")}\n${indent}}`;
    }
  }
}

function generateTypeScript(
  value: unknown,
  rootName: string,
  codeGenOptions: CodeGenOptions,
) {
  const schema = inferSchema(value);
  const safeName = safeRootName(rootName);

  if (
    schema.kind === "object" &&
    codeGenOptions.typescript.declarationStyle === "interface"
  ) {
    return `export interface ${safeName} ${getTsTypeText(schema, 0)}`;
  }

  return `export type ${safeName} = ${getTsTypeText(schema, 0)};`;
}

function getZodTypeText(node: SchemaNode, indentLevel: number): string {
  const indent = "  ".repeat(indentLevel);
  const nextIndent = "  ".repeat(indentLevel + 1);

  switch (node.kind) {
    case "string":
      return "z.string()";
    case "number":
      return "z.number()";
    case "boolean":
      return "z.boolean()";
    case "null":
      return "z.null()";
    case "unknown":
      return "z.unknown()";
    case "array":
      return `z.array(${getZodTypeText(node.items, indentLevel)})`;
    case "union":
      return `z.union([${node.variants
        .map((item) => getZodTypeText(item, indentLevel))
        .join(", ")}])`;
    case "object": {
      const lines = Object.values(node.properties).map((property) => {
        const keyText = quoteObjectKeyIfNeeded(property.name);
        const baseType = getZodTypeText(property.schema, indentLevel + 1);
        const propertyType = property.optional
          ? `${baseType}.optional()`
          : baseType;
        return `${nextIndent}${keyText}: ${propertyType},`;
      });

      if (lines.length === 0) {
        return "z.object({})";
      }

      return `z.object({\n${lines.join("\n")}\n${indent}})`;
    }
  }
}

function generateZod(
  value: unknown,
  rootName: string,
  codeGenOptions: CodeGenOptions,
) {
  const safeName = safeRootName(rootName);
  const schema = inferSchema(value);

  const lines = [
    'import { z } from "zod";',
    "",
    `export const ${safeName}Schema = ${getZodTypeText(schema, 0)};`,
  ];

  if (codeGenOptions.zod.includeInferType) {
    lines.push(
      "",
      `export type ${safeName} = z.infer<typeof ${safeName}Schema>;`,
    );
  }

  return lines.join("\n");
}

function getJavaType(
  node: SchemaNode,
  name: string,
  blocks: string[],
  imports: Set<string>,
): string {
  switch (node.kind) {
    case "string":
      return "String";
    case "number":
      return "Double";
    case "boolean":
      return "Boolean";
    case "array":
      imports.add("import java.util.List;");
      return `List<${getJavaType(node.items, `${name}Item`, blocks, imports)}>`;
    case "object": {
      const typeName = safeRootName(name);
      blocks.push(createJavaClass(node, typeName, blocks, imports));
      return typeName;
    }
    default:
      return "Object";
  }
}

function createJavaClass(
  node: Extract<SchemaNode, { kind: "object" }>,
  className: string,
  blocks: string[],
  imports: Set<string>,
): string {
  const fields = Object.values(node.properties).map((property) => {
    const fieldType = getJavaType(
      property.schema,
      `${className}${toPascalCase(property.name)}`,
      blocks,
      imports,
    );
    return `  public ${fieldType} ${toCamelCase(property.name)};`;
  });

  return `public class ${className} {\n${fields.length > 0 ? fields.join("\n") : "  // empty"}\n}`;
}

function generateJava(value: unknown, rootName: string): string {
  const schema = inferSchema(value);
  const safeName = safeRootName(rootName);
  const blocks: string[] = [];
  const imports = new Set<string>();

  if (schema.kind === "object") {
    blocks.push(createJavaClass(schema, safeName, blocks, imports));
  } else {
    const typeText = getJavaType(schema, `${safeName}Value`, blocks, imports);
    blocks.unshift(
      `public class ${safeName} {\n  public ${typeText} value;\n}`,
    );
  }

  return [...imports].sort().join("\n")
    ? `${[...imports].sort().join("\n")}\n\n${uniqueBlocks(blocks).join("\n\n")}`
    : uniqueBlocks(blocks).join("\n\n");
}

function getGoType(
  node: SchemaNode,
  name: string,
  blocks: string[],
  codeGenOptions: CodeGenOptions,
): string {
  switch (node.kind) {
    case "string":
      return "string";
    case "number":
      return "float64";
    case "boolean":
      return "bool";
    case "array":
      return `[]${getGoType(node.items, `${name}Item`, blocks, codeGenOptions)}`;
    case "object": {
      const typeName = safeRootName(name);
      blocks.push(createGoStruct(node, typeName, blocks, codeGenOptions));
      return typeName;
    }
    default:
      return "interface{}";
  }
}

function createGoStruct(
  node: Extract<SchemaNode, { kind: "object" }>,
  structName: string,
  blocks: string[],
  codeGenOptions: CodeGenOptions,
): string {
  const fields = Object.values(node.properties).map((property) => {
    const fieldType = getGoType(
      property.schema,
      `${structName}${toPascalCase(property.name)}`,
      blocks,
      codeGenOptions,
    );
    const tag = property.optional
      ? `json:"${property.name},omitempty"`
      : `json:"${property.name}"`;
    const tagText = codeGenOptions.go.includeJsonTag ? ` \`${tag}\`` : "";
    return `  ${safeRootName(property.name)} ${fieldType}${tagText}`;
  });

  return `type ${structName} struct {\n${fields.length > 0 ? fields.join("\n") : "  // empty"}\n}`;
}

function generateGo(
  value: unknown,
  rootName: string,
  codeGenOptions: CodeGenOptions,
): string {
  const schema = inferSchema(value);
  const safeName = safeRootName(rootName);
  const blocks: string[] = [];

  if (schema.kind === "object") {
    blocks.push(createGoStruct(schema, safeName, blocks, codeGenOptions));
  } else {
    const valueType = getGoType(
      schema,
      `${safeName}Value`,
      blocks,
      codeGenOptions,
    );
    const tagText = codeGenOptions.go.includeJsonTag ? ' `json:"value"`' : "";
    blocks.unshift(
      `type ${safeName} struct {\n  Value ${valueType}${tagText}\n}`,
    );
  }

  return `package model\n\n${uniqueBlocks(blocks).join("\n\n")}`;
}

function getCType(
  node: SchemaNode,
  name: string,
  blocks: string[],
  flags: Set<string>,
): string {
  switch (node.kind) {
    case "string":
      return "char*";
    case "number":
      return "double";
    case "boolean":
      flags.add("bool");
      return "bool";
    case "array":
      return "void*";
    case "object": {
      const typeName = safeRootName(name);
      blocks.push(createCStruct(node, typeName, blocks, flags));
      return `${typeName}*`;
    }
    default:
      return "void*";
  }
}

function createCStruct(
  node: Extract<SchemaNode, { kind: "object" }>,
  structName: string,
  blocks: string[],
  flags: Set<string>,
): string {
  const fields = Object.values(node.properties).map((property) => {
    const fieldName = isValidIdentifier(toCamelCase(property.name))
      ? toCamelCase(property.name)
      : `field_${toCamelCase(property.name)}`;
    const fieldType = getCType(
      property.schema,
      `${structName}${toPascalCase(property.name)}`,
      blocks,
      flags,
    );
    return `  ${fieldType} ${fieldName};`;
  });

  return `typedef struct ${structName} {\n${fields.length > 0 ? fields.join("\n") : "  void* value;"}\n} ${structName};`;
}

function generateC(value: unknown, rootName: string): string {
  const schema = inferSchema(value);
  const safeName = safeRootName(rootName);
  const blocks: string[] = [];
  const flags = new Set<string>();

  if (schema.kind === "object") {
    blocks.push(createCStruct(schema, safeName, blocks, flags));
  } else {
    const fieldType = getCType(schema, `${safeName}Value`, blocks, flags);
    blocks.unshift(
      `typedef struct ${safeName} {\n  ${fieldType} value;\n} ${safeName};`,
    );
  }

  const headers = [
    flags.has("bool") ? "#include <stdbool.h>" : "",
    "#include <stddef.h>",
  ].filter(Boolean);

  return `${headers.join("\n")}\n\n${uniqueBlocks(blocks).join("\n\n")}`;
}

function uniqueBlocks(blocks: string[]) {
  return [...new Set(blocks)];
}

function simpleFormatCode(value: string) {
  const lines = normalizePrimitiveText(value)
    .split("\n")
    .map((line) => line.trim())
    .filter((line, index, array) => !(line === "" && array[index - 1] === ""));

  let indentLevel = 0;

  return lines
    .map((line) => {
      const startsWithCloser = /^[}\])]/.test(line);
      const currentIndent = startsWithCloser
        ? Math.max(indentLevel - 1, 0)
        : indentLevel;
      const formattedLine = `${"  ".repeat(currentIndent)}${line}`;
      const openCount = (line.match(/(?:\{|\[)/g) ?? []).length;
      const closeCount = (line.match(/(?:\}|\])/g) ?? []).length;
      indentLevel = Math.max(currentIndent + openCount - closeCount, 0);
      return formattedLine;
    })
    .join("\n");
}

function buildCodeOutput(
  value: unknown,
  format: Exclude<OutputFormat, DataFormat>,
  rootName: string,
  codeGenOptions: CodeGenOptions,
) {
  switch (format) {
    case "typescript":
      return generateTypeScript(value, rootName, codeGenOptions);
    case "zod":
      return generateZod(value, rootName, codeGenOptions);
    case "java":
      return generateJava(value, rootName);
    case "go":
      return generateGo(value, rootName, codeGenOptions);
    case "c":
      return generateC(value, rootName);
  }
}

export function transformLeftToRight(params: {
  leftFormat: DataFormat;
  rightFormat: OutputFormat;
  leftValue: string;
  rootTypeName: string;
  xmlOptions: XmlOptions;
  codeGenOptions: CodeGenOptions;
}): TransformResult {
  const {
    leftFormat,
    rightFormat,
    leftValue,
    rootTypeName,
    xmlOptions,
    codeGenOptions,
  } = params;
  const trimmedValue = leftValue.trim();

  if (!trimmedValue) {
    return createSuccess("");
  }

  try {
    const parsedValue = toDataValue(leftFormat, leftValue, xmlOptions);

    if (
      rightFormat === "json" ||
      rightFormat === "yaml" ||
      rightFormat === "xml"
    ) {
      return createSuccess(
        buildDataOutput(parsedValue, rightFormat, rootTypeName, xmlOptions),
      );
    }

    return createSuccess(
      buildCodeOutput(parsedValue, rightFormat, rootTypeName, codeGenOptions),
    );
  } catch (error) {
    return createFailure(getErrorMessage(error, "转换失败"));
  }
}

export function formatValueByOutputFormat(
  format: OutputFormat,
  value: string,
  xmlOptions: XmlOptions = DEFAULT_XML_OPTIONS,
): TransformResult {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return createSuccess("");
  }

  try {
    switch (format) {
      case "json":
        return createSuccess(formatJsonText(value));
      case "yaml":
        return createSuccess(formatYamlText(value));
      case "xml":
        return createSuccess(formatXmlText(value, xmlOptions));
      case "typescript":
      case "zod":
      case "java":
      case "go":
      case "c":
        return createSuccess(simpleFormatCode(value));
    }
  } catch (error) {
    return createFailure(getErrorMessage(error, "格式化失败"));
  }
}

export function getMonacoLanguage(format: OutputFormat) {
  switch (format) {
    case "json":
      return "json";
    case "yaml":
      return "yaml";
    case "xml":
      return "xml";
    case "typescript":
    case "zod":
      return "typescript";
    case "java":
      return "java";
    case "go":
      return "go";
    case "c":
      return "cpp";
  }
}

export function getFormatExtension(format: OutputFormat) {
  switch (format) {
    case "json":
      return "json";
    case "yaml":
      return "yaml";
    case "xml":
      return "xml";
    case "typescript":
    case "zod":
      return "ts";
    case "java":
      return "java";
    case "go":
      return "go";
    case "c":
      return "h";
  }
}

export function createDownloadName(
  side: "left" | "right",
  format: OutputFormat,
) {
  const dateText = new Date().toISOString().replaceAll(":", "-");
  return `data-converter-${side}-${dateText}.${getFormatExtension(format)}`;
}

export async function readTextFile(file: File) {
  return file.text();
}

export function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  anchor.click();

  URL.revokeObjectURL(url);
}

export function detectDataFormatFromFileName(
  fileName: string,
): DataFormat | null {
  const lowerFileName = fileName.toLowerCase();

  if (lowerFileName.endsWith(".json")) {
    return "json";
  }

  if (lowerFileName.endsWith(".yaml") || lowerFileName.endsWith(".yml")) {
    return "yaml";
  }

  if (lowerFileName.endsWith(".xml")) {
    return "xml";
  }

  return null;
}

export function isDataFormat(format: OutputFormat): format is DataFormat {
  return format === "json" || format === "yaml" || format === "xml";
}

export function isCodeFormat(format: OutputFormat) {
  return !isDataFormat(format);
}
