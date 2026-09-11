import { XMLBuilder, XMLParser, XMLValidator } from "fast-xml-parser";
import YAML, { parseDocument, visit, type ScalarTag } from "yaml";

import { createIdentifier, createUniqueIdentifier } from "@/lib/identifiers";
import {
  isUnsafeLosslessInteger,
  parseLosslessJson,
  serializeLosslessJson,
  type LosslessJsonValue,
} from "@/lib/lossless-json";

import type {
  CodeGenOptions,
  DataFormat,
  FormatOption,
  OutputFormat,
  TransformResult,
  XmlOptions,
} from "./type";

/** 左侧输入区的数据类型选项。 */
export const DATA_FORMAT_OPTIONS: FormatOption<DataFormat>[] = [
  { value: "json", label: "JSON" },
  { value: "yaml", label: "YAML" },
  { value: "xml", label: "XML" },
];

/** 右侧结果区的全部输出类型选项。 */
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
const JSON_NUMBER_PATTERN = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/;

const JAVA_RESERVED_WORDS = new Set([
  "abstract",
  "assert",
  "boolean",
  "break",
  "byte",
  "case",
  "catch",
  "char",
  "class",
  "const",
  "continue",
  "default",
  "do",
  "double",
  "else",
  "enum",
  "extends",
  "final",
  "finally",
  "float",
  "for",
  "goto",
  "if",
  "implements",
  "import",
  "instanceof",
  "int",
  "interface",
  "long",
  "native",
  "new",
  "package",
  "permits",
  "private",
  "protected",
  "public",
  "record",
  "return",
  "sealed",
  "short",
  "static",
  "strictfp",
  "super",
  "switch",
  "synchronized",
  "this",
  "throw",
  "throws",
  "transient",
  "try",
  "var",
  "void",
  "volatile",
  "while",
  "yield",
  "false",
  "null",
  "true",
]);

const GO_RESERVED_WORDS = new Set([
  "break",
  "case",
  "chan",
  "const",
  "continue",
  "default",
  "defer",
  "else",
  "fallthrough",
  "for",
  "func",
  "go",
  "goto",
  "if",
  "import",
  "interface",
  "map",
  "package",
  "range",
  "return",
  "select",
  "struct",
  "switch",
  "type",
  "var",
]);

const C_RESERVED_WORDS = new Set([
  "auto",
  "alignas",
  "alignof",
  "bool",
  "constexpr",
  "break",
  "case",
  "char",
  "const",
  "continue",
  "default",
  "do",
  "double",
  "else",
  "enum",
  "extern",
  "false",
  "float",
  "for",
  "goto",
  "if",
  "inline",
  "int",
  "long",
  "nullptr",
  "register",
  "restrict",
  "return",
  "short",
  "signed",
  "sizeof",
  "static",
  "struct",
  "switch",
  "static_assert",
  "typedef",
  "typeof",
  "union",
  "unsigned",
  "thread_local",
  "true",
  "void",
  "volatile",
  "while",
]);

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

interface SchemaProperty {
  name: string;
  schema: SchemaNode;
  optional: boolean;
}

type SchemaNode =
  | { kind: "string" }
  | { kind: "number"; unsafeInteger: boolean }
  | { kind: "boolean" }
  | { kind: "null" }
  | { kind: "unknown" }
  | { kind: "array"; items: SchemaNode }
  | { kind: "object"; properties: SchemaProperty[] }
  | { kind: "union"; variants: SchemaNode[] };

interface JavaGenerationContext {
  classNames: Set<string>;
  imports: Set<string>;
}

interface GoGenerationContext {
  blocks: string[];
  imports: Set<string>;
  typeNames: Set<string>;
}

interface CGenerationContext {
  blocks: string[];
  flags: Set<string>;
  typeNames: Set<string>;
}

class RawYamlNumber {
  constructor(
    readonly rawValue: string,
    readonly jsonValue: string,
  ) {}

  toString() {
    return this.rawValue;
  }
}

const RAW_YAML_NUMBER_TAG = {
  tag: "tag:yaml.org,2002:float",
  default: true,
  identify: (value) => value instanceof RawYamlNumber,
  resolve: (value) => new RawYamlNumber(value, value),
  stringify: ({ value }) => (value as RawYamlNumber).rawValue,
} satisfies ScalarTag;

function createSuccess(value: string): TransformResult {
  return { ok: true, value };
}

function createFailure(error: string): TransformResult {
  return { ok: false, error };
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
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
    // XML 文本没有数字类型；保留数字文本才能避免 64 位 ID 被隐式舍入。
    numberParseOptions: {
      eNotation: true,
      hex: true,
      leadingZeros: true,
      skipLike: /^[+-]?(?:\d|\.\d)/,
    },
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

function nativeValueToLossless(
  value: unknown,
  ancestors = new Set<object>(),
): LosslessJsonValue {
  if (value === null || typeof value === "undefined") {
    return { kind: "null" };
  }
  if (typeof value === "string") {
    return { kind: "string", value };
  }
  if (typeof value === "boolean") {
    return { kind: "boolean", value };
  }
  if (value instanceof RawYamlNumber) {
    return {
      kind: "number",
      rawValue: value.jsonValue,
      sourceValue: value.rawValue,
    };
  }
  if (typeof value === "bigint" || typeof value === "number") {
    return { kind: "number", rawValue: String(value) };
  }
  if (value instanceof Date) {
    return { kind: "string", value: value.toISOString() };
  }

  if (typeof value !== "object") {
    return { kind: "string", value: String(value) };
  }
  if (ancestors.has(value)) {
    throw new Error("数据包含循环引用，无法转换为树形结构");
  }

  const nextAncestors = new Set(ancestors).add(value);
  if (Array.isArray(value)) {
    return {
      kind: "array",
      items: value.map((item) => nativeValueToLossless(item, nextAncestors)),
    };
  }
  if (value instanceof Map) {
    return {
      kind: "object",
      entries: Array.from(value.entries(), ([key, nestedValue]) => [
        String(key),
        nativeValueToLossless(nestedValue, nextAncestors),
      ]),
    };
  }
  if (value instanceof Set) {
    return {
      kind: "array",
      items: Array.from(value, (item) =>
        nativeValueToLossless(item, nextAncestors),
      ),
    };
  }

  return {
    kind: "object",
    entries: Object.entries(value).map(([key, nestedValue]) => [
      key,
      nativeValueToLossless(nestedValue, nextAncestors),
    ]),
  };
}

function normalizeYamlNumber(rawValue: string, value: number | bigint) {
  if (typeof value === "bigint") {
    return String(value);
  }

  let normalized = rawValue.trim().replace(/^\+/, "");
  normalized = normalized.replace(/^(-?)\./, "$10.");
  normalized = normalized.replace(/\.(?=e|$)/i, ".0");
  normalized = normalized.replace(
    /^(-?)(\d+)(?=\.|e)/i,
    (_match, sign: string, integerPart: string) =>
      `${sign}${integerPart.replace(/^0+(?=\d)/, "")}`,
  );
  return normalized;
}

function parseYamlText(value: string) {
  const document = parseDocument(value, {
    intAsBigInt: true,
    keepSourceTokens: true,
  });

  if (document.errors.length > 0) {
    throw document.errors[0];
  }

  visit(document, {
    Scalar(_key, node) {
      if (typeof node.value !== "number" && typeof node.value !== "bigint") {
        return;
      }

      const sourceValue = node.source ?? String(node.value);
      node.value = new RawYamlNumber(
        sourceValue,
        normalizeYamlNumber(sourceValue, node.value),
      );
    },
  });

  return nativeValueToLossless(
    document.toJS({ mapAsMap: true, maxAliasCount: 100 }),
  );
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

  return nativeValueToLossless(createXmlParser(xmlOptions).parse(value));
}

function toDataValue(
  format: DataFormat,
  value: string,
  xmlOptions: XmlOptions,
) {
  switch (format) {
    case "json":
      return parseLosslessJson(value);
    case "yaml":
      return parseYamlText(value);
    case "xml":
      return parseXmlText(value, xmlOptions);
  }
}

function assertJsonCompatibleNumbers(value: LosslessJsonValue) {
  if (value.kind === "number" && !JSON_NUMBER_PATTERN.test(value.rawValue)) {
    throw new Error(`数字 ${value.rawValue} 无法表示为标准 JSON`);
  }
  if (value.kind === "array") {
    value.items.forEach(assertJsonCompatibleNumbers);
  }
  if (value.kind === "object") {
    value.entries.forEach(([, nestedValue]) =>
      assertJsonCompatibleNumbers(nestedValue),
    );
  }
}

function losslessValueToYaml(value: LosslessJsonValue): unknown {
  switch (value.kind) {
    case "null":
      return null;
    case "boolean":
    case "string":
      return value.value;
    case "number":
      return new RawYamlNumber(
        value.sourceValue ?? value.rawValue,
        value.rawValue,
      );
    case "array":
      return value.items.map(losslessValueToYaml);
    case "object":
      return new Map(
        value.entries.map(([key, nestedValue]) => [
          key,
          losslessValueToYaml(nestedValue),
        ]),
      );
  }
}

function losslessValueToXml(value: LosslessJsonValue): unknown {
  switch (value.kind) {
    case "null":
      return null;
    case "boolean":
    case "string":
      return value.value;
    case "number":
      return value.rawValue;
    case "array":
      return value.items.map(losslessValueToXml);
    case "object": {
      const result: Record<string, unknown> = Object.create(null) as Record<
        string,
        unknown
      >;
      value.entries.forEach(([key, nestedValue]) => {
        result[key] = losslessValueToXml(nestedValue);
      });
      return result;
    }
  }
}

function wrapXmlRoot(value: LosslessJsonValue, rootName: string) {
  if (value.kind === "object" && value.entries.length === 1) {
    return value;
  }

  return {
    kind: "object",
    entries: [
      [
        createIdentifier(rootName || DEFAULT_ROOT_NAME, {
          case: "camel",
          fallback: "root",
        }),
        value,
      ],
    ],
  } satisfies LosslessJsonValue;
}

function buildXmlOutput(
  value: LosslessJsonValue,
  rootName: string,
  xmlOptions: XmlOptions,
  pretty: boolean,
) {
  const output = createXmlBuilder(xmlOptions, pretty).build(
    losslessValueToXml(wrapXmlRoot(value, rootName)),
  );
  const validationResult = XMLValidator.validate(output);

  if (validationResult !== true) {
    const detail =
      typeof validationResult === "object" && "err" in validationResult
        ? validationResult.err.msg
        : "标签名称不合法";
    throw new Error(`无法生成有效 XML：${detail}`);
  }

  return output;
}

function buildDataOutput(
  value: LosslessJsonValue,
  format: DataFormat,
  rootName: string,
  xmlOptions: XmlOptions,
  pretty = true,
) {
  switch (format) {
    case "json":
      assertJsonCompatibleNumbers(value);
      return serializeLosslessJson(value, pretty ? 2 : 0);
    case "yaml":
      return YAML.stringify(losslessValueToYaml(value), {
        customTags: [RAW_YAML_NUMBER_TAG],
        indent: 2,
        lineWidth: 0,
      });
    case "xml":
      return buildXmlOutput(value, rootName, xmlOptions, pretty);
  }
}

function getSchemaSignature(schema: SchemaNode) {
  return JSON.stringify(schema);
}

function uniqueVariants(variants: SchemaNode[]) {
  const variantsBySignature = new Map<string, SchemaNode>();
  variants.forEach((variant) => {
    variantsBySignature.set(getSchemaSignature(variant), variant);
  });
  return [...variantsBySignature.values()];
}

function mergeSchema(first: SchemaNode, second: SchemaNode): SchemaNode {
  if (getSchemaSignature(first) === getSchemaSignature(second)) {
    return first;
  }
  if (first.kind === "array" && second.kind === "array") {
    return { kind: "array", items: mergeSchema(first.items, second.items) };
  }
  if (first.kind === "object" && second.kind === "object") {
    const firstProperties = new Map(
      first.properties.map((property) => [property.name, property]),
    );
    const secondProperties = new Map(
      second.properties.map((property) => [property.name, property]),
    );
    const propertyNames = new Set([
      ...firstProperties.keys(),
      ...secondProperties.keys(),
    ]);

    return {
      kind: "object",
      properties: Array.from(propertyNames, (name) => {
        const firstProperty = firstProperties.get(name);
        const secondProperty = secondProperties.get(name);
        if (firstProperty && secondProperty) {
          return {
            name,
            optional: firstProperty.optional || secondProperty.optional,
            schema: mergeSchema(firstProperty.schema, secondProperty.schema),
          };
        }

        const property = firstProperty ?? secondProperty;
        if (!property) {
          throw new Error("结构属性合并失败");
        }
        return { ...property, optional: true };
      }),
    };
  }

  return {
    kind: "union",
    variants: uniqueVariants([
      ...(first.kind === "union" ? first.variants : [first]),
      ...(second.kind === "union" ? second.variants : [second]),
    ]),
  };
}

function inferSchema(value: LosslessJsonValue): SchemaNode {
  switch (value.kind) {
    case "null":
      return { kind: "null" };
    case "boolean":
      return { kind: "boolean" };
    case "string":
      return { kind: "string" };
    case "number":
      return {
        kind: "number",
        unsafeInteger: isUnsafeLosslessInteger(value.rawValue),
      };
    case "array":
      return {
        kind: "array",
        items:
          value.items.length === 0
            ? { kind: "unknown" }
            : value.items
                .map(inferSchema)
                .reduce((previous, current) => mergeSchema(previous, current)),
      };
    case "object": {
      const properties = new Map<string, SchemaProperty>();
      value.entries.forEach(([name, nestedValue]) => {
        properties.set(name, {
          name,
          optional: false,
          schema: inferSchema(nestedValue),
        });
      });
      return { kind: "object", properties: [...properties.values()] };
    }
  }
}

function containsUnsafeInteger(node: SchemaNode): boolean {
  switch (node.kind) {
    case "number":
      return node.unsafeInteger;
    case "array":
      return containsUnsafeInteger(node.items);
    case "object":
      return node.properties.some((property) =>
        containsUnsafeInteger(property.schema),
      );
    case "union":
      return node.variants.some(containsUnsafeInteger);
    default:
      return false;
  }
}

function createTypeName(value: string, usedIdentifiers?: Set<string>) {
  const options = { case: "pascal", fallback: DEFAULT_ROOT_NAME } as const;
  return usedIdentifiers
    ? createUniqueIdentifier(value, usedIdentifiers, options)
    : createIdentifier(value, options);
}

function isValidTypeScriptProperty(value: string) {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(value);
}

function quoteObjectKeyIfNeeded(value: string) {
  return isValidTypeScriptProperty(value) ? value : JSON.stringify(value);
}

function getTsTypeText(node: SchemaNode, indentLevel: number): string {
  const indent = "  ".repeat(indentLevel);
  const nextIndent = "  ".repeat(indentLevel + 1);

  switch (node.kind) {
    case "string":
      return "string";
    case "number":
      return node.unsafeInteger ? "string" : "number";
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
        .map((variant) => getTsTypeText(variant, indentLevel))
        .join(" | ");
    case "object": {
      const lines = node.properties.map((property) => {
        const keyText = quoteObjectKeyIfNeeded(property.name);
        return `${nextIndent}${keyText}${property.optional ? "?" : ""}: ${getTsTypeText(property.schema, indentLevel + 1)};`;
      });
      return lines.length === 0
        ? `{\n${nextIndent}[key: string]: unknown;\n${indent}}`
        : `{\n${lines.join("\n")}\n${indent}}`;
    }
  }
}

function generateTypeScript(
  value: LosslessJsonValue,
  rootName: string,
  codeGenOptions: CodeGenOptions,
) {
  const schema = inferSchema(value);
  const safeName = createTypeName(rootName || DEFAULT_ROOT_NAME);
  const declaration =
    schema.kind === "object" &&
    codeGenOptions.typescript.declarationStyle === "interface"
      ? `export interface ${safeName} ${getTsTypeText(schema, 0)}`
      : `export type ${safeName} = ${getTsTypeText(schema, 0)};`;

  return containsUnsafeInteger(schema)
    ? `// 超出安全整数范围的数字按字符串承载，请使用无损 JSON 解析器。\n${declaration}`
    : declaration;
}

function getZodTypeText(node: SchemaNode, indentLevel: number): string {
  const indent = "  ".repeat(indentLevel);
  const nextIndent = "  ".repeat(indentLevel + 1);

  switch (node.kind) {
    case "string":
      return "z.string()";
    case "number":
      return node.unsafeInteger ? "z.string()" : "z.number()";
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
        .map((variant) => getZodTypeText(variant, indentLevel))
        .join(", ")}])`;
    case "object": {
      const lines = node.properties.map((property) => {
        const baseType = getZodTypeText(property.schema, indentLevel + 1);
        return `${nextIndent}${quoteObjectKeyIfNeeded(property.name)}: ${property.optional ? `${baseType}.optional()` : baseType},`;
      });
      return lines.length === 0
        ? "z.object({})"
        : `z.object({\n${lines.join("\n")}\n${indent}})`;
    }
  }
}

function generateZod(
  value: LosslessJsonValue,
  rootName: string,
  codeGenOptions: CodeGenOptions,
) {
  const safeName = createTypeName(rootName || DEFAULT_ROOT_NAME);
  const schema = inferSchema(value);
  const lines = ['import { z } from "zod";', ""];

  if (containsUnsafeInteger(schema)) {
    lines.push(
      "// 超出安全整数范围的数字按字符串承载，请使用无损 JSON 解析器。",
    );
  }
  lines.push(`export const ${safeName}Schema = ${getZodTypeText(schema, 0)};`);
  if (codeGenOptions.zod.includeInferType) {
    lines.push(
      "",
      `export type ${safeName} = z.infer<typeof ${safeName}Schema>;`,
    );
  }

  return lines.join("\n");
}

function createSourceKeyComment(
  sourceName: string,
  identifier: string,
  indent: string,
  style: "line" | "block" = "line",
) {
  if (sourceName === identifier) {
    return "";
  }

  const content = `JSON key: ${JSON.stringify(sourceName)}`;
  return style === "line"
    ? `${indent}// ${content}\n`
    : `${indent}/* ${content} */\n`;
}

function getJavaType(
  node: SchemaNode,
  suggestedName: string,
  context: JavaGenerationContext,
  nestedClasses: string[],
  indentLevel: number,
): string {
  switch (node.kind) {
    case "string":
      return "String";
    case "number":
      if (node.unsafeInteger) {
        context.imports.add("import java.math.BigInteger;");
        return "BigInteger";
      }
      return "Double";
    case "boolean":
      return "Boolean";
    case "array":
      context.imports.add("import java.util.List;");
      return `List<${getJavaType(node.items, `${suggestedName}Item`, context, nestedClasses, indentLevel)}>`;
    case "object": {
      const typeName = createUniqueIdentifier(
        suggestedName,
        context.classNames,
        { case: "pascal", fallback: "NestedModel" },
      );
      nestedClasses.push(
        createJavaClass(node, typeName, context, indentLevel, false),
      );
      return typeName;
    }
    default:
      return "Object";
  }
}

function createJavaClass(
  node: Extract<SchemaNode, { kind: "object" }>,
  className: string,
  context: JavaGenerationContext,
  indentLevel: number,
  isRoot: boolean,
) {
  const indent = "  ".repeat(indentLevel);
  const memberIndent = "  ".repeat(indentLevel + 1);
  const fieldNames = new Set<string>();
  const nestedClasses: string[] = [];
  const fields = node.properties.map((property) => {
    const fieldName = createUniqueIdentifier(property.name, fieldNames, {
      case: "camel",
      fallback: "field",
      reservedWords: JAVA_RESERVED_WORDS,
    });
    const fieldType = getJavaType(
      property.schema,
      `${className}${createTypeName(property.name)}`,
      context,
      nestedClasses,
      indentLevel + 1,
    );
    return `${createSourceKeyComment(property.name, fieldName, memberIndent)}${memberIndent}public ${fieldType} ${fieldName};`;
  });
  const body = [
    fields.length > 0 ? fields.join("\n") : `${memberIndent}// empty`,
    ...nestedClasses,
  ].join("\n\n");

  return `${indent}${isRoot ? "public class" : "public static class"} ${className} {\n${body}\n${indent}}`;
}

function generateJava(value: LosslessJsonValue, rootName: string) {
  const inferredSchema = inferSchema(value);
  const rootSchema: Extract<SchemaNode, { kind: "object" }> =
    inferredSchema.kind === "object"
      ? inferredSchema
      : {
          kind: "object",
          properties: [
            { name: "value", optional: false, schema: inferredSchema },
          ],
        };
  const rootClassName = createIdentifier(rootName || DEFAULT_ROOT_NAME, {
    case: "pascal",
    fallback: DEFAULT_ROOT_NAME,
    reservedWords: new Set([
      "BigInteger",
      "Boolean",
      "Double",
      "List",
      "Object",
      "String",
    ]),
  });
  const context: JavaGenerationContext = {
    classNames: new Set([rootClassName]),
    imports: new Set(),
  };
  const rootClass = createJavaClass(
    rootSchema,
    rootClassName,
    context,
    0,
    true,
  );
  const imports = [...context.imports].sort().join("\n");

  return imports ? `${imports}\n\n${rootClass}` : rootClass;
}

function getGoType(
  node: SchemaNode,
  suggestedName: string,
  context: GoGenerationContext,
  codeGenOptions: CodeGenOptions,
): string {
  switch (node.kind) {
    case "string":
      return "string";
    case "number":
      if (node.unsafeInteger) {
        context.imports.add('import "encoding/json"');
        return "json.Number";
      }
      return "float64";
    case "boolean":
      return "bool";
    case "array":
      return `[]${getGoType(node.items, `${suggestedName}Item`, context, codeGenOptions)}`;
    case "object": {
      const typeName = createUniqueIdentifier(
        suggestedName,
        context.typeNames,
        { case: "pascal", fallback: "NestedModel" },
      );
      context.blocks.push(
        createGoStruct(node, typeName, context, codeGenOptions),
      );
      return typeName;
    }
    default:
      return "interface{}";
  }
}

function createGoTag(name: string, optional: boolean) {
  const tag = `json:${JSON.stringify(`${name}${optional ? ",omitempty" : ""}`)}`;
  return tag.includes("`") ? JSON.stringify(tag) : `\`${tag}\``;
}

function createGoStruct(
  node: Extract<SchemaNode, { kind: "object" }>,
  structName: string,
  context: GoGenerationContext,
  codeGenOptions: CodeGenOptions,
) {
  const fieldNames = new Set<string>();
  const fields = node.properties.map((property) => {
    const fieldName = createUniqueIdentifier(property.name, fieldNames, {
      case: "pascal",
      fallback: "Field",
      reservedWords: GO_RESERVED_WORDS,
    });
    const fieldType = getGoType(
      property.schema,
      `${structName}${createTypeName(property.name)}`,
      context,
      codeGenOptions,
    );
    const tag = codeGenOptions.go.includeJsonTag
      ? ` ${createGoTag(property.name, property.optional)}`
      : "";
    return `${createSourceKeyComment(property.name, fieldName, "")}  ${fieldName} ${fieldType}${tag}`;
  });

  return `type ${structName} struct {\n${fields.length > 0 ? fields.join("\n") : "  // empty"}\n}`;
}

function generateGo(
  value: LosslessJsonValue,
  rootName: string,
  codeGenOptions: CodeGenOptions,
) {
  const inferredSchema = inferSchema(value);
  const rootSchema: Extract<SchemaNode, { kind: "object" }> =
    inferredSchema.kind === "object"
      ? inferredSchema
      : {
          kind: "object",
          properties: [
            { name: "value", optional: false, schema: inferredSchema },
          ],
        };
  const rootTypeName = createTypeName(rootName || DEFAULT_ROOT_NAME);
  const context: GoGenerationContext = {
    blocks: [],
    imports: new Set(),
    typeNames: new Set([rootTypeName]),
  };
  context.blocks.push(
    createGoStruct(rootSchema, rootTypeName, context, codeGenOptions),
  );
  const imports = [...context.imports].sort().join("\n");

  return `package model\n${imports ? `\n${imports}\n` : ""}\n${context.blocks.join("\n\n")}`;
}

function getCType(
  node: SchemaNode,
  suggestedName: string,
  context: CGenerationContext,
): string {
  switch (node.kind) {
    case "string":
      return "char*";
    case "number":
      return node.unsafeInteger ? "char*" : "double";
    case "boolean":
      context.flags.add("bool");
      return "bool";
    case "array":
      return "void*";
    case "object": {
      const typeName = createUniqueIdentifier(
        suggestedName,
        context.typeNames,
        { case: "pascal", fallback: "NestedModel" },
      );
      context.blocks.push(createCStruct(node, typeName, context));
      return `${typeName}*`;
    }
    default:
      return "void*";
  }
}

function createCStruct(
  node: Extract<SchemaNode, { kind: "object" }>,
  structName: string,
  context: CGenerationContext,
) {
  const fieldNames = new Set<string>();
  const fields = node.properties.map((property) => {
    const fieldName = createUniqueIdentifier(property.name, fieldNames, {
      case: "camel",
      fallback: "field",
      reservedWords: C_RESERVED_WORDS,
    });
    const fieldType = getCType(
      property.schema,
      `${structName}${createTypeName(property.name)}`,
      context,
    );
    return `${createSourceKeyComment(property.name, fieldName, "  ")}  ${fieldType} ${fieldName};`;
  });

  return `typedef struct ${structName} {\n${fields.length > 0 ? fields.join("\n") : "  void* value;"}\n} ${structName};`;
}

function generateC(value: LosslessJsonValue, rootName: string) {
  const inferredSchema = inferSchema(value);
  const rootSchema: Extract<SchemaNode, { kind: "object" }> =
    inferredSchema.kind === "object"
      ? inferredSchema
      : {
          kind: "object",
          properties: [
            { name: "value", optional: false, schema: inferredSchema },
          ],
        };
  const rootTypeName = createTypeName(rootName || DEFAULT_ROOT_NAME);
  const context: CGenerationContext = {
    blocks: [],
    flags: new Set(),
    typeNames: new Set([rootTypeName]),
  };
  context.blocks.push(createCStruct(rootSchema, rootTypeName, context));
  const headers = [
    context.flags.has("bool") ? "#include <stdbool.h>" : "",
    "#include <stddef.h>",
  ].filter(Boolean);

  return `${headers.join("\n")}\n\n${context.blocks.join("\n\n")}`;
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
  value: LosslessJsonValue,
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

  if (!leftValue.trim()) {
    return createSuccess("");
  }

  try {
    const parsedValue = toDataValue(leftFormat, leftValue, xmlOptions);
    return createSuccess(
      rightFormat === "json" || rightFormat === "yaml" || rightFormat === "xml"
        ? buildDataOutput(parsedValue, rightFormat, rootTypeName, xmlOptions)
        : buildCodeOutput(
            parsedValue,
            rightFormat,
            rootTypeName,
            codeGenOptions,
          ),
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
  if (!value.trim()) {
    return createSuccess("");
  }

  try {
    switch (format) {
      case "json": {
        const parsedValue = parseLosslessJson(value);
        assertJsonCompatibleNumbers(parsedValue);
        return createSuccess(serializeLosslessJson(parsedValue, 2));
      }
      case "yaml":
        return createSuccess(
          buildDataOutput(
            parseYamlText(value),
            "yaml",
            DEFAULT_ROOT_NAME,
            xmlOptions,
          ),
        );
      case "xml":
        return createSuccess(
          buildXmlOutput(
            parseXmlText(value, xmlOptions),
            DEFAULT_ROOT_NAME,
            xmlOptions,
            true,
          ),
        );
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
