"use client";

import { Copy, RefreshCw } from "lucide-react";
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
import { Textarea } from "lynote-ui/textarea";
import type { FC } from "react";

import { useCronToolContext } from "../hooks/useCronToolContext";
import type { CronIssueSeverity } from "../type";

function getBadgeVariant(severity: CronIssueSeverity) {
  if (severity === "danger") return "destructive" as const;
  if (severity === "warning") return "outline" as const;

  return "secondary" as const;
}

function getSeverityLabel(severity: CronIssueSeverity) {
  if (severity === "danger") return "错误";
  if (severity === "warning") return "提醒";

  return "信息";
}

const ResultPanel: FC = () => {
  const {
    state,
    issues,
    description,
    generatedExpression,
    updateExpression,
    parseExpression,
    copyExpression,
  } = useCronToolContext();
  const hasDanger = issues.some((issue) => issue.severity === "danger");

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>表达式与描述</CardTitle>
        <CardDescription>
          生成 cron，或解析已有 cron 并回显到左侧界面。
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        <section className="space-y-3 rounded-lg border p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm font-medium">当前生成表达式</div>
            <Button
              disabled={hasDanger}
              onClick={copyExpression}
              size="sm"
              type="button"
              variant="outline"
            >
              <Copy className="h-4 w-4" />
              复制
            </Button>
          </div>
          <div className="rounded-md bg-muted p-3 font-mono text-sm break-all">
            {generatedExpression}
          </div>
        </section>

        <section className="space-y-3 rounded-lg border p-4">
          <div className="text-sm font-medium">中文描述</div>
          <Alert variant={hasDanger ? "destructive" : "default"}>
            <AlertTitle>{hasDanger ? "需要修正" : "可读描述"}</AlertTitle>
            <AlertDescription>{description}</AlertDescription>
          </Alert>
        </section>

        <section className="space-y-3 rounded-lg border p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm font-medium">解析表达式</div>
            <Button onClick={parseExpression} size="sm" type="button">
              <RefreshCw className="h-4 w-4" />
              解析到界面
            </Button>
          </div>
          <Textarea
            className="min-h-28 font-mono text-sm"
            onChange={(event) => {
              updateExpression(event.target.value);
            }}
            spellCheck={false}
            value={state.expression}
          />
        </section>

        {issues.length > 0 && (
          <section className="space-y-2 rounded-lg border p-4">
            <div className="text-sm font-medium">校验结果</div>
            {issues.map((issue) => (
              <div
                className="flex items-start gap-2 rounded-md bg-muted/40 p-3 text-sm"
                key={`${issue.id}-${issue.message}`}
              >
                <Badge variant={getBadgeVariant(issue.severity)}>
                  {getSeverityLabel(issue.severity)}
                </Badge>
                <div className="leading-6 text-muted-foreground">
                  {issue.message}
                </div>
              </div>
            ))}
          </section>
        )}
      </CardContent>
    </Card>
  );
};

export default ResultPanel;
