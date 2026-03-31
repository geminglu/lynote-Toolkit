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
import { Input } from "lynote-ui/input";
import { Label } from "lynote-ui/label";
import { NativeSelect, NativeSelectOption } from "lynote-ui/native-select";
import { Switch } from "lynote-ui/switch";
import { Textarea } from "lynote-ui/textarea";
import type { FC } from "react";

import { useJwtDebuggerContext } from "../hooks/useJwtDebuggerContext";
import type { JwtVerificationKeyType } from "../type";
import {
  JWT_VERIFICATION_KEY_TYPE_OPTIONS,
  detectJwtAlgorithm,
  getVerificationKeyPlaceholder,
} from "../utils";

/**
 * JWT 配置面板
 */
const ConfigPanel: FC = () => {
  const {
    config,
    loading,
    result,
    updateToken,
    updateVerificationEnabled,
    updateVerificationKeyType,
    updateVerificationKey,
    updateClockToleranceSeconds,
    resetToDefaults,
    clearResult,
    execute,
  } = useJwtDebuggerContext();
  const algorithmHint = detectJwtAlgorithm(config.token);

  return (
    <Card>
      <CardHeader>
        <CardTitle>解析配置</CardTitle>
        <CardDescription>
          支持 JWT 结构解析、`exp / nbf / iat` 校验，以及基于 Secret、PEM Public
          Key 或 JWK 的浏览器本地验签。
        </CardDescription>

        <CardAction>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">启用验签</span>
            <Switch
              checked={config.verificationEnabled}
              onCheckedChange={updateVerificationEnabled}
            />
          </div>
        </CardAction>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="jwt-token-input">JWT Token</Label>
          <Textarea
            className="min-h-[220px] font-mono text-xs"
            id="jwt-token-input"
            onChange={(event) => {
              updateToken(event.target.value);
            }}
            placeholder="粘贴需要解析的 JWT，例如 eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            value={config.token}
          />
          <p className="text-xs text-muted-foreground">
            支持直接粘贴带空格或换行的 token；执行时会自动清洗空白字符。
          </p>
          {algorithmHint && (
            <p className="text-xs text-muted-foreground">
              当前从 Header 里初步识别到的 `alg` 为 `{algorithmHint}`。
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="jwt-clock-tolerance">时间容差（秒）</Label>
          <Input
            id="jwt-clock-tolerance"
            min={0}
            onChange={(event) => {
              updateClockToleranceSeconds(Number(event.target.value));
            }}
            type="number"
            value={config.clockToleranceSeconds}
          />
          <p className="text-xs text-muted-foreground">
            用于处理客户端与签发方之间的少量时钟偏移，默认 `0` 秒。
          </p>
        </div>

        {config.verificationEnabled && (
          <>
            <div className="space-y-2">
              <Label htmlFor="jwt-verification-key-type">验签材料类型</Label>
              <NativeSelect
                id="jwt-verification-key-type"
                onChange={(event) => {
                  updateVerificationKeyType(
                    event.target.value as JwtVerificationKeyType,
                  );
                }}
                value={config.verificationKeyType}
              >
                {JWT_VERIFICATION_KEY_TYPE_OPTIONS.map((option) => (
                  <NativeSelectOption key={option.value} value={option.value}>
                    {option.label}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
              <p className="text-xs text-muted-foreground">
                {
                  JWT_VERIFICATION_KEY_TYPE_OPTIONS.find(
                    (option) => option.value === config.verificationKeyType,
                  )?.description
                }
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="jwt-verification-key">验签内容</Label>
              <Textarea
                className="min-h-[160px] font-mono text-xs"
                id="jwt-verification-key"
                onChange={(event) => {
                  updateVerificationKey(event.target.value);
                }}
                placeholder={getVerificationKeyPlaceholder(
                  config.verificationKeyType,
                  algorithmHint,
                )}
                value={config.verificationKey}
              />
              <p className="text-xs text-muted-foreground">
                当前会根据 Header 中的 `alg`
                自动选择验签算法，并检查你输入的是不是匹配的密钥类型。
              </p>
            </div>
          </>
        )}

        <div className="rounded-lg border border-dashed p-3 text-sm">
          <div className="font-medium">安全规则</div>
          <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
            <li>解析与验签过程仅发生在当前浏览器页面内。</li>
            <li>不会上传 Token、Payload、Secret 或公钥内容。</li>
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
          {config.verificationEnabled ? "解析并验签" : "解析 JWT"}
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
