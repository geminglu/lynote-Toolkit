"use client";

import { cn } from "@/lib/utils";
import { Button } from "lynote-ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "lynote-ui/card";
import { Input } from "lynote-ui/input";
import { Label } from "lynote-ui/label";
import { NativeSelect, NativeSelectOption } from "lynote-ui/native-select";
import { Switch } from "lynote-ui/switch";
import { Textarea } from "lynote-ui/textarea";
import type { FC } from "react";
import { useRef, useState } from "react";

import { useQrCodeToolContext } from "../hooks/useQrCodeToolContext";
import type { QrCodeToolConfig, QrContentType, WifiEncryption } from "../type";
import {
  MAX_LOGO_FILE_SIZE,
  MAX_PARSE_FILE_SIZE,
  QR_CONTENT_TYPE_OPTIONS,
  QR_CORNER_DOT_OPTIONS,
  QR_CORNER_SQUARE_OPTIONS,
  QR_DOT_STYLE_OPTIONS,
  QR_DOWNLOAD_FORMAT_OPTIONS,
  QR_ERROR_CORRECTION_OPTIONS,
  formatFileSize,
} from "../utils";

/**
 * 二维码工具配置面板。
 */
const ConfigPanel: FC = () => {
  const {
    config,
    logoState,
    parseLoading,
    updateConfig,
    switchMode,
    fillExample,
    resetToDefaults,
    setLogoFile,
    clearLogo,
    parseFile,
    parseClipboard,
    clearParseResult,
  } = useQrCodeToolContext();
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const parseInputRef = useRef<HTMLInputElement | null>(null);
  const [isParseDragOver, setIsParseDragOver] = useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle>二维码配置</CardTitle>
        <CardDescription>
          支持浏览器本地生成与解析二维码，Logo、透明背景和图片识别都在当前页面完成。
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="grid gap-3 md:grid-cols-2">
          <button
            className={cn(
              "rounded-xl border p-4 text-left transition-colors",
              config.mode === "generate"
                ? "border-primary bg-primary/5"
                : "hover:bg-muted/40",
            )}
            onClick={() => {
              switchMode("generate");
            }}
            type="button"
          >
            <div className="font-medium">生成二维码</div>
            <p className="mt-1 text-xs text-muted-foreground">
              配置内容类型、颜色、容错等级和 Logo 样式后立即预览。
            </p>
          </button>

          <button
            className={cn(
              "rounded-xl border p-4 text-left transition-colors",
              config.mode === "parse"
                ? "border-primary bg-primary/5"
                : "hover:bg-muted/40",
            )}
            onClick={() => {
              switchMode("parse");
            }}
            type="button"
          >
            <div className="font-medium">解析二维码</div>
            <p className="mt-1 text-xs text-muted-foreground">
              上传、拖拽或粘贴二维码图片，自动识别出结构化内容。
            </p>
          </button>
        </div>

        {config.mode === "generate" ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="qr-content-type">内容类型</Label>
              <NativeSelect
                id="qr-content-type"
                onChange={(event) => {
                  updateConfig(
                    "contentType",
                    event.target.value as QrContentType,
                  );
                }}
                value={config.contentType}
              >
                {QR_CONTENT_TYPE_OPTIONS.map((option) => (
                  <NativeSelectOption key={option.value} value={option.value}>
                    {option.label}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
              <p className="text-xs text-muted-foreground">
                {
                  QR_CONTENT_TYPE_OPTIONS.find(
                    (option) => option.value === config.contentType,
                  )?.description
                }
              </p>
            </div>

            {config.contentType === "text" && (
              <div className="space-y-2">
                <Label htmlFor="qr-text-value">文本内容</Label>
                <Textarea
                  className="min-h-[180px] font-mono text-xs"
                  id="qr-text-value"
                  onChange={(event) => {
                    updateConfig("textValue", event.target.value);
                  }}
                  placeholder="输入普通文本、备注、配置说明或任何想被扫码查看的内容。"
                  value={config.textValue}
                />
              </div>
            )}

            {config.contentType === "url" && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="qr-url-value">网址链接</Label>
                  <Input
                    id="qr-url-value"
                    onChange={(event) => {
                      updateConfig("urlValue", event.target.value);
                    }}
                    placeholder="例如 lynote.dev/docs 或 https://lynote.dev"
                    value={config.urlValue}
                  />
                </div>
                <div className="flex items-center justify-between rounded-xl border p-3">
                  <div className="space-y-1">
                    <div className="text-sm font-medium">自动补全协议</div>
                    <p className="text-xs text-muted-foreground">
                      输入 `lynote.dev` 时自动补成 `https://lynote.dev`。
                    </p>
                  </div>
                  <Switch
                    checked={config.autoPrependProtocol}
                    onCheckedChange={(checked) => {
                      updateConfig("autoPrependProtocol", checked);
                    }}
                  />
                </div>
              </div>
            )}

            {config.contentType === "wifi" && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="qr-wifi-ssid">Wi-Fi 名称（SSID）</Label>
                  <Input
                    id="qr-wifi-ssid"
                    onChange={(event) => {
                      updateConfig("wifiSsid", event.target.value);
                    }}
                    placeholder="例如 Lynote Guest WiFi"
                    value={config.wifiSsid}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="qr-wifi-encryption">加密方式</Label>
                  <NativeSelect
                    id="qr-wifi-encryption"
                    onChange={(event) => {
                      updateConfig(
                        "wifiEncryption",
                        event.target.value as WifiEncryption,
                      );
                    }}
                    value={config.wifiEncryption}
                  >
                    <NativeSelectOption value="WPA">
                      WPA / WPA2
                    </NativeSelectOption>
                    <NativeSelectOption value="WEP">WEP</NativeSelectOption>
                    <NativeSelectOption value="nopass">
                      无密码
                    </NativeSelectOption>
                  </NativeSelect>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="qr-wifi-password">Wi-Fi 密码</Label>
                  <Input
                    disabled={config.wifiEncryption === "nopass"}
                    id="qr-wifi-password"
                    onChange={(event) => {
                      updateConfig("wifiPassword", event.target.value);
                    }}
                    placeholder="无密码网络可留空"
                    value={config.wifiPassword}
                  />
                </div>
                <div className="flex items-center justify-between rounded-xl border p-3 md:col-span-2">
                  <div className="space-y-1">
                    <div className="text-sm font-medium">隐藏网络</div>
                    <p className="text-xs text-muted-foreground">
                      适合需要手动指定“隐藏 SSID”的网络环境。
                    </p>
                  </div>
                  <Switch
                    checked={config.wifiHidden}
                    onCheckedChange={(checked) => {
                      updateConfig("wifiHidden", checked);
                    }}
                  />
                </div>
              </div>
            )}

            {config.contentType === "phone" && (
              <div className="space-y-2">
                <Label htmlFor="qr-phone-number">电话号码</Label>
                <Input
                  id="qr-phone-number"
                  onChange={(event) => {
                    updateConfig("phoneNumber", event.target.value);
                  }}
                  placeholder="例如 +86 13800138000"
                  value={config.phoneNumber}
                />
              </div>
            )}

            {config.contentType === "sms" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="qr-sms-number">短信接收手机号</Label>
                  <Input
                    id="qr-sms-number"
                    onChange={(event) => {
                      updateConfig("smsNumber", event.target.value);
                    }}
                    placeholder="例如 +86 13800138000"
                    value={config.smsNumber}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="qr-sms-message">短信内容</Label>
                  <Textarea
                    className="min-h-[120px] font-mono text-xs"
                    id="qr-sms-message"
                    onChange={(event) => {
                      updateConfig("smsMessage", event.target.value);
                    }}
                    placeholder="扫码后希望自动带出的短信内容。"
                    value={config.smsMessage}
                  />
                </div>
              </div>
            )}

            {config.contentType === "email" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="qr-email-to">收件邮箱</Label>
                  <Input
                    id="qr-email-to"
                    onChange={(event) => {
                      updateConfig("emailTo", event.target.value);
                    }}
                    placeholder="例如 hello@example.com"
                    value={config.emailTo}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="qr-email-subject">邮件主题</Label>
                  <Input
                    id="qr-email-subject"
                    onChange={(event) => {
                      updateConfig("emailSubject", event.target.value);
                    }}
                    placeholder="例如 活动报名 / 工单咨询"
                    value={config.emailSubject}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="qr-email-body">邮件正文</Label>
                  <Textarea
                    className="min-h-[120px] font-mono text-xs"
                    id="qr-email-body"
                    onChange={(event) => {
                      updateConfig("emailBody", event.target.value);
                    }}
                    placeholder="扫码后自动填充到邮件正文中的内容。"
                    value={config.emailBody}
                  />
                </div>
              </div>
            )}

            <div className="rounded-xl border p-4">
              <div className="text-sm font-medium">样式设置</div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="qr-size">二维码尺寸（px）</Label>
                  <Input
                    id="qr-size"
                    max={1024}
                    min={160}
                    onChange={(event) => {
                      updateConfig("size", Number(event.target.value) || 320);
                    }}
                    type="number"
                    value={config.size}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="qr-margin">边距（px）</Label>
                  <Input
                    id="qr-margin"
                    max={64}
                    min={0}
                    onChange={(event) => {
                      updateConfig("margin", Number(event.target.value) || 0);
                    }}
                    type="number"
                    value={config.margin}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="qr-foreground">前景色</Label>
                  <Input
                    id="qr-foreground"
                    onChange={(event) => {
                      updateConfig("foregroundColor", event.target.value);
                    }}
                    type="color"
                    value={config.foregroundColor}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="qr-background">背景色</Label>
                  <Input
                    disabled={config.transparentBackground}
                    id="qr-background"
                    onChange={(event) => {
                      updateConfig("backgroundColor", event.target.value);
                    }}
                    type="color"
                    value={config.backgroundColor}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="qr-dot-style">主体样式</Label>
                  <NativeSelect
                    id="qr-dot-style"
                    onChange={(event) => {
                      updateConfig(
                        "dotStyle",
                        event.target.value as QrCodeToolConfig["dotStyle"],
                      );
                    }}
                    value={config.dotStyle}
                  >
                    {QR_DOT_STYLE_OPTIONS.map((option) => (
                      <NativeSelectOption
                        key={option.value}
                        value={option.value}
                      >
                        {option.label}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="qr-corner-square-style">定位角外框</Label>
                  <NativeSelect
                    id="qr-corner-square-style"
                    onChange={(event) => {
                      updateConfig(
                        "cornerSquareStyle",
                        event.target
                          .value as QrCodeToolConfig["cornerSquareStyle"],
                      );
                    }}
                    value={config.cornerSquareStyle}
                  >
                    {QR_CORNER_SQUARE_OPTIONS.map((option) => (
                      <NativeSelectOption
                        key={option.value}
                        value={option.value}
                      >
                        {option.label}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="qr-corner-dot-style">定位角内点</Label>
                  <NativeSelect
                    id="qr-corner-dot-style"
                    onChange={(event) => {
                      updateConfig(
                        "cornerDotStyle",
                        event.target
                          .value as QrCodeToolConfig["cornerDotStyle"],
                      );
                    }}
                    value={config.cornerDotStyle}
                  >
                    {QR_CORNER_DOT_OPTIONS.map((option) => (
                      <NativeSelectOption
                        key={option.value}
                        value={option.value}
                      >
                        {option.label}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="qr-error-correction">容错等级</Label>
                  <NativeSelect
                    id="qr-error-correction"
                    onChange={(event) => {
                      updateConfig(
                        "errorCorrectionLevel",
                        event.target
                          .value as QrCodeToolConfig["errorCorrectionLevel"],
                      );
                    }}
                    value={config.errorCorrectionLevel}
                  >
                    {QR_ERROR_CORRECTION_OPTIONS.map((option) => (
                      <NativeSelectOption
                        key={option.value}
                        value={option.value}
                      >
                        {option.label}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </div>
                <div className="flex items-center justify-between rounded-xl border p-3 md:col-span-2">
                  <div className="space-y-1">
                    <div className="text-sm font-medium">透明背景</div>
                    <p className="text-xs text-muted-foreground">
                      适合贴在海报或深浅主题页面上，但建议保证底色足够纯净。
                    </p>
                  </div>
                  <Switch
                    checked={config.transparentBackground}
                    onCheckedChange={(checked) => {
                      updateConfig("transparentBackground", checked);
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="rounded-xl border p-4">
              <div className="text-sm font-medium">Logo 与导出</div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label>中间图片 / Logo</Label>
                  <input
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    className="hidden"
                    onChange={(event) => {
                      void setLogoFile(event.target.files?.[0] ?? null);
                      event.target.value = "";
                    }}
                    ref={logoInputRef}
                    type="file"
                  />
                  <button
                    className="w-full rounded-xl border border-dashed p-4 text-left transition-colors hover:bg-muted/40"
                    onClick={() => {
                      logoInputRef.current?.click();
                    }}
                    type="button"
                  >
                    <div className="font-medium">
                      {logoState ? "更换 Logo" : "点击选择 Logo 图片"}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      支持 `PNG / JPG / WebP / SVG`，建议使用透明底品牌标。
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      大小建议不超过 {formatFileSize(MAX_LOGO_FILE_SIZE)}。
                    </p>
                    {logoState && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        当前文件：{logoState.name}（
                        {formatFileSize(logoState.size)}）
                      </p>
                    )}
                  </button>
                  {logoState && (
                    <Button onClick={clearLogo} type="button" variant="outline">
                      移除 Logo
                    </Button>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="qr-logo-scale">Logo 占比</Label>
                  <Input
                    id="qr-logo-scale"
                    max={0.4}
                    min={0.1}
                    onChange={(event) => {
                      updateConfig(
                        "logoScale",
                        Number(event.target.value) || 0.2,
                      );
                    }}
                    step={0.01}
                    type="number"
                    value={config.logoScale}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="qr-logo-margin">Logo 边距（px）</Label>
                  <Input
                    id="qr-logo-margin"
                    max={24}
                    min={0}
                    onChange={(event) => {
                      updateConfig(
                        "logoMargin",
                        Number(event.target.value) || 0,
                      );
                    }}
                    type="number"
                    value={config.logoMargin}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="qr-download-format">默认下载格式</Label>
                  <NativeSelect
                    id="qr-download-format"
                    onChange={(event) => {
                      updateConfig(
                        "downloadFormat",
                        event.target
                          .value as QrCodeToolConfig["downloadFormat"],
                      );
                    }}
                    value={config.downloadFormat}
                  >
                    {QR_DOWNLOAD_FORMAT_OPTIONS.map((option) => (
                      <NativeSelectOption
                        key={option.value}
                        value={option.value}
                      >
                        {option.label}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <input
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                void parseFile(event.target.files?.[0] ?? null);
                event.target.value = "";
              }}
              ref={parseInputRef}
              type="file"
            />
            <button
              className={cn(
                "flex w-full flex-col items-start gap-3 rounded-2xl border border-dashed p-5 text-left transition-colors",
                isParseDragOver
                  ? "border-primary bg-primary/5"
                  : "hover:bg-muted/40",
              )}
              onClick={() => {
                parseInputRef.current?.click();
              }}
              onDragLeave={() => {
                setIsParseDragOver(false);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                setIsParseDragOver(true);
              }}
              onDrop={(event) => {
                event.preventDefault();
                setIsParseDragOver(false);
                void parseFile(event.dataTransfer.files?.[0] ?? null);
              }}
              onPaste={(event) => {
                event.preventDefault();
                void parseClipboard(event);
              }}
              type="button"
            >
              <div className="font-medium">
                {parseLoading
                  ? "正在解析二维码..."
                  : "点击、拖拽或粘贴二维码图片"}
              </div>
              <p className="text-xs text-muted-foreground">
                支持 `PNG / JPG / WebP / GIF / SVG` 等常见图片格式。
              </p>
              <p className="text-xs text-muted-foreground">
                图片大小建议不超过 {formatFileSize(MAX_PARSE_FILE_SIZE)}。
              </p>
              <p className="text-xs text-muted-foreground">
                如果你刚复制了截图，可先点这个区域再按 `Cmd/Ctrl + V`。
              </p>
            </button>

            <div className="rounded-lg border border-dashed p-3 text-sm">
              <div className="font-medium">解析建议</div>
              <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                <li>优先上传原图或高清截图，避免二次压缩后的模糊图片。</li>
                <li>若二维码带有大 Logo 或背景图，建议保留完整边距再截图。</li>
                <li>
                  反色二维码也会尝试识别，但成功率取决于图片清晰度和对比度。
                </li>
              </ul>
            </div>
          </div>
        )}

        <div className="rounded-lg border border-dashed p-3 text-sm">
          <div className="font-medium">隐私说明</div>
          <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
            <li>
              二维码内容生成、样式渲染和图片解析都仅在当前浏览器页面执行。
            </li>
            <li>不会主动上传原始内容、Logo 图片或二维码截图到服务器。</li>
            <li>
              如果你主动下载图片或复制结果，后续数据将由浏览器和操作系统接管。
            </li>
          </ul>
        </div>
      </CardContent>

      <CardFooter className="flex flex-wrap gap-2">
        {config.mode === "generate" ? (
          <Button onClick={fillExample} type="button">
            填充示例
          </Button>
        ) : (
          <Button onClick={clearParseResult} type="button" variant="outline">
            清空解析结果
          </Button>
        )}
        <Button onClick={resetToDefaults} type="button" variant="outline">
          恢复默认配置
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ConfigPanel;
