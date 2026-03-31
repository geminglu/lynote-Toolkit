"use client";

import { toast } from "lynote-ui/sonner";
import { useCallback, useMemo, useState } from "react";

import type {
  RsaBinaryEncoding,
  RsaHashAlgorithm,
  RsaKeyFormat,
  RsaSignatureAlgorithm,
  RsaToolConfig,
  RsaToolMode,
  RsaToolResult,
} from "../type";
import {
  DEFAULT_RSA_TOOL_CONFIG,
  copyToClipboard,
  downloadOutputItem,
  executeRsaTool,
  getModeLabel,
} from "../utils";

/**
 * RSA 工具状态与交互逻辑
 */
function useRsaTool() {
  const [config, setConfig] = useState<RsaToolConfig>(DEFAULT_RSA_TOOL_CONFIG);
  const [result, setResult] = useState<RsaToolResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const clearTransientState = useCallback(() => {
    setResult(null);
    setError("");
  }, []);

  const updateMode = useCallback(
    (mode: RsaToolMode) => {
      setConfig((previousConfig) => ({
        ...previousConfig,
        mode,
      }));
      clearTransientState();
    },
    [clearTransientState],
  );

  const updateKeyFormat = useCallback(
    (keyFormat: RsaKeyFormat) => {
      setConfig((previousConfig) => ({
        ...previousConfig,
        keyFormat,
      }));
      clearTransientState();
    },
    [clearTransientState],
  );

  const updateKeyText = useCallback(
    (keyText: string) => {
      setConfig((previousConfig) => ({
        ...previousConfig,
        keyText,
      }));
      clearTransientState();
    },
    [clearTransientState],
  );

  const updateEncryptionHash = useCallback(
    (encryptionHash: RsaHashAlgorithm) => {
      setConfig((previousConfig) => ({
        ...previousConfig,
        encryptionHash,
      }));
      clearTransientState();
    },
    [clearTransientState],
  );

  const updateSignatureAlgorithm = useCallback(
    (signatureAlgorithm: RsaSignatureAlgorithm) => {
      setConfig((previousConfig) => ({
        ...previousConfig,
        signatureAlgorithm,
      }));
      clearTransientState();
    },
    [clearTransientState],
  );

  const updateSignatureHash = useCallback(
    (signatureHash: RsaHashAlgorithm) => {
      setConfig((previousConfig) => ({
        ...previousConfig,
        signatureHash,
      }));
      clearTransientState();
    },
    [clearTransientState],
  );

  const updateOutputEncoding = useCallback(
    (outputEncoding: RsaBinaryEncoding) => {
      setConfig((previousConfig) => ({
        ...previousConfig,
        outputEncoding,
      }));
      clearTransientState();
    },
    [clearTransientState],
  );

  const updateCiphertextEncoding = useCallback(
    (ciphertextEncoding: RsaBinaryEncoding) => {
      setConfig((previousConfig) => ({
        ...previousConfig,
        ciphertextEncoding,
      }));
      clearTransientState();
    },
    [clearTransientState],
  );

  const updateSignatureEncoding = useCallback(
    (signatureEncoding: RsaBinaryEncoding) => {
      setConfig((previousConfig) => ({
        ...previousConfig,
        signatureEncoding,
      }));
      clearTransientState();
    },
    [clearTransientState],
  );

  const updatePlaintext = useCallback(
    (plaintext: string) => {
      setConfig((previousConfig) => ({
        ...previousConfig,
        plaintext,
      }));
      clearTransientState();
    },
    [clearTransientState],
  );

  const updateCiphertext = useCallback(
    (ciphertext: string) => {
      setConfig((previousConfig) => ({
        ...previousConfig,
        ciphertext,
      }));
      clearTransientState();
    },
    [clearTransientState],
  );

  const updateMessage = useCallback(
    (message: string) => {
      setConfig((previousConfig) => ({
        ...previousConfig,
        message,
      }));
      clearTransientState();
    },
    [clearTransientState],
  );

  const updateSignature = useCallback(
    (signature: string) => {
      setConfig((previousConfig) => ({
        ...previousConfig,
        signature,
      }));
      clearTransientState();
    },
    [clearTransientState],
  );

  const updatePssSaltLength = useCallback(
    (pssSaltLength: number) => {
      setConfig((previousConfig) => ({
        ...previousConfig,
        pssSaltLength,
      }));
      clearTransientState();
    },
    [clearTransientState],
  );

  const resetToDefaults = useCallback(() => {
    setConfig(DEFAULT_RSA_TOOL_CONFIG);
    clearTransientState();
  }, [clearTransientState]);

  const clearResult = useCallback(() => {
    clearTransientState();
  }, [clearTransientState]);

  const execute = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const nextResult = await executeRsaTool(config);

      setResult(nextResult);
      toast.success(
        `${getModeLabel(config.mode)}结果已生成，当前仅保留在页面内存中。`,
      );
    } catch (executionError) {
      const nextError =
        executionError instanceof Error
          ? executionError.message
          : "RSA 操作失败，请重试。";

      setError(nextError);
      setResult(null);
      toast.error(nextError);
    } finally {
      setLoading(false);
    }
  }, [config]);

  const copyOutput = useCallback(
    async (outputId: string) => {
      const output = result?.outputs.find((item) => item.id === outputId);

      if (!output) {
        return;
      }

      await copyToClipboard(output.value);
      toast.success(`${output.title}已复制到剪贴板。`);
    },
    [result],
  );

  const downloadOutput = useCallback(
    (outputId: string) => {
      const output = result?.outputs.find((item) => item.id === outputId);

      if (!output) {
        return;
      }

      downloadOutputItem(output);
      toast.success(`${output.title}已下载到本地文件。`);
    },
    [result],
  );

  const value = useMemo(
    () => ({
      config,
      result,
      loading,
      error,
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
      copyOutput,
      downloadOutput,
    }),
    [
      clearResult,
      config,
      copyOutput,
      downloadOutput,
      error,
      execute,
      loading,
      resetToDefaults,
      result,
      updateCiphertext,
      updateCiphertextEncoding,
      updateEncryptionHash,
      updateKeyFormat,
      updateKeyText,
      updateMessage,
      updateMode,
      updateOutputEncoding,
      updatePlaintext,
      updatePssSaltLength,
      updateSignature,
      updateSignatureAlgorithm,
      updateSignatureEncoding,
      updateSignatureHash,
    ],
  );

  return value;
}

export default useRsaTool;

export type RsaToolContextValue = ReturnType<typeof useRsaTool>;
