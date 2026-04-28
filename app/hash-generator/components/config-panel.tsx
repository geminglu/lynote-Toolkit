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
import { Textarea } from "lynote-ui/textarea";
import type { FC } from "react";
import { useRef, useState } from "react";

import { useHashGeneratorContext } from "../hooks/useHashGeneratorContext";
import type {
  HashAlgorithm,
  HashEncoding,
  HashInputType,
  HashMode,
  HmacAlgorithm,
} from "../type";
import {
  HASH_ALGORITHM_OPTIONS,
  HASH_ENCODING_OPTIONS,
  HASH_INPUT_TYPE_OPTIONS,
  HASH_MODE_OPTIONS,
  HMAC_ALGORITHM_OPTIONS,
  MAX_FILE_SIZE_BYTES,
  formatFileSize,
} from "../utils";

const ConfigPanel: FC = () => {
  const {
    config,
    loading,
    result,
    updateMode,
    updateInputType,
    updateEncoding,
    toggleAlgorithm,
    updateText,
    updateExpectedHash,
    updateSecret,
    setSelectedFile,
    clearSelectedFile,
    resetToDefaults,
    clearResult,
    generate,
  } = useHashGeneratorContext();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle>生成配置</CardTitle>
        <CardDescription>
          支持文本和单文件输入，可在 Hash 与 HMAC
          模式间切换，并按当前输出格式进行校验比对。
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="hash-mode">计算模式</Label>
          <NativeSelect
            id="hash-mode"
            onChange={(event) => {
              updateMode(event.target.value as HashMode);
            }}
            value={config.mode}
          >
            {HASH_MODE_OPTIONS.map((option) => (
              <NativeSelectOption key={option.value} value={option.value}>
                {option.label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <p className="text-xs text-muted-foreground">
            {
              HASH_MODE_OPTIONS.find((option) => option.value === config.mode)
                ?.description
            }
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="hash-input-type">输入类型</Label>
          <NativeSelect
            id="hash-input-type"
            onChange={(event) => {
              updateInputType(event.target.value as HashInputType);
            }}
            value={config.inputType}
          >
            {HASH_INPUT_TYPE_OPTIONS.map((option) => (
              <NativeSelectOption key={option.value} value={option.value}>
                {option.label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <p className="text-xs text-muted-foreground">
            {
              HASH_INPUT_TYPE_OPTIONS.find(
                (option) => option.value === config.inputType,
              )?.description
            }
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="hash-encoding">输出格式</Label>
          <NativeSelect
            id="hash-encoding"
            onChange={(event) => {
              updateEncoding(event.target.value as HashEncoding);
            }}
            value={config.encoding}
          >
            {HASH_ENCODING_OPTIONS.map((option) => (
              <NativeSelectOption key={option.value} value={option.value}>
                {option.label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <Label>{config.mode === "hmac" ? "HMAC 算法" : "哈希算法"}</Label>
            <p className="text-xs text-muted-foreground">
              支持多选；
              {config.mode === "hmac"
                ? "`HMAC-MD5` 与 `HMAC-SHA1` 会标记为兼容算法。"
                : "`MD5` 与 `SHA-1` 会标记为兼容算法。"}
            </p>
          </div>

          <div className="grid gap-2 md:grid-cols-2">
            {(config.mode === "hmac"
              ? HMAC_ALGORITHM_OPTIONS
              : HASH_ALGORITHM_OPTIONS
            ).map((option) => {
              const checked = config.algorithms.includes(option.value);

              return (
                <button
                  className={cn(
                    "rounded-xl border bg-transparent p-3 text-left transition-colors",
                    checked ? "bg-primary/5" : "hover:bg-muted/50",
                  )}
                  key={option.value}
                  onClick={() => {
                    toggleAlgorithm(
                      option.value as HashAlgorithm | HmacAlgorithm,
                    );
                  }}
                  type="button"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-medium">{option.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {checked ? "已选择" : "点击选择"}
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {option.description}
                  </p>
                  {option.compatibility && (
                    <p className="mt-2 text-xs text-amber-600">兼容算法</p>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {config.mode === "hmac" && (
          <div className="space-y-2">
            <Label htmlFor="hmac-secret">HMAC Secret</Label>
            <Textarea
              className="min-h-[120px] font-mono text-xs"
              id="hmac-secret"
              onChange={(event) => {
                updateSecret(event.target.value);
              }}
              placeholder="输入用于 HMAC 的 Secret，当前按 UTF-8 文本处理。"
              value={config.secret}
            />
            <p className="text-xs text-muted-foreground">
              当前仅支持 `UTF-8` 文本 Secret。空格和换行也会参与计算。
            </p>
          </div>
        )}

        {config.inputType === "text" && (
          <div className="space-y-2">
            <Label htmlFor="hash-text-input">文本内容</Label>
            <Textarea
              className="min-h-[220px] font-mono text-xs"
              id="hash-text-input"
              onChange={(event) => {
                updateText(event.target.value);
              }}
              placeholder="输入需要计算哈希的文本内容。空字符串也可以正常生成哈希。"
              value={config.text}
            />
            <p className="text-xs text-muted-foreground">
              文本将按 `UTF-8` 编码处理。
            </p>
          </div>
        )}

        {config.inputType === "file" && (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>文件内容</Label>
              <input
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;

                  setSelectedFile(file);
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
                  setSelectedFile(event.dataTransfer.files?.[0] ?? null);
                }}
                type="button"
              >
                <div className="font-medium">
                  {config.file ? "更换文件" : "点击或拖拽文件到这里"}
                </div>
                <p className="text-xs text-muted-foreground">
                  当前仅支持单文件，大小不超过{" "}
                  {formatFileSize(MAX_FILE_SIZE_BYTES)}。
                </p>
                {config.file && (
                  <div className="rounded-lg bg-muted/60 px-3 py-2 text-xs">
                    <div>文件名：{config.file.name}</div>
                    <div>文件大小：{formatFileSize(config.file.size)}</div>
                    <div>文件类型：{config.file.type || "未知"}</div>
                  </div>
                )}
              </button>
            </div>

            {config.file && (
              <Button
                onClick={clearSelectedFile}
                type="button"
                variant="outline"
              >
                移除当前文件
              </Button>
            )}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="expected-hash">校验模式（可选）</Label>
          <Input
            id="expected-hash"
            onChange={(event) => {
              updateExpectedHash(event.target.value);
            }}
            placeholder="输入原哈希值，生成后将按当前输出格式逐项比对"
            value={config.expectedHash}
          />
          <p className="text-xs text-muted-foreground">
            比对时会使用当前输出格式；例如当前选择 `Base64`，就应输入对应的
            `Base64` 原哈希值。
          </p>
        </div>

        <div className="rounded-lg border border-dashed p-3 text-sm">
          <div className="font-medium">安全规则</div>
          <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
            <li>计算过程仅发生在当前浏览器页面内。</li>
            <li>不会上传服务器，也不会自动保存输入内容、Secret 与结果。</li>
            <li>复制或下载后的数据由浏览器和操作系统接管。</li>
          </ul>
        </div>
      </CardContent>

      <CardFooter className="flex flex-wrap gap-2">
        <Button
          disabled={loading}
          onClick={() => {
            void generate();
          }}
        >
          {loading ? "生成中..." : result ? "重新生成" : "生成"}
        </Button>
        <Button disabled={loading} onClick={resetToDefaults} variant="outline">
          恢复默认配置
        </Button>
        <Button disabled={loading} onClick={clearResult} variant="ghost">
          清空结果
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ConfigPanel;
