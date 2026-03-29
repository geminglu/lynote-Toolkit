"use client";

import { Eye, EyeOff } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "lynote-ui/alert";
import { Badge } from "lynote-ui/badge";
import { Button } from "lynote-ui/button";
import {
  Card,
  CardAction,
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
import { Switch } from "lynote-ui/switch";
import { Textarea } from "lynote-ui/textarea";
import type { FC } from "react";

import { useKeyGeneratorContext } from "../hooks/useKeyGeneratorContext";
import { createMaskedValue } from "../utils";

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
 * 密钥生成结果面板
 */
const ResultPanel: FC = () => {
  const {
    result,
    error,
    loading,
    showSensitiveData,
    toggleSensitiveData,
    copyOutput,
    downloadOutput,
  } = useKeyGeneratorContext();

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>生成结果</CardTitle>
        <CardDescription>
          默认隐藏敏感内容；需要查看时请手动开启显示。
        </CardDescription>

        <CardAction>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">显示敏感内容</span>
            <Switch
              checked={showSensitiveData}
              onCheckedChange={toggleSensitiveData}
            />
          </div>
        </CardAction>
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
                左侧确认配置后点击“生成”，结果只会保留在当前页面会话中。
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}

        {loading && (
          <div className="rounded-lg border border-dashed p-6 text-sm">
            正在调用浏览器的 Web Crypto API 生成密钥，请稍候。
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

            {result.outputs.map((output) => {
              const visibleValue =
                output.sensitive && !showSensitiveData
                  ? createMaskedValue(output.value)
                  : output.value;

              return (
                <div
                  className="space-y-3 rounded-xl border p-4"
                  key={output.id}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="font-medium">{output.title}</div>
                        <Badge
                          variant={output.sensitive ? "secondary" : "outline"}
                        >
                          {output.sensitive ? "敏感内容" : "可公开内容"}
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
                    className="min-h-[220px] font-mono text-xs"
                    readOnly
                    value={visibleValue}
                  />

                  {output.sensitive && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {showSensitiveData ? (
                        <Eye className="size-3.5" />
                      ) : (
                        <EyeOff className="size-3.5" />
                      )}
                      <span>
                        {showSensitiveData
                          ? "当前已显示敏感内容，请注意周围环境与录屏。"
                          : "当前为隐藏状态，复制和下载仍会使用原始结果。"}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ResultPanel;
