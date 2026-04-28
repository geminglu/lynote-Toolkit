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

import { useRsaToolContext } from "../hooks/useRsaToolContext";
import { getKeyFormatLabel, getModeLabel } from "../utils";

function formatGeneratedAt(timestamp: number) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(timestamp);
}

/**
 * RSA 结果面板
 */
const ResultPanel: FC = () => {
  const { result, error, loading, copyOutput, downloadOutput } =
    useRsaToolContext();

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>执行结果</CardTitle>
        <CardDescription>
          展示当前密钥摘要、参数提示和最终输出，支持复制与下载。
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertTitle>执行失败</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!result && !loading && (
          <Empty className="border border-dashed">
            <EmptyHeader>
              <EmptyTitle>还没有执行结果</EmptyTitle>
              <EmptyDescription>
                左侧选择操作模式并输入密钥后点击“执行”，结果仅保留在当前页面会话中。
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}

        {loading && (
          <div className="rounded-lg border border-dashed p-6 text-sm">
            正在调用浏览器的 Web Crypto API 处理 RSA 请求，请稍候。
          </div>
        )}

        {result && (
          <>
            <Alert>
              <AlertTitle>当前结果不会自动保存</AlertTitle>
              <AlertDescription>
                {result.summary} 执行时间{" "}
                {formatGeneratedAt(result.generatedAt)}。
              </AlertDescription>
            </Alert>

            {typeof result.verified === "boolean" && (
              <Alert variant={result.verified ? "default" : "destructive"}>
                <AlertTitle>
                  {result.verified ? "验签通过" : "验签失败"}
                </AlertTitle>
                <AlertDescription>
                  {result.verified
                    ? "签名、公钥、原文与算法参数一致。"
                    : "请重点检查原文、公钥、签名编码格式和 PSS saltLength。"}
                </AlertDescription>
              </Alert>
            )}

            {result.warnings.length > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 text-sm">
                <div className="font-medium text-amber-700">兼容性提示</div>
                <ul className="mt-2 space-y-1 text-xs text-amber-700">
                  {result.warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}

            {result.keyInfo && (
              <div className="rounded-xl border p-4">
                <div className="text-sm font-medium">密钥摘要</div>
                <div className="mt-3 grid gap-3 text-sm md:grid-cols-2">
                  <div>
                    <div className="text-muted-foreground">操作模式</div>
                    <div>{getModeLabel(result.mode)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">密钥格式</div>
                    <div>{getKeyFormatLabel(result.keyInfo.format)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">密钥类型</div>
                    <div>
                      {result.keyInfo.kind === "public" ? "公钥" : "私钥"}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">识别算法</div>
                    <div>{result.keyInfo.algorithmLabel}</div>
                  </div>
                  {typeof result.keyInfo.modulusLength === "number" && (
                    <div>
                      <div className="text-muted-foreground">RSA 位数</div>
                      <div>{result.keyInfo.modulusLength}</div>
                    </div>
                  )}
                  {result.keyInfo.pemLabel && (
                    <div>
                      <div className="text-muted-foreground">PEM 标签</div>
                      <div>{result.keyInfo.pemLabel}</div>
                    </div>
                  )}
                  <div>
                    <div className="text-muted-foreground">可用用途</div>
                    <div>{result.keyInfo.usages.join(" / ")}</div>
                  </div>
                  {typeof result.inputLength === "number" && (
                    <div>
                      <div className="text-muted-foreground">输入字节数</div>
                      <div>{result.inputLength}</div>
                    </div>
                  )}
                  {typeof result.maxPlaintextLength === "number" && (
                    <div>
                      <div className="text-muted-foreground">
                        当前最大明文字节数
                      </div>
                      <div>{result.maxPlaintextLength}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {result.outputs.map((output) => (
              <div className="space-y-3 rounded-xl border p-4" key={output.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="font-medium">{output.title}</div>
                      <Badge variant="outline">
                        {getModeLabel(result.mode)}
                      </Badge>
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
              </div>
            ))}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ResultPanel;
