"use client";

import { Button } from "lynote-ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "lynote-ui/card";
import { Label } from "lynote-ui/label";
import { NativeSelect, NativeSelectOption } from "lynote-ui/native-select";
import { Switch } from "lynote-ui/switch";
import { Textarea } from "lynote-ui/textarea";
import type { FC } from "react";

import { useUrlToolContext } from "../hooks/useUrlToolContext";
import type { UrlToolInputMode, UrlToolOperation } from "../type";
import {
  URL_INPUT_MODE_OPTIONS,
  URL_OPERATION_OPTIONS,
  getAllowedOperationsByInputMode,
  getDetectedInputTypeLabel,
} from "../utils";

/**
 * URL 配置面板
 */
const ConfigPanel: FC = () => {
  const {
    config,
    result,
    loading,
    updateInput,
    updateInputMode,
    updateOperation,
    updatePlusAsSpace,
    resetToDefaults,
    clearResult,
    execute,
  } = useUrlToolContext();
  const allowedOperations = getAllowedOperationsByInputMode(config.inputMode);

  return (
    <Card>
      <CardHeader>
        <CardTitle>处理配置</CardTitle>
        <CardDescription>
          支持完整 URL、参数值和 Query String
          的编码、解码与结构解析，所有处理都在浏览器本地完成。
        </CardDescription>

        <CardAction>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">`+` 号转空格</span>
            <Switch
              checked={config.plusAsSpace}
              onCheckedChange={updatePlusAsSpace}
            />
          </div>
        </CardAction>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="url-input-mode">输入模式</Label>
          <NativeSelect
            id="url-input-mode"
            onChange={(event) => {
              updateInputMode(event.target.value as UrlToolInputMode);
            }}
            value={config.inputMode}
          >
            {URL_INPUT_MODE_OPTIONS.map((option) => (
              <NativeSelectOption key={option.value} value={option.value}>
                {option.label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <p className="text-xs text-muted-foreground">
            {
              URL_INPUT_MODE_OPTIONS.find(
                (option) => option.value === config.inputMode,
              )?.description
            }
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="url-operation">处理方式</Label>
          <NativeSelect
            id="url-operation"
            onChange={(event) => {
              updateOperation(event.target.value as UrlToolOperation);
            }}
            value={config.operation}
          >
            {URL_OPERATION_OPTIONS.filter((option) =>
              allowedOperations.includes(option.value),
            ).map((option) => (
              <NativeSelectOption key={option.value} value={option.value}>
                {option.label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <p className="text-xs text-muted-foreground">
            {
              URL_OPERATION_OPTIONS.find(
                (option) => option.value === config.operation,
              )?.description
            }
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="url-input-text">输入内容</Label>
          <Textarea
            className="min-h-[240px] font-mono text-xs"
            id="url-input-text"
            onChange={(event) => {
              updateInput(event.target.value);
            }}
            placeholder={
              config.inputMode === "full-url"
                ? "输入完整 URL，例如 https://example.com/callback?redirect_uri=https%3A%2F%2Ffoo.com%2Fdone"
                : config.inputMode === "component"
                  ? "输入单个参数值，例如 https://foo.com/path?a=1&b=2"
                  : "输入 Query String，例如 a=1&a=2&redirect_uri=https%3A%2F%2Fdemo.com%2Fdone"
            }
            value={config.input}
          />
          <p className="text-xs text-muted-foreground">
            {config.inputMode === "full-url"
              ? "完整 URL 编码对应 `encodeURI` / `decodeURI`。"
              : config.inputMode === "component"
                ? "参数值编码对应 `encodeURIComponent` / `decodeURIComponent`。"
                : "Query String 模式会逐项处理 key / value，并保留重复参数和空值。"}
          </p>
          {result && (
            <p className="text-xs text-muted-foreground">
              当前自动识别到的输入类型：
              {getDetectedInputTypeLabel(result.detectedInputType)}。
            </p>
          )}
        </div>

        <div className="rounded-lg border border-dashed p-3 text-sm">
          <div className="font-medium">安全规则</div>
          <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
            <li>编码、解码和解析过程仅发生在当前浏览器页面内。</li>
            <li>不会上传 URL、参数值或解析结果。</li>
            <li>不会自动保存历史记录；刷新页面后当前内容会被清空。</li>
          </ul>
        </div>
      </CardContent>

      <CardFooter className="flex flex-wrap gap-2">
        <Button
          disabled={loading}
          onClick={() => {
            void execute();
          }}
          type="button"
        >
          {config.operation === "parse"
            ? "解析 URL"
            : config.operation === "encode"
              ? "执行编码"
              : "执行解码"}
        </Button>
        <Button
          disabled={!result && !loading}
          onClick={clearResult}
          type="button"
          variant="outline"
        >
          清空结果
        </Button>
        <Button onClick={resetToDefaults} type="button" variant="ghost">
          恢复默认配置
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ConfigPanel;
