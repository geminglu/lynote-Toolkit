"use client";

import { toast } from "lynote-ui/sonner";
import { useCallback, useMemo, useState } from "react";

import type {
  UrlToolConfig,
  UrlToolInputMode,
  UrlToolOperation,
  UrlToolResult,
} from "../type";
import {
  DEFAULT_URL_TOOL_CONFIG,
  copyToClipboard,
  executeUrlTool,
  getAllowedOperationsByInputMode,
} from "../utils";

/**
 * URL 工具状态与交互逻辑
 */
function useUrlTool() {
  const [config, setConfig] = useState<UrlToolConfig>(DEFAULT_URL_TOOL_CONFIG);
  const [result, setResult] = useState<UrlToolResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const clearTransientState = useCallback(() => {
    setResult(null);
    setError("");
  }, []);

  const updateInput = useCallback(
    (input: string) => {
      setConfig((previousConfig) => ({
        ...previousConfig,
        input,
      }));
      clearTransientState();
    },
    [clearTransientState],
  );

  const updateInputMode = useCallback(
    (inputMode: UrlToolInputMode) => {
      setConfig((previousConfig) => {
        const allowedOperations = getAllowedOperationsByInputMode(inputMode);
        const nextOperation = allowedOperations.includes(
          previousConfig.operation,
        )
          ? previousConfig.operation
          : allowedOperations[0];

        return {
          ...previousConfig,
          inputMode,
          operation: nextOperation,
        };
      });
      clearTransientState();
    },
    [clearTransientState],
  );

  const updateOperation = useCallback(
    (operation: UrlToolOperation) => {
      setConfig((previousConfig) => ({
        ...previousConfig,
        operation,
      }));
      clearTransientState();
    },
    [clearTransientState],
  );

  const updatePlusAsSpace = useCallback(
    (plusAsSpace: boolean) => {
      setConfig((previousConfig) => ({
        ...previousConfig,
        plusAsSpace,
      }));
      clearTransientState();
    },
    [clearTransientState],
  );

  const resetToDefaults = useCallback(() => {
    setConfig(DEFAULT_URL_TOOL_CONFIG);
    clearTransientState();
  }, [clearTransientState]);

  const clearResult = useCallback(() => {
    clearTransientState();
  }, [clearTransientState]);

  const execute = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const nextResult = await executeUrlTool(config);

      setResult(nextResult);
      toast.success(
        `URL ${config.operation === "parse" ? "解析" : config.operation === "encode" ? "编码" : "解码"}已完成，当前结果仅保留在本页面内存中。`,
      );
    } catch (executionError) {
      const nextError =
        executionError instanceof Error
          ? executionError.message
          : "URL 处理失败，请重试。";

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

  const value = useMemo(
    () => ({
      config,
      result,
      loading,
      error,
      updateInput,
      updateInputMode,
      updateOperation,
      updatePlusAsSpace,
      resetToDefaults,
      clearResult,
      execute,
      copyOutput,
    }),
    [
      clearResult,
      config,
      copyOutput,
      error,
      execute,
      loading,
      resetToDefaults,
      result,
      updateInput,
      updateInputMode,
      updateOperation,
      updatePlusAsSpace,
    ],
  );

  return value;
}

export type UrlToolContextValue = ReturnType<typeof useUrlTool>;

export default useUrlTool;
