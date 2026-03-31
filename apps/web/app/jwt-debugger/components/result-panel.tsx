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

import { useJwtDebuggerContext } from "../hooks/useJwtDebuggerContext";
import type { JwtTimeClaimInfo } from "../type";
import {
  formatClaimValue,
  getTimeClaimStatusLabel,
  getTimeClaimStatusTone,
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

function getVerificationAlertVariant(status: string) {
  return status === "error" ? "destructive" : "default";
}

function getTimeClaimTextColor(claimInfo: JwtTimeClaimInfo) {
  switch (getTimeClaimStatusTone(claimInfo.status)) {
    case "success":
      return "text-emerald-600";
    case "warning":
      return "text-amber-700";
    default:
      return "text-muted-foreground";
  }
}

/**
 * JWT 结果面板
 */
const ResultPanel: FC = () => {
  const { result, error, loading, copyOutput } = useJwtDebuggerContext();

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>解析结果</CardTitle>
        <CardDescription>
          展示 Header、Payload、时间类 claim 和签名验证结果，支持分项复制。
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertTitle>解析失败</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!result && !loading && (
          <Empty className="border border-dashed">
            <EmptyHeader>
              <EmptyTitle>还没有解析结果</EmptyTitle>
              <EmptyDescription>
                左侧粘贴 token 后点击“解析
                JWT”或“解析并验签”，结果仅保留在当前页面会话中。
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}

        {loading && (
          <div className="rounded-lg border border-dashed p-6 text-sm">
            正在解析 JWT，并根据当前配置调用浏览器的 Web Crypto API
            执行验签，请稍候。
          </div>
        )}

        {result && (
          <>
            <Alert>
              <AlertTitle>当前结果不会自动保存</AlertTitle>
              <AlertDescription>
                {result.summary}。执行时间{" "}
                {formatGeneratedAt(result.generatedAt)}。
              </AlertDescription>
            </Alert>

            <Alert
              variant={getVerificationAlertVariant(result.verification.status)}
            >
              <AlertTitle>{result.verification.title}</AlertTitle>
              <AlertDescription>{result.verification.message}</AlertDescription>
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
              <div className="text-sm font-medium">结构概览</div>
              <div className="mt-3 grid gap-3 text-sm md:grid-cols-2">
                <div>
                  <div className="text-muted-foreground">识别算法</div>
                  <div className="flex items-center gap-2">
                    <span>{result.algorithm || "未提供"}</span>
                    {result.algorithm && (
                      <Badge
                        variant={
                          result.supportedAlgorithm ? "outline" : "secondary"
                        }
                      >
                        {result.supportedAlgorithm ? "首版支持" : "暂未支持"}
                      </Badge>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Token 长度</div>
                  <div>{result.tokenLength} 个字符</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Header 字段数</div>
                  <div>{Object.keys(result.header).length}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Payload 字段数</div>
                  <div>{Object.keys(result.payload).length}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Signature 长度</div>
                  <div>{result.signature.length} 个字符</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Token 类型</div>
                  <div>
                    {typeof result.header.typ === "string"
                      ? result.header.typ
                      : "未提供"}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border p-4">
              <div className="text-sm font-medium">关键字段</div>
              <div className="mt-3 grid gap-3 text-sm md:grid-cols-2">
                <div>
                  <div className="text-muted-foreground">kid</div>
                  <div>{formatClaimValue(result.header.kid)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">iss</div>
                  <div>{formatClaimValue(result.payload.iss)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">sub</div>
                  <div>{formatClaimValue(result.payload.sub)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">aud</div>
                  <div className="break-all">
                    {formatClaimValue(result.payload.aud)}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">jti</div>
                  <div>{formatClaimValue(result.payload.jti)}</div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border p-4">
              <div className="text-sm font-medium">时间类 Claim</div>
              <div className="mt-3 grid gap-3 md:grid-cols-3">
                {result.claimInfos.map((claimInfo) => (
                  <div
                    className="rounded-lg border bg-muted/20 p-3 text-sm"
                    key={claimInfo.claim}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-medium">{claimInfo.label}</div>
                      <Badge variant="outline">
                        {getTimeClaimStatusLabel(claimInfo.status)}
                      </Badge>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      原值：{formatClaimValue(claimInfo.rawValue)}
                    </div>
                    {claimInfo.isoTime && (
                      <div className="mt-1 text-xs text-muted-foreground">
                        本地时间：{claimInfo.isoTime}
                      </div>
                    )}
                    <p
                      className={`mt-2 text-xs ${getTimeClaimTextColor(claimInfo)}`}
                    >
                      {claimInfo.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {result.outputs.map((output) => (
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
                      variant="outline"
                    >
                      复制
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
