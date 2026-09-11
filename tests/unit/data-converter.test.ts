import { describe, expect, it } from "vitest";

import type { DataFormat, OutputFormat } from "@/app/data-converter/type";
import {
  DEFAULT_CODE_GEN_OPTIONS,
  DEFAULT_XML_OPTIONS,
  transformLeftToRight,
} from "@/app/data-converter/utils";

function transform(
  leftFormat: DataFormat,
  rightFormat: OutputFormat,
  leftValue: string,
  rootTypeName = "RootModel",
) {
  return transformLeftToRight({
    codeGenOptions: DEFAULT_CODE_GEN_OPTIONS,
    leftFormat,
    leftValue,
    rightFormat,
    rootTypeName,
    xmlOptions: DEFAULT_XML_OPTIONS,
  });
}

function expectValue(result: ReturnType<typeof transformLeftToRight>) {
  expect(result.ok).toBe(true);
  if (!result.ok) {
    throw new Error(result.error);
  }
  return result.value;
}

describe("data converter", () => {
  it.each(["json", "yaml", "xml"] as const)(
    "从 JSON 输出 %s 时保留 64 位整数",
    (format) => {
      const output = expectValue(
        transform("json", format, '{"id":9007199254740993}'),
      );

      expect(output).toContain("9007199254740993");
      expect(output).not.toContain("9007199254740992");
    },
  );

  it("从 YAML 输出 JSON 时保留 64 位整数", () => {
    const output = expectValue(
      transform("yaml", "json", "id: 9007199254740993\n"),
    );

    expect(output).toContain("9007199254740993");
  });

  it.each([
    ["9.007199254740993e15", "9.007199254740993e15"],
    ["0.123456789012345678901", "0.123456789012345678901"],
  ])("保留 YAML 数值 token %s", (input, expected) => {
    const output = expectValue(transform("yaml", "json", `value: ${input}\n`));

    expect(output).toContain(expected);
  });

  it.each(["yaml", "xml"] as const)(
    "从 YAML 输出 %s 时保留高精度数值 token",
    (format) => {
      const output = expectValue(
        transform(
          "yaml",
          format,
          "id: 9.007199254740993e15\nratio: 0.123456789012345678901\n",
        ),
      );

      expect(output).toContain("9.007199254740993e15");
      expect(output).toContain("0.123456789012345678901");
    },
  );

  it("保留 YAML 数值键且不泄露集合节点内部结构", () => {
    const output = expectValue(
      transform(
        "yaml",
        "json",
        "9.007199254740993e15: value\nordered: !!omap\n  - a: 1\n  - b: 2\n",
      ),
    );

    expect(output).toContain('"9.007199254740993e15"');
    expect(output).toContain('"ordered"');
    expect(output).not.toContain('"srcToken"');
  });

  it("把 YAML Set 转为保留成员的数组", () => {
    const output = expectValue(
      transform("yaml", "json", "values: !!set\n  ? x\n  ? y\n"),
    );

    expect(output).toContain('"values": [');
    expect(output).toContain('"x"');
    expect(output).toContain('"y"');
  });

  it("限制 YAML 别名展开规模", () => {
    const aliases = Array.from({ length: 10 }, () => "*a").join(", ");
    const nestedAliases = Array.from({ length: 10 }, () => "*b").join(", ");
    const result = transform(
      "yaml",
      "json",
      `a: &a [1, 2, 3]\nb: &b [${aliases}]\nc: [${nestedAliases}]\n`,
    );

    expect(result.ok).toBe(false);
  });

  it.each([
    ["+1", "1"],
    ["01", "1"],
    ["0xFF", "255"],
    [".5", "0.5"],
    ["1.", "1.0"],
    ["01.25", "1.25"],
    ["01e2", "1e2"],
  ])("将 YAML 数字 %s 规范化为合法 JSON %s", (input, expected) => {
    const output = expectValue(transform("yaml", "json", `value: ${input}\n`));

    expect(output).toContain(`\"value\": ${expected}`);
  });

  it("Java 根类名不会遮蔽生成器使用的集合类型", () => {
    const output = expectValue(
      transform("json", "java", '{"items":[1]}', "List"),
    );

    expect(output).toContain("public class List_");
    expect(output).toContain("List<Double> items");
  });

  it("C 字段来源注释不能被 JSON key 提前闭合", () => {
    const output = expectValue(
      transform("json", "c", '{"*/ int injected; /*":1}'),
    );

    expect(output).toContain('// JSON key: "*/ int injected; /*"');
    expect(output).not.toContain('/* JSON key: "*/');
  });

  it("Java 和 C 字段名避让字面量与 stdbool 宏", () => {
    const javaOutput = expectValue(
      transform("json", "java", '{"true":1,"false":2,"null":3}'),
    );
    const cOutput = expectValue(
      transform(
        "json",
        "c",
        '{"bool":1,"true":2,"false":3,"constexpr":4,"nullptr":5,"typeof":6,"flag":true}',
      ),
    );

    expect(javaOutput).toMatch(/true_;/);
    expect(javaOutput).toMatch(/false_;/);
    expect(javaOutput).toMatch(/null_;/);
    expect(cOutput).toMatch(/bool_;/);
    expect(cOutput).toMatch(/true_;/);
    expect(cOutput).toMatch(/false_;/);
    expect(cOutput).toMatch(/constexpr_;/);
    expect(cOutput).toMatch(/nullptr_;/);
    expect(cOutput).toMatch(/typeof_;/);
  });

  it("拒绝把非法 JSON 根键输出为 XML 标签", () => {
    const result = transform("json", "xml", '{"foo bar":1}');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("有效 XML");
    }
  });

  it("为 Java 标识符去重、规避保留字并生成单个 public 顶层类", () => {
    const output = expectValue(
      transform(
        "json",
        "java",
        '{"class":1,"first-name":2,"first_name":3,"user":{"id":4}}',
        "123",
      ),
    );

    expect(output).toContain("public class RootModel123");
    expect(output).toContain("class_");
    expect(output).toContain("firstName;");
    expect(output).toContain("firstName2;");
    expect(output).toContain("public static class");
    expect(output.match(/^public class /gm)).toHaveLength(1);
  });

  it("按目标语言安全类型承载超范围整数", () => {
    const source = '{"id":9007199254740993}';

    expect(expectValue(transform("json", "typescript", source))).toContain(
      "id: string",
    );
    expect(expectValue(transform("json", "java", source))).toContain(
      "BigInteger id",
    );
    expect(expectValue(transform("json", "go", source))).toContain(
      "json.Number",
    );
    expect(expectValue(transform("json", "c", source))).toContain("char* id");
  });
});
