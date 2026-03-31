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

import { useUrlToolContext } from "../hooks/useUrlToolContext";
import { getDetectedInputTypeLabel, getOperationLabel } from "../utils";

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
 * URL 结果面板
 */
const ResultPanel: FC = () => {
  const { result, error, loading, copyOutput } = useUrlToolContext();

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>处理结果</CardTitle>
        <CardDescription>
          展示编解码结果、URL 结构、Query 参数和重组后的输出，支持分项复制。
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertTitle>处理失败</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!result && !loading && (
          <Empty className="border border-dashed">
            <EmptyHeader>
              <EmptyTitle>还没有处理结果</EmptyTitle>
              <EmptyDescription>
                左侧确认输入模式和处理方式后点击执行，结果只会保留在当前页面会话中。
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}

        {loading && (
          <div className="rounded-lg border border-dashed p-6 text-sm">
            正在处理当前 URL 内容，请稍候。
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
                  <div className="text-muted-foreground">处理方式</div>
                  <div>{getOperationLabel(result.operation)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">输入识别</div>
                  <div>
                    {getDetectedInputTypeLabel(result.detectedInputType)}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">参数项数量</div>
                  <div>{result.queryEntries.length}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">是否含结构解析</div>
                  <div>{result.urlParts ? "是" : "否"}</div>
                </div>
              </div>
            </div>

            <div className="space-y-3 rounded-xl border p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-2">
                  <div className="font-medium">{result.primaryTitle}</div>
                  <p className="text-sm text-muted-foreground">
                    {result.primaryDescription}
                  </p>
                </div>
                <Button
                  onClick={() => {
                    void copyOutput("primary-result");
                  }}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  复制结果
                </Button>
              </div>
              <Textarea
                className="min-h-[160px] font-mono text-xs"
                readOnly
                value={result.primaryResult}
              />
            </div>

            {result.urlParts && (
              <div className="rounded-xl border p-4">
                <div className="text-sm font-medium">URL 结构</div>
                <div className="mt-3 grid gap-3 text-sm md:grid-cols-2">
                  <div>
                    <div className="text-muted-foreground">href</div>
                    <div className="break-all">{result.urlParts.href}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">origin</div>
                    <div>{result.urlParts.origin}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">protocol</div>
                    <div>{result.urlParts.protocol}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">host</div>
                    <div>{result.urlParts.host}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">hostname</div>
                    <div>{result.urlParts.hostname}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">port</div>
                    <div>{result.urlParts.port || "未提供"}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">pathname</div>
                    <div className="break-all">{result.urlParts.pathname}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">search</div>
                    <div className="break-all">
                      {result.urlParts.search || "未提供"}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">hash</div>
                    <div className="break-all">
                      {result.urlParts.hash || "未提供"}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {result.queryEntries.length > 0 && (
              <div className="rounded-xl border p-4">
                <div className="text-sm font-medium">Query 参数</div>
                <div className="mt-3 space-y-3">
                  {result.queryEntries.map((entry) => (
                    <div
                      className="rounded-lg border bg-muted/20 p-3 text-sm"
                      key={entry.id}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="font-medium">
                          {entry.decodedKey || "(空 key)"}
                        </div>
                        {!entry.hasExplicitValue && (
                          <Badge variant="secondary">无显式 value</Badge>
                        )}
                      </div>
                      <div className="mt-2 grid gap-2 text-xs md:grid-cols-2">
                        <div>
                          <div className="text-muted-foreground">原始 key</div>
                          <div className="font-mono break-all">
                            {entry.rawKey}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">
                            原始 value
                          </div>
                          <div className="font-mono break-all">
                            {entry.rawValue || "空字符串"}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">
                            解码后 key
                          </div>
                          <div className="font-mono break-all">
                            {entry.decodedKey}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">
                            解码后 value
                          </div>
                          <div className="font-mono break-all">
                            {entry.decodedValue || "空字符串"}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.outputs.map((output) => (
              <div className="space-y-3 rounded-xl border p-4" key={output.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="font-medium">{output.title}</div>
                    <p className="text-sm text-muted-foreground">
                      {output.description}
                    </p>
                  </div>
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
