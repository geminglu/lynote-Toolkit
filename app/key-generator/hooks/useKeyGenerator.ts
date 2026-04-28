"use client";

import { toast } from "lynote-ui/sonner";
import { useCallback, useMemo, useState } from "react";

import type {
  ApiKeyCharset,
  ApiKeyEncoding,
  KeyGenerationResult,
  KeyGeneratorConfig,
  KeyGeneratorType,
  RsaEncoding,
  SecretEncoding,
} from "../type";
import {
  DEFAULT_KEY_GENERATOR_CONFIG,
  downloadTextFile,
  generateKeyResult,
  getDefaultConfigByType,
} from "../utils";

function updateEncodingInConfig(
  config: KeyGeneratorConfig,
  encoding: ApiKeyEncoding | SecretEncoding | RsaEncoding,
): KeyGeneratorConfig {
  switch (config.type) {
    case "api-key":
      return {
        ...config,
        encoding: encoding as ApiKeyEncoding,
      };
    case "jwt-secret":
      return {
        ...config,
        encoding: encoding as Exclude<SecretEncoding, "jwk">,
      };
    case "aes-256":
      return {
        ...config,
        encoding: encoding as SecretEncoding,
      };
    case "hmac-sha256":
      return {
        ...config,
        encoding: encoding as SecretEncoding,
      };
    case "rsa-key-pair":
      return {
        ...config,
        encoding: encoding as RsaEncoding,
      };
  }
}

/**
 * 密钥生成工作台状态
 */
function useKeyGenerator() {
  const [config, setConfig] = useState<KeyGeneratorConfig>(
    DEFAULT_KEY_GENERATOR_CONFIG,
  );
  const [result, setResult] = useState<KeyGenerationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSensitiveData, setShowSensitiveData] = useState(false);

  const updateType = useCallback((type: KeyGeneratorType) => {
    setConfig(getDefaultConfigByType(type));
    setResult(null);
    setError("");
    setShowSensitiveData(false);
  }, []);

  const updateEncoding = useCallback(
    (encoding: ApiKeyEncoding | SecretEncoding | RsaEncoding) => {
      setConfig((previousConfig) =>
        updateEncodingInConfig(previousConfig, encoding),
      );
      setResult(null);
      setError("");
      setShowSensitiveData(false);
    },
    [],
  );

  const updateApiLength = useCallback((length: number) => {
    setConfig((previousConfig) =>
      previousConfig.type === "api-key"
        ? {
            ...previousConfig,
            length,
          }
        : previousConfig,
    );
    setResult(null);
    setError("");
  }, []);

  const updateApiCharset = useCallback((charset: ApiKeyCharset) => {
    setConfig((previousConfig) =>
      previousConfig.type === "api-key"
        ? {
            ...previousConfig,
            charset,
          }
        : previousConfig,
    );
    setResult(null);
    setError("");
  }, []);

  const updateJwtBytes = useCallback((bytes: number) => {
    setConfig((previousConfig) =>
      previousConfig.type === "jwt-secret"
        ? {
            ...previousConfig,
            bytes,
          }
        : previousConfig,
    );
    setResult(null);
    setError("");
  }, []);

  const updateHmacBytes = useCallback((bytes: number) => {
    setConfig((previousConfig) =>
      previousConfig.type === "hmac-sha256"
        ? {
            ...previousConfig,
            bytes,
          }
        : previousConfig,
    );
    setResult(null);
    setError("");
  }, []);

  const updateRsaModulusLength = useCallback(
    (modulusLength: 2048 | 3072 | 4096) => {
      setConfig((previousConfig) =>
        previousConfig.type === "rsa-key-pair"
          ? {
              ...previousConfig,
              modulusLength,
            }
          : previousConfig,
      );
      setResult(null);
      setError("");
    },
    [],
  );

  const resetToDefaults = useCallback(() => {
    setConfig(DEFAULT_KEY_GENERATOR_CONFIG);
    setResult(null);
    setError("");
    setShowSensitiveData(false);
  }, []);

  const clearResult = useCallback(() => {
    setResult(null);
    setError("");
    setShowSensitiveData(false);
  }, []);

  const toggleSensitiveData = useCallback((checked: boolean) => {
    setShowSensitiveData(checked);
  }, []);

  const generate = useCallback(async () => {
    if (!crypto?.subtle) {
      const nextError = "当前浏览器不支持 Web Crypto API，无法生成密钥。";
      setError(nextError);
      toast.error(nextError);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const nextResult = await generateKeyResult(config);

      setResult(nextResult);
      setShowSensitiveData(false);
      toast.success("密钥已生成，当前结果仅保留在本页面内存中。");
    } catch (generationError) {
      const nextError =
        generationError instanceof Error
          ? generationError.message
          : "密钥生成失败，请重试。";

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

      await navigator.clipboard.writeText(output.value);
      toast.success(`${output.title} 已复制到剪贴板。`);
    },
    [result],
  );

  const downloadOutput = useCallback(
    (outputId: string) => {
      const output = result?.outputs.find((item) => item.id === outputId);

      if (!output) {
        return;
      }

      downloadTextFile(output.filename, output.value, output.mimeType);
      toast.success(`${output.title} 已下载到本地文件。`);
    },
    [result],
  );

  const value = useMemo(
    () => ({
      config,
      result,
      loading,
      error,
      showSensitiveData,
      updateType,
      updateEncoding,
      updateApiLength,
      updateApiCharset,
      updateJwtBytes,
      updateHmacBytes,
      updateRsaModulusLength,
      resetToDefaults,
      clearResult,
      toggleSensitiveData,
      generate,
      copyOutput,
      downloadOutput,
    }),
    [
      clearResult,
      config,
      copyOutput,
      downloadOutput,
      error,
      generate,
      loading,
      resetToDefaults,
      result,
      showSensitiveData,
      toggleSensitiveData,
      updateApiCharset,
      updateApiLength,
      updateEncoding,
      updateHmacBytes,
      updateJwtBytes,
      updateRsaModulusLength,
      updateType,
    ],
  );

  return value;
}

export default useKeyGenerator;

export type KeyGeneratorContextValue = ReturnType<typeof useKeyGenerator>;
