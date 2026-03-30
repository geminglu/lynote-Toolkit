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

import { useHashGeneratorContext } from "../hooks/useHashGeneratorContext";
import {
  formatFileSize,
  getAlgorithmLabel,
  getEncodingLabel,
  getModeLabel,
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
    useHashGeneratorContext();

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>生成结果</CardTitle>
        <CardDescription>
          支持复制、下载，并在提供原哈希值时显示逐项比对结果。
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertTitle>生成失败</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!result && !loading && (
          <Empty className="border border-dashed">
            <EmptyHeader>
              <EmptyTitle>还没有生成结果</EmptyTitle>
              <EmptyDescription>
                左侧确认输入和算法后点击“生成”，结果只会保留在当前页面会话中。
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}

        {loading && (
          <div className="rounded-lg border border-dashed p-6 text-sm">
            正在计算 {result?.mode === "hmac" ? "HMAC" : "结果"}
            ，请稍候。文件模式会按分块方式在浏览器本地处理。
          </div>
        )}

        {result && (
          <>
            <Alert>
              <AlertTitle>当前结果不会自动保存</AlertTitle>
              <AlertDescription>
                {result.summary}。生成时间{" "}
                {formatGeneratedAt(result.generatedAt)}。
              </AlertDescription>
            </Alert>

            <div className="rounded-xl border p-4">
              <div className="text-sm font-medium">输入元信息</div>
              <div className="mt-3 grid gap-3 text-sm md:grid-cols-2">
                <div>
                  <div className="text-muted-foreground">计算模式</div>
                  <div>{getModeLabel(result.mode)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">输入类型</div>
                  <div>{result.inputType === "text" ? "文本" : "单文件"}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">输出格式</div>
                  <div>{getEncodingLabel(result.encoding)}</div>
                </div>
                {typeof result.textLength === "number" && (
                  <div>
                    <div className="text-muted-foreground">文本字符数</div>
                    <div>{result.textLength}</div>
                  </div>
                )}
                {result.file && (
                  <>
                    <div>
                      <div className="text-muted-foreground">文件名</div>
                      <div className="break-all">{result.file.name}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">文件大小</div>
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
                  </>
                )}
              </div>
            </div>

            {result.outputs.map((output) => (
              <div className="space-y-3 rounded-xl border p-4" key={output.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="font-medium">{output.title}</div>
                      <Badge variant="outline">
                        {getAlgorithmLabel(output.algorithm)}
                      </Badge>
                      {output.compareStatus === "match" && (
                        <span className="text-sm text-emerald-600">
                          校验一致
                        </span>
                      )}
                      {output.compareStatus === "mismatch" && (
                        <span className="text-sm text-red-600">校验不一致</span>
                      )}
                    </div>
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
                      variant="outline"
                    >
                      复制
                    </Button>
                    <Button
                      onClick={() => {
                        downloadOutput(output.id);
                      }}
                      size="sm"
                      variant="outline"
                    >
                      下载
                    </Button>
                  </div>
                </div>

                <Textarea
                  className="min-h-[160px] font-mono text-xs"
                  readOnly
                  value={output.value}
                />

                {output.compareTarget && (
                  <div className="space-y-1 rounded-lg bg-muted/50 p-3 text-xs">
                    <div className="text-muted-foreground">校验目标</div>
                    <div className="font-mono break-all">
                      {output.compareTarget}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ResultPanel;
