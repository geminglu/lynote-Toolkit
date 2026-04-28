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
import { Textarea } from "lynote-ui/textarea";
import type { FC } from "react";

import { useRsaToolContext } from "../hooks/useRsaToolContext";
import type {
  RsaBinaryEncoding,
  RsaHashAlgorithm,
  RsaKeyFormat,
  RsaSignatureAlgorithm,
  RsaToolMode,
} from "../type";
import {
  RSA_BINARY_ENCODING_OPTIONS,
  RSA_HASH_OPTIONS,
  RSA_KEY_FORMAT_OPTIONS,
  RSA_MODE_OPTIONS,
  RSA_SIGNATURE_ALGORITHM_OPTIONS,
  getModePrimaryInputDescription,
  getModePrimaryInputLabel,
  getRecommendedKeyHint,
} from "../utils";

function getExpectedKeyRole(mode: RsaToolMode) {
  if (mode === "encrypt" || mode === "verify") {
    return "public";
  }

  if (mode === "decrypt" || mode === "sign") {
    return "private";
  }

  return "either";
}

function getKeyPlaceholder(mode: RsaToolMode, keyFormat: RsaKeyFormat) {
  const expectedKeyRole = getExpectedKeyRole(mode);

  if (keyFormat === "pem") {
    if (expectedKeyRole === "public") {
      return "粘贴 RSA PEM 公钥，例如 -----BEGIN PUBLIC KEY-----";
    }

    if (expectedKeyRole === "private") {
      return "粘贴 RSA PEM 私钥，例如 -----BEGIN PRIVATE KEY-----";
    }

    return "粘贴 RSA PEM 公钥或私钥，例如 -----BEGIN PUBLIC KEY-----";
  }

  if (expectedKeyRole === "public") {
    return '粘贴 RSA JWK 公钥，例如 {"kty":"RSA","n":"...","e":"AQAB"}';
  }

  if (expectedKeyRole === "private") {
    return '粘贴 RSA JWK 私钥，例如 {"kty":"RSA","n":"...","e":"AQAB","d":"..."}';
  }

  return '粘贴 RSA JWK 公钥或私钥，例如 {"kty":"RSA","n":"...","e":"AQAB"}';
}

/**
 * RSA 配置面板
 */
const ConfigPanel: FC = () => {
  const {
    config,
    loading,
    result,
    updateMode,
    updateKeyFormat,
    updateKeyText,
    updateEncryptionHash,
    updateSignatureAlgorithm,
    updateSignatureHash,
    updateOutputEncoding,
    updateCiphertextEncoding,
    updateSignatureEncoding,
    updatePlaintext,
    updateCiphertext,
    updateMessage,
    updateSignature,
    updatePssSaltLength,
    resetToDefaults,
    clearResult,
    execute,
  } = useRsaToolContext();

  return (
    <Card>
      <CardHeader>
        <CardTitle>操作配置</CardTitle>
        <CardDescription>
          支持 RSA
          加密、解密、签名、验签与密钥检查。所有操作均在当前浏览器内完成。
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="rsa-mode">操作模式</Label>
          <NativeSelect
            id="rsa-mode"
            onChange={(event) => {
              updateMode(event.target.value as RsaToolMode);
            }}
            value={config.mode}
          >
            {RSA_MODE_OPTIONS.map((option) => (
              <NativeSelectOption key={option.value} value={option.value}>
                {option.label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <p className="text-xs text-muted-foreground">
            {
              RSA_MODE_OPTIONS.find((option) => option.value === config.mode)
                ?.description
            }
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="rsa-key-format">密钥格式</Label>
          <NativeSelect
            id="rsa-key-format"
            onChange={(event) => {
              updateKeyFormat(event.target.value as RsaKeyFormat);
            }}
            value={config.keyFormat}
          >
            {RSA_KEY_FORMAT_OPTIONS.map((option) => (
              <NativeSelectOption key={option.value} value={option.value}>
                {option.label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <p className="text-xs text-muted-foreground">
            {
              RSA_KEY_FORMAT_OPTIONS.find(
                (option) => option.value === config.keyFormat,
              )?.description
            }
          </p>
        </div>

        {(config.mode === "encrypt" || config.mode === "decrypt") && (
          <div className="space-y-2">
            <Label htmlFor="rsa-encryption-hash">OAEP Hash</Label>
            <NativeSelect
              id="rsa-encryption-hash"
              onChange={(event) => {
                updateEncryptionHash(event.target.value as RsaHashAlgorithm);
              }}
              value={config.encryptionHash}
            >
              {RSA_HASH_OPTIONS.map((option) => (
                <NativeSelectOption key={option.value} value={option.value}>
                  {option.label}
                </NativeSelectOption>
              ))}
            </NativeSelect>
            <p className="text-xs text-muted-foreground">
              RSA 加密当前使用 `RSA-OAEP`，可切换摘要算法以匹配目标系统。
            </p>
          </div>
        )}

        {(config.mode === "sign" || config.mode === "verify") && (
          <>
            <div className="space-y-2">
              <Label htmlFor="rsa-signature-algorithm">签名算法</Label>
              <NativeSelect
                id="rsa-signature-algorithm"
                onChange={(event) => {
                  updateSignatureAlgorithm(
                    event.target.value as RsaSignatureAlgorithm,
                  );
                }}
                value={config.signatureAlgorithm}
              >
                {RSA_SIGNATURE_ALGORITHM_OPTIONS.map((option) => (
                  <NativeSelectOption key={option.value} value={option.value}>
                    {option.label}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
              <p className="text-xs text-muted-foreground">
                {
                  RSA_SIGNATURE_ALGORITHM_OPTIONS.find(
                    (option) => option.value === config.signatureAlgorithm,
                  )?.description
                }
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rsa-signature-hash">摘要算法</Label>
              <NativeSelect
                id="rsa-signature-hash"
                onChange={(event) => {
                  updateSignatureHash(event.target.value as RsaHashAlgorithm);
                }}
                value={config.signatureHash}
              >
                {RSA_HASH_OPTIONS.map((option) => (
                  <NativeSelectOption key={option.value} value={option.value}>
                    {option.label}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>

            {config.signatureAlgorithm === "rsa-pss" && (
              <div className="space-y-2">
                <Label htmlFor="rsa-pss-salt-length">PSS Salt Length</Label>
                <Input
                  id="rsa-pss-salt-length"
                  min={0}
                  onChange={(event) => {
                    updatePssSaltLength(Number(event.target.value));
                  }}
                  type="number"
                  value={config.pssSaltLength}
                />
                <p className="text-xs text-muted-foreground">
                  `RSA-PSS` 场景下，签名和验签双方必须使用同一个 `saltLength`。
                </p>
              </div>
            )}
          </>
        )}

        {(config.mode === "encrypt" || config.mode === "sign") && (
          <div className="space-y-2">
            <Label htmlFor="rsa-output-encoding">输出格式</Label>
            <NativeSelect
              id="rsa-output-encoding"
              onChange={(event) => {
                updateOutputEncoding(event.target.value as RsaBinaryEncoding);
              }}
              value={config.outputEncoding}
            >
              {RSA_BINARY_ENCODING_OPTIONS.map((option) => (
                <NativeSelectOption key={option.value} value={option.value}>
                  {option.label}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
        )}

        {config.mode === "decrypt" && (
          <div className="space-y-2">
            <Label htmlFor="rsa-ciphertext-encoding">密文编码</Label>
            <NativeSelect
              id="rsa-ciphertext-encoding"
              onChange={(event) => {
                updateCiphertextEncoding(
                  event.target.value as RsaBinaryEncoding,
                );
              }}
              value={config.ciphertextEncoding}
            >
              {RSA_BINARY_ENCODING_OPTIONS.map((option) => (
                <NativeSelectOption key={option.value} value={option.value}>
                  {option.label}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
        )}

        {config.mode === "verify" && (
          <div className="space-y-2">
            <Label htmlFor="rsa-signature-encoding">签名编码</Label>
            <NativeSelect
              id="rsa-signature-encoding"
              onChange={(event) => {
                updateSignatureEncoding(
                  event.target.value as RsaBinaryEncoding,
                );
              }}
              value={config.signatureEncoding}
            >
              {RSA_BINARY_ENCODING_OPTIONS.map((option) => (
                <NativeSelectOption key={option.value} value={option.value}>
                  {option.label}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="rsa-key-text">RSA 密钥</Label>
          <Textarea
            className="min-h-[220px] font-mono text-xs"
            id="rsa-key-text"
            onChange={(event) => {
              updateKeyText(event.target.value);
            }}
            placeholder={getKeyPlaceholder(config.mode, config.keyFormat)}
            value={config.keyText}
          />
          <p className="text-xs text-muted-foreground">
            {getRecommendedKeyHint(config.mode)}
          </p>
        </div>

        {config.mode === "encrypt" && (
          <div className="space-y-2">
            <Label htmlFor="rsa-plaintext">
              {getModePrimaryInputLabel(config.mode)}
            </Label>
            <Textarea
              className="min-h-[180px] font-mono text-xs"
              id="rsa-plaintext"
              onChange={(event) => {
                updatePlaintext(event.target.value);
              }}
              placeholder="输入需要加密的短文本内容。"
              value={config.plaintext}
            />
            <p className="text-xs text-muted-foreground">
              {getModePrimaryInputDescription(config.mode)}
            </p>
          </div>
        )}

        {config.mode === "decrypt" && (
          <div className="space-y-2">
            <Label htmlFor="rsa-ciphertext">
              {getModePrimaryInputLabel(config.mode)}
            </Label>
            <Textarea
              className="min-h-[180px] font-mono text-xs"
              id="rsa-ciphertext"
              onChange={(event) => {
                updateCiphertext(event.target.value);
              }}
              placeholder="输入需要解密的密文内容。"
              value={config.ciphertext}
            />
            <p className="text-xs text-muted-foreground">
              {getModePrimaryInputDescription(config.mode)}
            </p>
          </div>
        )}

        {config.mode === "sign" && (
          <div className="space-y-2">
            <Label htmlFor="rsa-message-sign">
              {getModePrimaryInputLabel(config.mode)}
            </Label>
            <Textarea
              className="min-h-[180px] font-mono text-xs"
              id="rsa-message-sign"
              onChange={(event) => {
                updateMessage(event.target.value);
              }}
              placeholder="输入需要签名的原文内容。"
              value={config.message}
            />
            <p className="text-xs text-muted-foreground">
              {getModePrimaryInputDescription(config.mode)}
            </p>
          </div>
        )}

        {config.mode === "verify" && (
          <>
            <div className="space-y-2">
              <Label htmlFor="rsa-message-verify">
                {getModePrimaryInputLabel(config.mode)}
              </Label>
              <Textarea
                className="min-h-[140px] font-mono text-xs"
                id="rsa-message-verify"
                onChange={(event) => {
                  updateMessage(event.target.value);
                }}
                placeholder="输入需要验签的原文内容。"
                value={config.message}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rsa-signature-input">签名值</Label>
              <Textarea
                className="min-h-[140px] font-mono text-xs"
                id="rsa-signature-input"
                onChange={(event) => {
                  updateSignature(event.target.value);
                }}
                placeholder="输入待校验的签名值。"
                value={config.signature}
              />
              <p className="text-xs text-muted-foreground">
                {getModePrimaryInputDescription(config.mode)}
              </p>
            </div>
          </>
        )}

        <div className="rounded-lg border border-dashed p-3 text-sm">
          <div className="font-medium">安全规则</div>
          <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
            <li>所有 RSA 操作都在当前浏览器页面内完成。</li>
            <li>不会上传服务器，也不会自动保存明文、密钥、密文与签名。</li>
            <li>复制或下载后的数据将由浏览器和操作系统接管。</li>
          </ul>
        </div>
      </CardContent>

      <CardFooter className="flex flex-wrap gap-2">
        <Button
          disabled={loading}
          onClick={() => {
            void execute();
          }}
        >
          {loading ? "处理中..." : result ? "重新执行" : "执行"}
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
