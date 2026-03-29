"use client";

import { Button } from "lynote-ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "lynote-ui/card";
import { Input } from "lynote-ui/input";
import { Label } from "lynote-ui/label";
import { NativeSelect, NativeSelectOption } from "lynote-ui/native-select";
import type { FC } from "react";

import { useKeyGeneratorContext } from "../hooks/useKeyGeneratorContext";
import type {
  ApiKeyCharset,
  KeyGeneratorEncoding,
  KeyGeneratorType,
} from "../type";
import {
  API_KEY_CHARSET_OPTIONS,
  API_KEY_ENCODING_OPTIONS,
  EXPORTABLE_SECRET_ENCODING_OPTIONS,
  KEY_TYPE_OPTIONS,
  RSA_ENCODING_OPTIONS,
  SECRET_ENCODING_OPTIONS,
  getApiLengthDescription,
  getApiLengthLabel,
  getHmacBytesDescription,
  getJwtBytesDescription,
} from "../utils";

/**
 * 密钥生成配置面板
 */
const ConfigPanel: FC = () => {
  const {
    config,
    loading,
    result,
    updateType,
    updateEncoding,
    updateApiLength,
    updateApiCharset,
    updateJwtBytes,
    updateHmacBytes,
    updateRsaModulusLength,
    resetToDefaults,
    clearResult,
    generate,
  } = useKeyGeneratorContext();

  return (
    <Card className="">
      <CardHeader>
        <CardTitle>生成配置</CardTitle>
        <CardDescription>
          选择密钥类型、长度和导出方式。页面刷新后会恢复到默认配置。
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="key-type">密钥类型</Label>
          <NativeSelect
            id="key-type"
            onChange={(event) => {
              updateType(event.target.value as KeyGeneratorType);
            }}
            value={config.type}
          >
            {KEY_TYPE_OPTIONS.map((option) => (
              <NativeSelectOption key={option.value} value={option.value}>
                {option.label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>

        <div className="space-y-2">
          <Label htmlFor="key-encoding">输出格式</Label>
          <NativeSelect
            id="key-encoding"
            onChange={(event) => {
              updateEncoding(event.target.value as KeyGeneratorEncoding);
            }}
            value={config.encoding}
          >
            {config.type === "api-key" &&
              API_KEY_ENCODING_OPTIONS.map((option) => (
                <NativeSelectOption key={option.value} value={option.value}>
                  {option.label}
                </NativeSelectOption>
              ))}
            {config.type === "jwt-secret" &&
              SECRET_ENCODING_OPTIONS.map((option) => (
                <NativeSelectOption key={option.value} value={option.value}>
                  {option.label}
                </NativeSelectOption>
              ))}
            {(config.type === "aes-256" || config.type === "hmac-sha256") &&
              EXPORTABLE_SECRET_ENCODING_OPTIONS.map((option) => (
                <NativeSelectOption key={option.value} value={option.value}>
                  {option.label}
                </NativeSelectOption>
              ))}
            {config.type === "rsa-key-pair" &&
              RSA_ENCODING_OPTIONS.map((option) => (
                <NativeSelectOption key={option.value} value={option.value}>
                  {option.label}
                </NativeSelectOption>
              ))}
          </NativeSelect>
        </div>

        {config.type === "api-key" && (
          <>
            <div className="space-y-2">
              <Label htmlFor="api-length">
                {getApiLengthLabel(config.encoding)}
              </Label>
              <Input
                id="api-length"
                min={16}
                onChange={(event) => {
                  updateApiLength(Number(event.target.value));
                }}
                type="number"
                value={config.length}
              />
              <p className="text-xs text-muted-foreground">
                {getApiLengthDescription(config.encoding)}
              </p>
            </div>

            {config.encoding === "plain" && (
              <div className="space-y-2">
                <Label htmlFor="api-charset">字符集</Label>
                <NativeSelect
                  id="api-charset"
                  onChange={(event) => {
                    updateApiCharset(event.target.value as ApiKeyCharset);
                  }}
                  value={config.charset}
                >
                  {API_KEY_CHARSET_OPTIONS.map((option) => (
                    <NativeSelectOption key={option.value} value={option.value}>
                      {option.label}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </div>
            )}
          </>
        )}

        {config.type === "jwt-secret" && (
          <div className="space-y-2">
            <Label htmlFor="jwt-bytes">随机字节数</Label>
            <Input
              id="jwt-bytes"
              min={32}
              onChange={(event) => {
                updateJwtBytes(Number(event.target.value));
              }}
              type="number"
              value={config.bytes}
            />
            <p className="text-xs text-muted-foreground">
              {getJwtBytesDescription()}
            </p>
          </div>
        )}

        {config.type === "hmac-sha256" && (
          <div className="space-y-2">
            <Label htmlFor="hmac-bytes">密钥长度（bytes）</Label>
            <Input
              id="hmac-bytes"
              min={32}
              onChange={(event) => {
                updateHmacBytes(Number(event.target.value));
              }}
              type="number"
              value={config.bytes}
            />
            <p className="text-xs text-muted-foreground">
              {getHmacBytesDescription()}
            </p>
          </div>
        )}

        {config.type === "rsa-key-pair" && (
          <div className="space-y-2">
            <Label htmlFor="rsa-modulus">RSA 位数</Label>
            <NativeSelect
              id="rsa-modulus"
              onChange={(event) => {
                updateRsaModulusLength(
                  Number(event.target.value) as 2048 | 3072 | 4096,
                );
              }}
              value={String(config.modulusLength)}
            >
              <NativeSelectOption value="2048">2048</NativeSelectOption>
              <NativeSelectOption value="3072">3072</NativeSelectOption>
              <NativeSelectOption value="4096">4096</NativeSelectOption>
            </NativeSelect>
          </div>
        )}

        <div className="rounded-lg border border-dashed p-3 text-sm">
          <div className="font-medium">安全规则</div>
          <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
            <li>生成结果仅存在当前页面内存中。</li>
            <li>不会上传服务器，也不会写入本地存储。</li>
            <li>复制或下载后的数据由浏览器和操作系统接管。</li>
          </ul>
        </div>
      </CardContent>

      <CardFooter className="flex flex-wrap gap-2">
        <Button
          disabled={loading}
          onClick={() => {
            void generate();
          }}
        >
          {loading ? "生成中..." : result ? "重新生成" : "生成"}
        </Button>
        <Button disabled={loading} onClick={resetToDefaults} variant="outline">
          恢复默认配置
        </Button>
        <Button disabled={loading} onClick={clearResult} variant="ghost">
          清空结果
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ConfigPanel;
