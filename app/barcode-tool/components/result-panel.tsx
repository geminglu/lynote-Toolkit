"use client";

import { cn } from "@/lib/utils";
import { AlertTriangleIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "lynote-ui/alert";
import { Badge } from "lynote-ui/badge";
import { Button } from "lynote-ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "lynote-ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "lynote-ui/empty";
import { toast } from "lynote-ui/sonner";
import { Textarea } from "lynote-ui/textarea";
import Image from "next/image";
import type { FC } from "react";

import { useBarcodeToolContext } from "../hooks/useBarcodeToolContext";
import {
  createBarcodeFileName,
  dataUrlToBlob,
  downloadBlob,
  formatFileSize,
  getSymbologyMeta,
  svgStringToBlob,
} from "../utils";

function formatScannedAt(timestamp: number) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(timestamp);
}

/**
 * 条形码预览与结果面板。
 */
const ResultPanel: FC = () => {
  const {
    config,
    generateResult,
    generateError,
    parseResult,
    parseLoading,
    parseError,
    copyText,
  } = useBarcodeToolContext();

  const symbologyMeta = getSymbologyMeta(config.symbology);

  const handleDownloadImage = () => {
    if (!generateResult) {
      return;
    }

    const filename = `${createBarcodeFileName(config)}.${config.downloadFormat}`;

    if (config.downloadFormat === "svg") {
      downloadBlob(svgStringToBlob(generateResult.svgMarkup), filename);
    } else {
      downloadBlob(dataUrlToBlob(generateResult.pngDataUrl), filename);
    }

    toast.success(`条形码已下载为 ${config.downloadFormat.toUpperCase()}。`);
  };

  const handleCopyImage = async () => {
    if (!generateResult) {
      return;
    }

    if (!("ClipboardItem" in window) || !navigator.clipboard.write) {
      toast.error("当前浏览器不支持直接复制图片，请改用下载。");
      return;
    }

    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          "image/png": dataUrlToBlob(generateResult.pngDataUrl),
        }),
      ]);
      toast.success("条形码图片已复制到剪贴板。");
    } catch {
      toast.error("复制图片失败，请确认浏览器是否允许剪贴板图片写入。");
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>
          {config.mode === "generate" ? "条形码预览" : "解析结果"}
        </CardTitle>
        <CardDescription>
          {config.mode === "generate"
            ? "实时预览所选码制的渲染效果与提示，并支持下载图片或复制原始值。"
            : "展示条形码图片、识别出的码制和原始字符串，便于复核或继续处理。"}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {config.mode === "generate" ? (
          <>
            {generateError && (
              <Alert variant="destructive">
                <AlertTitle>暂时无法生成条形码</AlertTitle>
                <AlertDescription>{generateError}</AlertDescription>
              </Alert>
            )}

            {!generateError && !generateResult && (
              <Empty className="border border-dashed">
                <EmptyHeader>
                  <EmptyTitle>还没有可预览的条形码</EmptyTitle>
                  <EmptyDescription>
                    左侧选择码制并输入内容后，条形码会自动生成在这里。
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}

            {generateResult && (
              <div className="rounded-xl border p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="font-medium">当前条形码</div>
                      <Badge variant="secondary">{symbologyMeta.label}</Badge>
                      <Badge variant="outline">
                        {symbologyMeta.linear ? "一维码" : "二维码"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      内容长度 {generateResult.text.length}，输出尺寸{" "}
                      {generateResult.width} × {generateResult.height}。
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() => {
                        void handleCopyImage();
                      }}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      复制图片
                    </Button>
                    <Button
                      onClick={handleDownloadImage}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      下载图片
                    </Button>
                    <Button
                      onClick={() => {
                        void copyText(
                          generateResult.text,
                          "条形码原始内容已复制到剪贴板。",
                        );
                      }}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      复制原始内容
                    </Button>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
                  <div className="rounded-2xl border bg-muted/20 p-4">
                    <div className="text-sm font-medium">渲染预览</div>
                    <div
                      className={cn(
                        "mt-3 flex min-h-[240px] items-center justify-center rounded-2xl border p-4",
                        config.transparentBackground
                          ? "bg-[linear-gradient(45deg,#f3f4f6_25%,transparent_25%,transparent_75%,#f3f4f6_75%,#f3f4f6),linear-gradient(45deg,#f3f4f6_25%,transparent_25%,transparent_75%,#f3f4f6_75%,#f3f4f6)] bg-size-[24px_24px] bg-position-[0_0,12px_12px] dark:bg-[linear-gradient(45deg,#1f2937_25%,transparent_25%,transparent_75%,#1f2937_75%,#1f2937),linear-gradient(45deg,#1f2937_25%,transparent_25%,transparent_75%,#1f2937_75%,#1f2937)]"
                          : "",
                      )}
                    >
                      <Image
                        alt={`${symbologyMeta.label} 条形码预览`}
                        className="max-h-[320px] w-auto max-w-full object-contain"
                        height={generateResult.height}
                        src={generateResult.pngDataUrl}
                        unoptimized
                        width={generateResult.width}
                      />
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">
                      {config.transparentBackground
                        ? "当前预览使用棋盘格底板，方便观察透明背景效果。"
                        : "当前预览与下载样式保持一致。"}
                    </p>
                  </div>

                  <div className="space-y-4">
                    {generateResult.warnings.length > 0 && (
                      <Alert className="border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-50">
                        <AlertTriangleIcon />
                        <AlertTitle>可读性提示</AlertTitle>
                        <AlertDescription>
                          <ul>
                            {generateResult.warnings.map((warning) => (
                              <li key={warning}>{warning}</li>
                            ))}
                          </ul>
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="rounded-xl border p-4">
                      <div className="text-sm font-medium">基础信息</div>
                      <div className="mt-3 grid gap-3 text-sm md:grid-cols-2">
                        <div>
                          <div className="text-muted-foreground">码制</div>
                          <div>{symbologyMeta.label}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">缩放倍数</div>
                          <div>×{config.scale}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">图片格式</div>
                          <div>{config.downloadFormat.toUpperCase()}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">背景</div>
                          <div>
                            {config.transparentBackground
                              ? "透明"
                              : config.backgroundColor.toUpperCase()}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border p-4">
                      <div className="text-sm font-medium">原始编码内容</div>
                      <Textarea
                        className="mt-3 min-h-[120px] font-mono text-xs"
                        readOnly
                        value={generateResult.text}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {parseError && (
              <Alert variant="destructive">
                <AlertTitle>条形码解析失败</AlertTitle>
                <AlertDescription>{parseError}</AlertDescription>
              </Alert>
            )}

            {!parseResult && !parseLoading && !parseError && (
              <Empty className="border border-dashed">
                <EmptyHeader>
                  <EmptyTitle>还没有解析结果</EmptyTitle>
                  <EmptyDescription>
                    左侧上传或粘贴条形码图片后，这里会展示识别出的码制和内容。
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}

            {parseLoading && (
              <div className="rounded-lg border border-dashed p-6 text-sm">
                正在读取图片并尝试识别条形码，请稍候。
              </div>
            )}

            {parseResult && (
              <>
                <Alert>
                  <AlertTitle>识别完成</AlertTitle>
                  <AlertDescription>
                    已于 {formatScannedAt(parseResult.scannedAt)}{" "}
                    完成解析，识别码制为 “{parseResult.format}”。
                  </AlertDescription>
                </Alert>

                {parseResult.warnings.length > 0 && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
                    <div className="font-medium text-amber-800 dark:text-amber-200">
                      解析提示
                    </div>
                    <ul className="mt-2 space-y-1 text-xs text-amber-700 dark:text-amber-300">
                      {parseResult.warnings.map((warning) => (
                        <li key={warning}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="grid gap-4 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
                  <div className="rounded-xl border p-4">
                    <div className="text-sm font-medium">原图预览</div>
                    <div className="mt-3 rounded-2xl border bg-muted/20 p-3">
                      <Image
                        alt="条形码解析预览"
                        className="w-full rounded-xl object-contain"
                        height={parseResult.height}
                        src={parseResult.imageDataUrl}
                        unoptimized
                        width={parseResult.width}
                      />
                    </div>
                    <div className="mt-3 grid gap-2 text-sm">
                      <div>
                        <div className="text-muted-foreground">文件名</div>
                        <div className="break-all">{parseResult.imageName}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">图片大小</div>
                        <div>{formatFileSize(parseResult.imageSize)}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">解析尺寸</div>
                        <div>
                          {parseResult.width} × {parseResult.height}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-xl border p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="font-medium">识别码制</div>
                            <Badge variant="secondary">
                              {parseResult.format}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            ZXing 解析得到的标准码制名称，可作为联调和对账依据。
                          </p>
                        </div>
                        <Button
                          onClick={() => {
                            void copyText(
                              parseResult.rawValue,
                              "条形码原始内容已复制到剪贴板。",
                            );
                          }}
                          size="sm"
                          type="button"
                          variant="outline"
                        >
                          复制原始内容
                        </Button>
                      </div>
                    </div>

                    <div className="rounded-xl border p-4">
                      <div className="text-sm font-medium">原始编码内容</div>
                      <Textarea
                        className="mt-3 min-h-[180px] font-mono text-xs"
                        readOnly
                        value={parseResult.rawValue}
                      />
                    </div>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ResultPanel;
