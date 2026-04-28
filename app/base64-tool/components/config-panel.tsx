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

import { useBase64ToolContext } from "../hooks/useBase64ToolContext";
import type {
  Base64TextDecoding,
  Base64ToolInputMode,
  Base64ToolOutputMode,
} from "../type";
import {
  BASE64_TEXT_DECODING_OPTIONS,
  BASE64_TOOL_INPUT_MODE_OPTIONS,
  BASE64_TOOL_OUTPUT_MODE_OPTIONS,
  formatFileSize,
  MAX_FILE_SIZE_BYTES,
} from "../utils";

const ConfigPanel: FC = () => {
  const {
    config,
    fileState,
    loading,
    updateInput,
    updateInputMode,
    updateOutputMode,
    updateTextDecoding,
    updateDataUrlMimeType,
    updateIgnoreWhitespace,
    updateAutoPad,
    updateKeepBase64UrlPadding,
    updateLineByLine,
    fillExample,
    clearInput,
    resetToDefaults,
    setSelectedFile,
    clearSelectedFile,
  } = useBase64ToolContext();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle>处理配置</CardTitle>
        <CardDescription>
          支持文本、Base64、Base64URL、JWT 片段、Data URL
          与文件输入，所有处理都在浏览器本地完成。
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="base64-input-mode">输入模式</Label>
            <NativeSelect
              id="base64-input-mode"
              onChange={(event) => {
                updateInputMode(event.target.value as Base64ToolInputMode);
              }}
              value={config.inputMode}
            >
              {BASE64_TOOL_INPUT_MODE_OPTIONS.map((option) => (
                <NativeSelectOption key={option.value} value={option.value}>
                  {option.label}
                </NativeSelectOption>
              ))}
            </NativeSelect>
            <p className="text-xs text-muted-foreground">
              {
                BASE64_TOOL_INPUT_MODE_OPTIONS.find(
                  (option) => option.value === config.inputMode,
                )?.description
              }
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="base64-output-mode">主输出模式</Label>
            <NativeSelect
              id="base64-output-mode"
              onChange={(event) => {
                updateOutputMode(event.target.value as Base64ToolOutputMode);
              }}
              value={config.outputMode}
            >
              {BASE64_TOOL_OUTPUT_MODE_OPTIONS.map((option) => (
                <NativeSelectOption key={option.value} value={option.value}>
                  {option.label}
                </NativeSelectOption>
              ))}
            </NativeSelect>
            <p className="text-xs text-muted-foreground">
              {
                BASE64_TOOL_OUTPUT_MODE_OPTIONS.find(
                  (option) => option.value === config.outputMode,
                )?.description
              }
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="base64-text-decoding">文本预览字符集</Label>
            <NativeSelect
              id="base64-text-decoding"
              onChange={(event) => {
                updateTextDecoding(event.target.value as Base64TextDecoding);
              }}
              value={config.textDecoding}
            >
              {BASE64_TEXT_DECODING_OPTIONS.map((option) => (
                <NativeSelectOption key={option.value} value={option.value}>
                  {option.label}
                </NativeSelectOption>
              ))}
            </NativeSelect>
            <p className="text-xs text-muted-foreground">
              文本输入当前始终按 `UTF-8`
              编码；这里用于控制字节解码后的文本视图。
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="base64-data-url-mime">Data URL MIME Type</Label>
            <Input
              id="base64-data-url-mime"
              onChange={(event) => {
                updateDataUrlMimeType(event.target.value);
              }}
              placeholder="例如 text/plain、application/json、image/png"
              value={config.dataUrlMimeType}
            />
            <p className="text-xs text-muted-foreground">
              当主输出或附加输出包含 `Data URL` 时，会优先使用当前 MIME 类型。
            </p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="flex items-center justify-between rounded-xl border p-3">
            <div className="space-y-1">
              <div className="text-sm font-medium">忽略空白字符</div>
              <p className="text-xs text-muted-foreground">
                解码 Base64、Base64URL 和 JWT 片段时自动移除空格与换行。
              </p>
            </div>
            <Switch
              checked={config.ignoreWhitespace}
              onCheckedChange={updateIgnoreWhitespace}
            />
          </div>

          <div className="flex items-center justify-between rounded-xl border p-3">
            <div className="space-y-1">
              <div className="text-sm font-medium">自动补齐补位</div>
              <p className="text-xs text-muted-foreground">
                对缺少 `=` 的 Base64 或 Base64URL 输入自动补齐长度。
              </p>
            </div>
            <Switch checked={config.autoPad} onCheckedChange={updateAutoPad} />
          </div>

          <div className="flex items-center justify-between rounded-xl border p-3">
            <div className="space-y-1">
              <div className="text-sm font-medium">Base64URL 保留补位</div>
              <p className="text-xs text-muted-foreground">
                开启后 Base64URL 输出仍会带 `=`，更适合兼容部分旧系统。
              </p>
            </div>
            <Switch
              checked={config.keepBase64UrlPadding}
              onCheckedChange={updateKeepBase64UrlPadding}
            />
          </div>

          <div className="flex items-center justify-between rounded-xl border p-3">
            <div className="space-y-1">
              <div className="text-sm font-medium">逐行处理</div>
              <p className="text-xs text-muted-foreground">
                适合批量转换一行一个值；文件与 Data URL 模式会自动禁用。
              </p>
            </div>
            <Switch
              checked={config.lineByLine}
              disabled={
                config.inputMode === "file" || config.inputMode === "data-url"
              }
              onCheckedChange={updateLineByLine}
            />
          </div>
        </div>

        {config.inputMode === "file" ? (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>文件内容</Label>
              <input
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;

                  void setSelectedFile(file);
                  event.target.value = "";
                }}
                ref={fileInputRef}
                type="file"
              />

              <button
                className={cn(
                  "flex w-full flex-col items-start gap-2 rounded-xl border border-dashed p-4 text-left transition-colors",
                  isDragOver
                    ? "border-primary bg-primary/5"
                    : "hover:bg-muted/40",
                )}
                onClick={() => {
                  fileInputRef.current?.click();
                }}
                onDragLeave={() => {
                  setIsDragOver(false);
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsDragOver(true);
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  setIsDragOver(false);
                  void setSelectedFile(event.dataTransfer.files?.[0] ?? null);
                }}
                type="button"
              >
                <div className="font-medium">
                  {fileState.file ? "更换文件" : "点击或拖拽文件到这里"}
                </div>
                <p className="text-xs text-muted-foreground">
                  当前仅支持单文件，大小不超过{" "}
                  {formatFileSize(MAX_FILE_SIZE_BYTES)}。
                </p>
                {fileState.file && (
                  <div className="rounded-lg bg-muted/60 px-3 py-2 text-xs">
                    <div>文件名：{fileState.file.name}</div>
                    <div>文件大小：{formatFileSize(fileState.file.size)}</div>
                    <div>文件类型：{fileState.file.type || "未知"}</div>
                  </div>
                )}
              </button>
            </div>

            {fileState.file && (
              <Button
                onClick={clearSelectedFile}
                type="button"
                variant="outline"
              >
                移除当前文件
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="base64-input-text">输入内容</Label>
            <Textarea
              className="min-h-[260px] font-mono text-xs"
              id="base64-input-text"
              onChange={(event) => {
                updateInput(event.target.value);
              }}
              placeholder={
                config.inputMode === "text"
                  ? "输入普通文本，将按 UTF-8 转成字节。"
                  : config.inputMode === "base64"
                    ? "输入标准 Base64，例如 SGVsbG8gV29ybGQ="
                    : config.inputMode === "base64url"
                      ? "输入 Base64URL，例如 SGVsbG8tV29ybGQ"
                      : config.inputMode === "jwt-segment"
                        ? "输入单个 JWT 片段，例如 eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
                        : "输入 Data URL，例如 data:text/plain;base64,SGVsbG8="
              }
              value={config.input}
            />
            <p className="text-xs text-muted-foreground">
              {config.lineByLine
                ? "已开启逐行处理模式：每一行会独立解析并输出对应结果。"
                : "输入变化后右侧会自动更新；当前结果只保留在本页面会话中。"}
            </p>
          </div>
        )}

        <div className="rounded-lg border border-dashed p-3 text-sm">
          <div className="font-medium">安全规则</div>
          <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
            <li>所有编码、解码和文件读取都仅发生在当前浏览器页面内。</li>
            <li>不会主动上传输入内容，也不会自动写入本地存储。</li>
            <li>如果你主动复制或下载，后续数据将由浏览器和操作系统接管。</li>
          </ul>
        </div>
      </CardContent>

      <CardFooter className="flex flex-wrap gap-2">
        <Button disabled={loading} onClick={fillExample} type="button">
          填充示例
        </Button>
        <Button onClick={clearInput} type="button" variant="outline">
          清空输入
        </Button>
        <Button onClick={resetToDefaults} type="button" variant="ghost">
          恢复默认配置
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ConfigPanel;
