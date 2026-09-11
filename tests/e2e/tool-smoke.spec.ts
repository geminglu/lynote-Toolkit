import { expect, test } from "@playwright/test";

const routes = [
  ["/base64-tool", "Base64 / Base64URL 编解码工具"],
  ["/barcode-tool", "条形码在线生成与解析工具"],
  ["/color-converter", "CSS 颜色转换工具"],
  ["/cron-tool", "Cron 表达式生成器"],
  ["/data-converter", "数据转换与代码生成工具"],
  ["/diff-tool", "文本对比工具"],
  ["/hash-generator", "哈希与 HMAC 工具"],
  ["/json-formatting", "JSON 格式化"],
  ["/jwt-debugger", "JWT 调试工具"],
  ["/key-generator", "密钥生成工具"],
  ["/qr-code-tool", "二维码在线生成与解析工具"],
  ["/rsa-tool", "RSA 工具箱"],
  ["/url-encoder", "URL 编码与解析工具"],
] as const;

test("静态导出的工具页可以完成客户端接管", async ({ page }) => {
  const runtimeErrors: string[] = [];
  const failedScripts: string[] = [];
  page.on("pageerror", (error) => runtimeErrors.push(error.message));
  page.on("response", (response) => {
    if (response.request().resourceType() === "script" && !response.ok()) {
      failedScripts.push(`${response.status()} ${response.url()}`);
    }
  });

  for (const [route, title] of routes) {
    await page.goto(`.${route}`);
    await expect(
      page
        .locator("main > header")
        .getByRole("heading", { level: 1, name: title }),
    ).toBeVisible();
    await expect(page.locator('main[data-client-ready="true"]')).toBeVisible();
    await expect(page.locator("body")).not.toContainText(
      "document is not defined",
    );
  }

  expect(runtimeErrors).toEqual([]);
  expect(failedScripts).toEqual([]);
});

test("条形码在客户端接管后生成默认预览", async ({ page }) => {
  await page.goto("./barcode-tool");

  await expect(page.getByAltText("CODE128 条形码预览")).toBeVisible();
  await expect(page.getByText("暂时无法生成条形码")).toHaveCount(0);
});

test("二维码超出容量时展示可恢复错误", async ({ page }) => {
  await page.goto("./qr-code-tool");
  await page.locator("#qr-content-type").selectOption("text");
  await page.locator("#qr-text-value").fill("a".repeat(2_000));

  await expect(page.getByText("暂时无法生成二维码")).toBeVisible();
  await expect(page.getByText(/超过所选容错等级的二维码容量/)).toBeVisible();

  await page.locator("#qr-text-value").fill("recovered");
  await expect(page.getByText("暂时无法生成二维码")).toHaveCount(0);
  await expect(page.getByText("当前二维码")).toBeVisible();
  await expect(page.getByTestId("qr-preview").locator("svg")).toBeVisible();
});

test("颜色格式卡片提供颜色和透明度控件", async ({ page }) => {
  await page.goto("./color-converter");
  await page.getByRole("button", { name: "打开颜色选择器" }).first().click();

  await expect(page.getByLabel(/基础色/).first()).toBeVisible();
  await expect(page.getByLabel(/透明度/).first()).toBeVisible();
});

test("移动端工作区不会产生页面级横向溢出", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith("mobile"));

  for (const route of ["/barcode-tool", "/qr-code-tool", "/color-converter"]) {
    await page.goto(`.${route}`);
    const dimensions = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));

    expect(dimensions.scrollWidth).toBeLessThanOrEqual(
      dimensions.clientWidth + 1,
    );
  }
});
