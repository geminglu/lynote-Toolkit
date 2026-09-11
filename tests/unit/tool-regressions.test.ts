import { createHmac } from "node:crypto";

import { describe, expect, it } from "vitest";

import {
  DEFAULT_BASE64_TOOL_CONFIG,
  generateBase64ToolResult,
} from "@/app/base64-tool/utils";
import {
  DEFAULT_JWT_DEBUGGER_CONFIG,
  executeJwtDebugger,
} from "@/app/jwt-debugger/utils";
import {
  DEFAULT_QR_CODE_TOOL_CONFIG,
  buildQrPayload,
} from "@/app/qr-code-tool/utils";
import {
  DEFAULT_URL_TOOL_CONFIG,
  executeUrlTool,
} from "@/app/url-encoder/utils";

function toBase64Url(value: string | Buffer) {
  return Buffer.from(value).toString("base64url");
}

describe("tool regressions", () => {
  it("Base64 逐行转换不会被附加文本预览阻断", () => {
    const result = generateBase64ToolResult({
      ...DEFAULT_BASE64_TOOL_CONFIG,
      input: "/w==",
      inputMode: "base64",
      lineByLine: true,
      outputMode: "hex",
    });

    expect(result.outputs.find((item) => item.id === "output-hex")?.value).toBe(
      "ff",
    );
    expect(result.outputs.some((item) => item.id === "output-text")).toBe(
      false,
    );
    expect(result.warnings.join("\n")).toContain("附加输出");
  });

  it("Wi-Fi 二维码保留密码首尾空格", () => {
    const payload = buildQrPayload({
      ...DEFAULT_QR_CODE_TOOL_CONFIG,
      contentType: "wifi",
      wifiPassword: " pass ",
    });

    expect(payload).toContain("P: pass ;");
  });

  it("Query JSON 保留 __proto__ 键及重复值", async () => {
    const result = await executeUrlTool({
      ...DEFAULT_URL_TOOL_CONFIG,
      input: "__proto__=x&__proto__=y",
      inputMode: "query-string",
      operation: "parse",
    });

    const parsed = JSON.parse(result.queryJsonText) as Record<string, unknown>;

    expect(Object.hasOwn(parsed, "__proto__")).toBe(true);
    expect(parsed.__proto__).toEqual(["x", "y"]);
    expect(result.queryJsonText).toContain('"__proto__"');
  });

  it("JWT 验签使用原始 Secret 并保留 Payload 大整数", async () => {
    const secret = " secret with spaces ";
    const header = '{"alg":"HS256","typ":"JWT"}';
    const payload = '{"sub":9007199254740993}';
    const signingInput = `${toBase64Url(header)}.${toBase64Url(payload)}`;
    const signature = createHmac("sha256", secret)
      .update(signingInput)
      .digest("base64url");

    const result = await executeJwtDebugger({
      ...DEFAULT_JWT_DEBUGGER_CONFIG,
      token: `${signingInput}.${signature}`,
      verificationEnabled: true,
      verificationKey: secret,
    });

    expect(result.verification.status).toBe("success");
    expect(result.payloadText).toContain("9007199254740993");
    expect(result.payload.sub).toBe("9007199254740993");
  });
});
