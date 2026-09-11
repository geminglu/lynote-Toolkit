import { describe, expect, it } from "vitest";

import {
  isUnsafeLosslessInteger,
  losslessJsonToNative,
  parseLosslessJson,
  serializeLosslessJson,
} from "@/lib/lossless-json";

describe("lossless JSON", () => {
  it("格式化时保留超范围整数的原始字面量", () => {
    const source = '{"id":9007199254740993,"scaled":9.007199254740993e15}';
    const parsed = parseLosslessJson(source);

    expect(serializeLosslessJson(parsed, 2)).toContain("9007199254740993");
    expect(serializeLosslessJson(parsed, 2)).toContain("9.007199254740993e15");
  });

  it("结构化视图只把不安全整数转换为字符串", () => {
    const parsed = parseLosslessJson(
      '{"safe":9007199254740991,"unsafe":9007199254740993,"ratio":1.25}',
    );
    const value = losslessJsonToNative(parsed) as Record<string, unknown>;

    expect(value.safe).toBe(9007199254740991);
    expect(value.unsafe).toBe("9007199254740993");
    expect(value.ratio).toBe(1.25);
    expect(isUnsafeLosslessInteger("9007199254740993")).toBe(true);
  });

  it("拒绝 JSON 数字后面的多余内容", () => {
    expect(() => parseLosslessJson("1x")).toThrow("存在多余内容");
  });

  it("判断巨大指数时不会展开数字字符串", () => {
    expect(isUnsafeLosslessInteger("1e500000000")).toBe(true);
  });
});
