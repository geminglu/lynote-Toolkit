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

import { useBarcodeToolContext } from "../hooks/useBarcodeToolContext";
import type { BarcodeSymbology, BarcodeToolConfig } from "../type";
import {
  BARCODE_DOWNLOAD_FORMAT_OPTIONS,
  BARCODE_ROTATE_OPTIONS,
  BARCODE_SYMBOLOGY_OPTIONS,
  BARCODE_TEXT_POSITION_OPTIONS,
  PARSE_FILE_SIZE_LIMIT,
  formatFileSize,
  getSymbologyMeta,
} from "../utils";

/**
 * 条形码工具的配置面板。
 */
const ConfigPanel: FC = () => {
  const {
    config,
    parseLoading,
    updateConfig,
    switchMode,
    switchSymbology,
    fillExample,
    resetToDefaults,
    parseFile,
    parseClipboard,
    clearParseResult,
  } = useBarcodeToolContext();
  const parseInputRef = useRef<HTMLInputElement | null>(null);
  const [isParseDragOver, setIsParseDragOver] = useState(false);

  const symbologyMeta = getSymbologyMeta(config.symbology);

  return (
    <Card>
      <CardHeader>
        <CardTitle>条形码配置</CardTitle>
        <CardDescription>
          浏览器本地完成条形码生成与图片解析，支持
          CODE128、EAN、UPC、ITF-14、DataMatrix、PDF417、Aztec 等常见码制。
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
            <div className="font-medium">生成条形码</div>
            <p className="mt-1 text-xs text-muted-foreground">
              选择码制、输入内容、调整样式后实时预览并导出。
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
            <div className="font-medium">解析条形码</div>
            <p className="mt-1 text-xs text-muted-foreground">
              上传、拖拽或粘贴条形码图片，自动识别码制和原始值。
            </p>
          </button>
        </div>

        {config.mode === "generate" ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="barcode-symbology">码制</Label>
              <NativeSelect
                id="barcode-symbology"
                onChange={(event) => {
                  switchSymbology(event.target.value as BarcodeSymbology);
                }}
                value={config.symbology}
              >
                {BARCODE_SYMBOLOGY_OPTIONS.map((option) => (
                  <NativeSelectOption key={option.value} value={option.value}>
                    {option.label}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
              <p className="text-xs text-muted-foreground">
                {symbologyMeta.description}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="barcode-text">内容</Label>
              <Textarea
                className="min-h-[120px] font-mono text-xs"
                id="barcode-text"
                onChange={(event) => {
                  updateConfig("text", event.target.value);
                }}
                placeholder={symbologyMeta.placeholder}
                value={config.text}
              />
              <p className="text-xs text-muted-foreground">
                EAN/UPC/ITF 等码制会自动计算校验位；其他码制按所选格式严格编码。
              </p>
            </div>

            <div className="rounded-xl border p-4">
              <div className="text-sm font-medium">渲染参数</div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="barcode-scale">缩放倍数</Label>
                  <Input
                    id="barcode-scale"
                    max={10}
                    min={1}
                    onChange={(event) => {
                      updateConfig("scale", Number(event.target.value) || 1);
                    }}
                    step={1}
                    type="number"
                    value={config.scale}
                  />
                </div>

                {symbologyMeta.linear && (
                  <div className="space-y-2">
                    <Label htmlFor="barcode-height">一维码高度</Label>
                    <Input
                      id="barcode-height"
                      max={50}
                      min={4}
                      onChange={(event) => {
                        updateConfig(
                          "height",
                          Number(event.target.value) || 10,
                        );
                      }}
                      step={1}
                      type="number"
                      value={config.height}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="barcode-padding">边距（px）</Label>
                  <Input
                    id="barcode-padding"
                    max={48}
                    min={0}
                    onChange={(event) => {
                      updateConfig("padding", Number(event.target.value) || 0);
                    }}
                    type="number"
                    value={config.padding}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="barcode-rotate">旋转方向</Label>
                  <NativeSelect
                    id="barcode-rotate"
                    onChange={(event) => {
                      updateConfig(
                        "rotate",
                        event.target.value as BarcodeToolConfig["rotate"],
                      );
                    }}
                    value={config.rotate}
                  >
                    {BARCODE_ROTATE_OPTIONS.map((option) => (
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
                  <Label htmlFor="barcode-foreground">前景色</Label>
                  <Input
                    id="barcode-foreground"
                    onChange={(event) => {
                      updateConfig("foregroundColor", event.target.value);
                    }}
                    type="color"
                    value={config.foregroundColor}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="barcode-background">背景色</Label>
                  <Input
                    disabled={config.transparentBackground}
                    id="barcode-background"
                    onChange={(event) => {
                      updateConfig("backgroundColor", event.target.value);
                    }}
                    type="color"
                    value={config.backgroundColor}
                  />
                </div>

                {symbologyMeta.linear && (
                  <>
                    <div className="flex items-center justify-between rounded-xl border p-3 md:col-span-2">
                      <div className="space-y-1">
                        <div className="text-sm font-medium">
                          显示人眼可读字
                        </div>
                        <p className="text-xs text-muted-foreground">
                          在条形码下方或上方展示原始内容文字。
                        </p>
                      </div>
                      <Switch
                        checked={config.includeText}
                        onCheckedChange={(checked) => {
                          updateConfig("includeText", checked);
                        }}
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="barcode-text-position">可读字位置</Label>
                      <NativeSelect
                        disabled={!config.includeText}
                        id="barcode-text-position"
                        onChange={(event) => {
                          updateConfig(
                            "textPosition",
                            event.target
                              .value as BarcodeToolConfig["textPosition"],
                          );
                        }}
                        value={config.textPosition}
                      >
                        {BARCODE_TEXT_POSITION_OPTIONS.map((option) => (
                          <NativeSelectOption
                            key={option.value}
                            value={option.value}
                          >
                            {option.label}
                          </NativeSelectOption>
                        ))}
                      </NativeSelect>
                    </div>
                  </>
                )}

                <div className="flex items-center justify-between rounded-xl border p-3 md:col-span-2">
                  <div className="space-y-1">
                    <div className="text-sm font-medium">透明背景</div>
                    <p className="text-xs text-muted-foreground">
                      导出时不绘制背景，适合贴在已有主题色或图片上。
                    </p>
                  </div>
                  <Switch
                    checked={config.transparentBackground}
                    onCheckedChange={(checked) => {
                      updateConfig("transparentBackground", checked);
                    }}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="barcode-download-format">默认下载格式</Label>
                  <NativeSelect
                    id="barcode-download-format"
                    onChange={(event) => {
                      updateConfig(
                        "downloadFormat",
                        event.target
                          .value as BarcodeToolConfig["downloadFormat"],
                      );
                    }}
                    value={config.downloadFormat}
                  >
                    {BARCODE_DOWNLOAD_FORMAT_OPTIONS.map((option) => (
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
                  ? "正在解析条形码..."
                  : "点击、拖拽或粘贴条形码图片"}
              </div>
              <p className="text-xs text-muted-foreground">
                支持 `PNG / JPG / WebP / GIF / SVG` 等常见图片格式。
              </p>
              <p className="text-xs text-muted-foreground">
                图片大小建议不超过 {formatFileSize(PARSE_FILE_SIZE_LIMIT)}。
              </p>
              <p className="text-xs text-muted-foreground">
                若你刚截图复制条形码，可点这个区域再按 `Cmd/Ctrl + V`。
              </p>
            </button>

            <div className="rounded-lg border border-dashed p-3 text-sm">
              <div className="font-medium">解析建议</div>
              <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                <li>优先上传原图或高清扫描，避免二次压缩后线宽丢失。</li>
                <li>
                  一维码请尽量保留两端的静区，DataMatrix/PDF417 注意完整方框。
                </li>
                <li>识别成功后右侧会显示码制类型与原始字符串。</li>
              </ul>
            </div>
          </div>
        )}

        <div className="rounded-lg border border-dashed p-3 text-sm">
          <div className="font-medium">隐私说明</div>
          <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
            <li>条形码生成与图片解析都仅在当前浏览器页面执行。</li>
            <li>不会主动上传原始内容、条形码图片或截图到服务器。</li>
            <li>下载图片或复制结果后，后续数据将由浏览器和操作系统接管。</li>
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
