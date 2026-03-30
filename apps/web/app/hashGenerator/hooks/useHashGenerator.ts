"use client";

import { toast } from "lynote-ui/sonner";
import { useCallback, useMemo, useState } from "react";

import type {
  GeneratorAlgorithm,
  HashAlgorithm,
  HashEncoding,
  HashGenerationResult,
  HashGeneratorConfig,
  HashInputType,
  HashMode,
  HmacAlgorithm,
} from "../type";
import {
  DEFAULT_HASH_GENERATOR_CONFIG,
  MAX_FILE_SIZE_BYTES,
  downloadTextFile,
  formatFileSize,
  generateHashResult,
  getDefaultAlgorithmsByMode,
} from "../utils";

function createConfigByInputType(
  inputType: HashInputType,
  previousConfig: HashGeneratorConfig,
): HashGeneratorConfig {
  const sharedFields = {
    mode: previousConfig.mode,
    algorithms: previousConfig.algorithms,
    encoding: previousConfig.encoding,
    expectedHash: previousConfig.expectedHash,
    secret: previousConfig.secret,
  };

  return inputType === "text"
    ? {
        inputType,
        text: "",
        ...sharedFields,
      }
    : {
        inputType,
        file: null,
        ...sharedFields,
      };
}

function toggleAlgorithmInList(
  algorithms: GeneratorAlgorithm[],
  algorithm: GeneratorAlgorithm,
) {
  if (algorithms.includes(algorithm)) {
    return algorithms.filter((item) => item !== algorithm);
  }

  return [...algorithms, algorithm];
}

function createConfigByMode(
  mode: HashMode,
  previousConfig: HashGeneratorConfig,
): HashGeneratorConfig {
  return {
    ...previousConfig,
    mode,
    algorithms: getDefaultAlgorithmsByMode(mode),
    expectedHash: "",
  };
}

function useHashGenerator() {
  const [config, setConfig] = useState<HashGeneratorConfig>(
    DEFAULT_HASH_GENERATOR_CONFIG,
  );
  const [result, setResult] = useState<HashGenerationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const updateInputType = useCallback((inputType: HashInputType) => {
    setConfig((previousConfig) =>
      createConfigByInputType(inputType, previousConfig),
    );
    setResult(null);
    setError("");
  }, []);

  const updateMode = useCallback((mode: HashMode) => {
    setConfig((previousConfig) => createConfigByMode(mode, previousConfig));
    setResult(null);
    setError("");
  }, []);

  const updateEncoding = useCallback((encoding: HashEncoding) => {
    setConfig((previousConfig) => ({
      ...previousConfig,
      encoding,
    }));
    setResult(null);
    setError("");
  }, []);

  const toggleAlgorithm = useCallback(
    (algorithm: HashAlgorithm | HmacAlgorithm) => {
      setConfig((previousConfig) => ({
        ...previousConfig,
        algorithms: toggleAlgorithmInList(previousConfig.algorithms, algorithm),
      }));
      setResult(null);
      setError("");
    },
    [],
  );

  const updateText = useCallback((text: string) => {
    setConfig((previousConfig) =>
      previousConfig.inputType === "text"
        ? {
            ...previousConfig,
            text,
          }
        : previousConfig,
    );
    setResult(null);
    setError("");
  }, []);

  const updateExpectedHash = useCallback((expectedHash: string) => {
    setConfig((previousConfig) => ({
      ...previousConfig,
      expectedHash,
    }));
    setResult(null);
    setError("");
  }, []);

  const updateSecret = useCallback((secret: string) => {
    setConfig((previousConfig) => ({
      ...previousConfig,
      secret,
    }));
    setResult(null);
    setError("");
  }, []);

  const setSelectedFile = useCallback((file: File | null) => {
    if (file && file.size > MAX_FILE_SIZE_BYTES) {
      const nextError = `文件大小超出限制，当前仅支持不超过 ${formatFileSize(MAX_FILE_SIZE_BYTES)} 的单文件。`;

      setError(nextError);
      setResult(null);
      toast.error(nextError);
      return;
    }

    setConfig((previousConfig) =>
      previousConfig.inputType === "file"
        ? {
            ...previousConfig,
            file,
          }
        : previousConfig,
    );
    setResult(null);
    setError("");
  }, []);

  const clearSelectedFile = useCallback(() => {
    setConfig((previousConfig) =>
      previousConfig.inputType === "file"
        ? {
            ...previousConfig,
            file: null,
          }
        : previousConfig,
    );
    setResult(null);
    setError("");
  }, []);

  const resetToDefaults = useCallback(() => {
    setConfig(DEFAULT_HASH_GENERATOR_CONFIG);
    setResult(null);
    setError("");
  }, []);

  const clearResult = useCallback(() => {
    setResult(null);
    setError("");
  }, []);

  const generate = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const nextResult = await generateHashResult(config);

      setResult(nextResult);
      toast.success(
        `${config.mode === "hmac" ? "HMAC" : "哈希"} 结果已生成，当前结果仅保留在本页面内存中。`,
      );
    } catch (generationError) {
      const nextError =
        generationError instanceof Error
          ? generationError.message
          : `${config.mode === "hmac" ? "HMAC" : "哈希"} 生成失败，请重试。`;

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
      toast.success(`${output.title} 结果已复制到剪贴板。`);
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
      toast.success(`${output.title} 结果已下载到本地文件。`);
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
      updateInputType,
      updateEncoding,
      toggleAlgorithm,
      updateText,
      updateExpectedHash,
      updateSecret,
      setSelectedFile,
      clearSelectedFile,
      resetToDefaults,
      clearResult,
      generate,
      copyOutput,
      downloadOutput,
    }),
    [
      clearResult,
      clearSelectedFile,
      config,
      copyOutput,
      downloadOutput,
      error,
      generate,
      loading,
      resetToDefaults,
      result,
      setSelectedFile,
      toggleAlgorithm,
      updateEncoding,
      updateExpectedHash,
      updateMode,
      updateInputType,
      updateSecret,
      updateText,
    ],
  );

  return value;
}

export default useHashGenerator;

export type HashGeneratorContextValue = ReturnType<typeof useHashGenerator>;
