"use client";

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
import { Textarea } from "lynote-ui/textarea";
import type { FC } from "react";

import { useBase64ToolContext } from "../hooks/useBase64ToolContext";
import {
  formatFileSize,
  getInputModeLabel,
  getOutputModeLabel,
} from "../utils";

function formatGeneratedAt(timestamp: number) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(timestamp);
}

function formatLastModified(timestamp: number) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(timestamp);
}

const ResultPanel: FC = () => {
  const { result, error, loading, copyOutput, downloadOutput } =
    useBase64ToolContext();
  const primaryOutput = result?.outputs.find(
    (item) => item.id === result.primaryOutputId,
  );
  const secondaryOutputs =
    result?.outputs.filter((item) => item.id !== result.primaryOutputId) ?? [];

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>处理结果</CardTitle>
        <CardDescription>
          展示主输出、附加视图、字节预览和 Data URL /
          文件元信息，支持分项复制与下载。
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertTitle>处理失败</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!result && !loading && !error && (
          <Empty className="border border-dashed">
            <EmptyHeader>
              <EmptyTitle>还没有处理结果</EmptyTitle>
              <EmptyDescription>
                左侧输入文本、Base64、Data URL
                或选择文件后，结果会自动出现在这里。
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}

        {loading && (
          <div className="rounded-lg border border-dashed p-6 text-sm">
            正在处理当前输入，请稍候。文件模式会先在浏览器本地读取原始字节。
          </div>
        )}

        {result && primaryOutput && (
          <>
            <Alert>
              <AlertTitle>当前结果不会自动保存</AlertTitle>
              <AlertDescription>
                {result.summary}。生成时间{" "}
                {formatGeneratedAt(result.generatedAt)}。
              </AlertDescription>
            </Alert>

            {result.warnings.length > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 text-sm">
                <div className="font-medium text-amber-700">调试提示</div>
                <ul className="mt-2 space-y-1 text-xs text-amber-700">
                  {result.warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="rounded-xl border p-4">
              <div className="text-sm font-medium">处理概览</div>
              <div className="mt-3 grid gap-3 text-sm md:grid-cols-2">
                <div>
                  <div className="text-muted-foreground">输入模式</div>
                  <div>{getInputModeLabel(result.inputMode)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">主输出</div>
                  <div>{getOutputModeLabel(result.outputMode)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">字节长度</div>
                  <div>{result.byteLength}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">行数</div>
                  <div>{result.lineCount}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">文本可读性</div>
                  <div>
                    {result.canDecodeText
                      ? "可按当前字符集展示"
                      : "建议查看 Hex"}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">内容类型推测</div>
                  <div>{result.detectedBinaryKind}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">
                    标准 Base64 是否含补位
                  </div>
                  <div>{result.containsPadding ? "是" : "否"}</div>
                </div>
              </div>
            </div>

            {result.file && (
              <div className="rounded-xl border p-4">
                <div className="text-sm font-medium">文件元信息</div>
                <div className="mt-3 grid gap-3 text-sm md:grid-cols-2">
                  <div>
                    <div className="text-muted-foreground">文件名</div>
                    <div className="break-all">{result.file.name}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">大小</div>
                    <div>{formatFileSize(result.file.size)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">MIME 类型</div>
                    <div>{result.file.type || "未知"}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">最后修改时间</div>
                    <div>{formatLastModified(result.file.lastModified)}</div>
                  </div>
                </div>
              </div>
            )}

            {result.dataUrl && (
              <div className="rounded-xl border p-4">
                <div className="text-sm font-medium">Data URL 信息</div>
                <div className="mt-3 grid gap-3 text-sm md:grid-cols-2">
                  <div>
                    <div className="text-muted-foreground">Header</div>
                    <div className="break-all">{result.dataUrl.header}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">MIME 类型</div>
                    <div>{result.dataUrl.mimeType}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">
                      是否 Base64 负载
                    </div>
                    <div>{result.dataUrl.isBase64 ? "是" : "否"}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Payload 长度</div>
                    <div>{result.dataUrl.payloadLength}</div>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3 rounded-xl border p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="font-medium">{primaryOutput.title}</div>
                    <Badge variant="secondary">主输出</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {primaryOutput.description}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => {
                      void copyOutput(primaryOutput.id);
                    }}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    复制结果
                  </Button>
                  <Button
                    onClick={() => {
                      downloadOutput(primaryOutput.id);
                    }}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    下载结果
                  </Button>
                </div>
              </div>
              <Textarea
                className="min-h-[180px] font-mono text-xs"
                readOnly
                value={primaryOutput.value}
              />
            </div>

            <div className="rounded-xl border p-4">
              <div className="text-sm font-medium">字节预览</div>
              <div className="mt-3 grid gap-3 text-sm md:grid-cols-2">
                <div>
                  <div className="text-muted-foreground">标准 Base64</div>
                  <Textarea
                    className="mt-2 min-h-[120px] font-mono text-xs"
                    readOnly
                    value={result.normalizedBase64}
                  />
                </div>
                <div>
                  <div className="text-muted-foreground">Base64URL</div>
                  <Textarea
                    className="mt-2 min-h-[120px] font-mono text-xs"
                    readOnly
                    value={result.normalizedBase64Url}
                  />
                </div>
                <div>
                  <div className="text-muted-foreground">文本预览</div>
                  <Textarea
                    className="mt-2 min-h-[120px] font-mono text-xs"
                    readOnly
                    value={result.textPreview}
                  />
                </div>
                <div>
                  <div className="text-muted-foreground">Hex 预览</div>
                  <Textarea
                    className="mt-2 min-h-[120px] font-mono text-xs"
                    readOnly
                    value={result.hexPreview}
                  />
                </div>
              </div>
              {result.bytePreviewRows.length > 0 && (
                <div className="mt-4 space-y-2">
                  <div className="text-sm font-medium">
                    前 {result.bytePreviewRows.length * 16} bytes
                  </div>
                  <div className="overflow-x-auto rounded-lg border bg-muted/20 p-3">
                    <div className="min-w-[540px] space-y-1 font-mono text-xs">
                      {result.bytePreviewRows.map((row) => (
                        <div
                          className="grid grid-cols-[64px_1fr_180px] gap-3"
                          key={row.offset}
                        >
                          <span className="text-muted-foreground">
                            {row.offset}
                          </span>
                          <span>{row.hex}</span>
                          <span>{row.ascii}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {result.asciiPreview && (
                    <p className="text-xs text-muted-foreground">
                      ASCII 预览：{result.asciiPreview}
                    </p>
                  )}
                </div>
              )}
            </div>

            {secondaryOutputs.map((output) => (
              <div className="space-y-3 rounded-xl border p-4" key={output.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="font-medium">{output.title}</div>
                    <p className="text-sm text-muted-foreground">
                      {output.description}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() => {
                        void copyOutput(output.id);
                      }}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      复制
                    </Button>
                    <Button
                      onClick={() => {
                        downloadOutput(output.id);
                      }}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      下载
                    </Button>
                  </div>
                </div>
                <Textarea
                  className="min-h-[140px] font-mono text-xs"
                  readOnly
                  value={output.value}
                />
              </div>
            ))}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ResultPanel;
