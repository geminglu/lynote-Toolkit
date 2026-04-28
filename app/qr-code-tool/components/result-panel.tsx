"use client";

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
import QRCodeStyling from "qr-code-styling";
import type { FC } from "react";
import { useEffect, useMemo, useRef } from "react";

import { cn } from "@/lib/utils";
import Image from "next/image";

import { useQrCodeToolContext } from "../hooks/useQrCodeToolContext";
import {
  createImageMimeType,
  createQrFileName,
  createQrStylingOptions,
  downloadBlob,
  formatFileSize,
  getContentTypeLabel,
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
 * 二维码预览与结果面板。
 */
const ResultPanel: FC = () => {
  const {
    config,
    logoState,
    parseResult,
    parseLoading,
    parseError,
    generateResult,
    generateError,
    copyText,
  } = useQrCodeToolContext();
  const qrContainerRef = useRef<HTMLDivElement | null>(null);
  const qrInstanceRef = useRef<QRCodeStyling | null>(null);
  const previewOptions = useMemo(() => {
    if (!generateResult) {
      return null;
    }

    return createQrStylingOptions(config, generateResult.payload, logoState);
  }, [config, generateResult, logoState]);

  useEffect(() => {
    if (
      config.mode !== "generate" ||
      !previewOptions ||
      !qrContainerRef.current
    ) {
      return;
    }

    const container = qrContainerRef.current;

    if (!qrInstanceRef.current) {
      qrInstanceRef.current = new QRCodeStyling(previewOptions);
    } else {
      qrInstanceRef.current.update(previewOptions);
    }

    if (container.childElementCount === 0) {
      container.innerHTML = "";
      qrInstanceRef.current.append(container);
    }
  }, [config.mode, previewOptions]);

  const handleDownloadImage = async () => {
    if (!qrInstanceRef.current) {
      return;
    }

    const blob = await qrInstanceRef.current.getRawData(config.downloadFormat);

    if (!(blob instanceof Blob)) {
      toast.error("当前浏览器未返回可下载的二维码数据。");
      return;
    }

    downloadBlob(blob, `${createQrFileName(config)}.${config.downloadFormat}`);
    toast.success(`二维码已下载为 ${config.downloadFormat.toUpperCase()}。`);
  };

  const handleCopyImage = async () => {
    if (!qrInstanceRef.current) {
      return;
    }

    const blob = await qrInstanceRef.current.getRawData("png");

    if (!(blob instanceof Blob)) {
      toast.error("当前浏览器未返回可复制的二维码图片。");
      return;
    }

    if (!("ClipboardItem" in window) || !navigator.clipboard.write) {
      toast.error("当前浏览器不支持直接复制图片，请改用下载。");
      return;
    }

    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          [createImageMimeType("png")]: blob,
        }),
      ]);
      toast.success("二维码图片已复制到剪贴板。");
    } catch {
      toast.error("复制图片失败，请确认浏览器是否允许剪贴板图片写入。");
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>
          {config.mode === "generate" ? "二维码预览" : "解析结果"}
        </CardTitle>
        <CardDescription>
          {config.mode === "generate"
            ? "实时预览二维码、风险提示和结构化内容，并支持下载图片或复制原始值。"
            : "展示二维码图片、识别结果、结构化字段和可直接执行的快捷动作。"}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {config.mode === "generate" ? (
          <>
            {generateError && (
              <Alert variant="destructive">
                <AlertTitle>暂时无法生成二维码</AlertTitle>
                <AlertDescription>{generateError}</AlertDescription>
              </Alert>
            )}

            {!generateError && !generateResult && (
              <Empty className="border border-dashed">
                <EmptyHeader>
                  <EmptyTitle>还没有可预览的二维码</EmptyTitle>
                  <EmptyDescription>
                    左侧补全内容配置后，二维码会自动生成在这里。
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}

            {generateResult && (
              <>
                <div className="rounded-xl border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="font-medium">当前二维码</div>
                        <Badge variant="secondary">
                          {getContentTypeLabel(config.contentType)}
                        </Badge>
                        <Badge variant="outline">
                          容错 {config.errorCorrectionLevel}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        内容长度 {generateResult.payloadLength}，复杂度{" "}
                        {generateResult.estimatedComplexity}。
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
                        onClick={() => {
                          void handleDownloadImage();
                        }}
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        下载图片
                      </Button>
                      <Button
                        onClick={() => {
                          void copyText(
                            generateResult.payload,
                            "二维码原始内容已复制到剪贴板。",
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
                      <div className="text-sm font-medium">二维码预览</div>
                      <div
                        className={cn(
                          "mt-3 flex min-h-[360px] items-center justify-center rounded-2xl border p-4",
                          config.transparentBackground
                            ? "bg-[linear-gradient(45deg,#f3f4f6_25%,transparent_25%,transparent_75%,#f3f4f6_75%,#f3f4f6),linear-gradient(45deg,#f3f4f6_25%,transparent_25%,transparent_75%,#f3f4f6_75%,#f3f4f6)] bg-size-[24px_24px] bg-position-[0_0,12px_12px] dark:bg-[linear-gradient(45deg,#1f2937_25%,transparent_25%,transparent_75%,#1f2937_75%,#1f2937),linear-gradient(45deg,#1f2937_25%,transparent_25%,transparent_75%,#1f2937_75%,#1f2937)]"
                            : "",
                        )}
                      >
                        <div ref={qrContainerRef} />
                      </div>
                      <p className="mt-3 text-xs text-muted-foreground">
                        {config.transparentBackground
                          ? "当前预览使用棋盘格底板，方便观察透明背景效果。"
                          : "当前预览与下载样式保持一致。"}
                      </p>
                    </div>

                    <div className="space-y-4">
                      {generateResult.warnings.length > 0 && (
                        <Alert className="bgmax-w-md max-w-md border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-50">
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
                        <div className="text-sm font-medium">结构化内容</div>
                        <div className="mt-3 grid gap-3 text-sm md:grid-cols-2">
                          {generateResult.parsed.fields.map((field) => (
                            <div key={`${field.label}-${field.value}`}>
                              <div className="text-muted-foreground">
                                {field.label}
                              </div>
                              <div className="break-all">{field.value}</div>
                            </div>
                          ))}
                          <div>
                            <div className="text-muted-foreground">
                              图片格式
                            </div>
                            <div>{config.downloadFormat.toUpperCase()}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">
                              Logo 状态
                            </div>
                            <div>{logoState ? logoState.name : "未添加"}</div>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-xl border p-4">
                        <div className="text-sm font-medium">原始编码内容</div>
                        <Textarea
                          className="mt-3 min-h-[160px] font-mono text-xs"
                          readOnly
                          value={generateResult.payload}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </>
        ) : (
          <>
            {parseError && (
              <Alert variant="destructive">
                <AlertTitle>二维码解析失败</AlertTitle>
                <AlertDescription>{parseError}</AlertDescription>
              </Alert>
            )}

            {!parseResult && !parseLoading && !parseError && (
              <Empty className="border border-dashed">
                <EmptyHeader>
                  <EmptyTitle>还没有解析结果</EmptyTitle>
                  <EmptyDescription>
                    左侧上传或粘贴二维码图片后，这里会展示识别出的内容。
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}

            {parseLoading && (
              <div className="rounded-lg border border-dashed p-6 text-sm">
                正在读取图片并尝试识别二维码，请稍候。
              </div>
            )}

            {parseResult && (
              <>
                <Alert>
                  <AlertTitle>识别完成</AlertTitle>
                  <AlertDescription>
                    已于 {formatScannedAt(parseResult.scannedAt)}{" "}
                    完成解析，识别类型为 “{parseResult.parsed.title}”。
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
                        alt="二维码解析预览"
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
                            <div className="font-medium">
                              {parseResult.parsed.title}
                            </div>
                            <Badge variant="secondary">
                              {parseResult.parsed.type}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {parseResult.parsed.description}
                          </p>
                        </div>
                        <Button
                          onClick={() => {
                            void copyText(
                              parseResult.rawValue,
                              "二维码原始内容已复制到剪贴板。",
                            );
                          }}
                          size="sm"
                          type="button"
                          variant="outline"
                        >
                          复制原始内容
                        </Button>
                      </div>

                      <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
                        {parseResult.parsed.fields.map((field) => (
                          <div key={`${field.label}-${field.value}`}>
                            <div className="text-muted-foreground">
                              {field.label}
                            </div>
                            <div className="break-all">{field.value}</div>
                          </div>
                        ))}
                      </div>

                      {parseResult.parsed.actions.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {parseResult.parsed.actions.map((action) => (
                            <Button
                              key={`${action.label}-${action.href}`}
                              onClick={() => {
                                window.open(
                                  action.href,
                                  "_blank",
                                  "noopener,noreferrer",
                                );
                              }}
                              size="sm"
                              type="button"
                              variant="outline"
                            >
                              {action.label}
                            </Button>
                          ))}
                        </div>
                      )}
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
