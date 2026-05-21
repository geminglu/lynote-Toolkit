"use client";

import { toast } from "lynote-ui/sonner";
import type { ClipboardEvent } from "react";
import { useCallback, useMemo, useState } from "react";

import type { BarcodeParseResult, BarcodeToolConfig } from "../type";
import {
  DEFAULT_BARCODE_TOOL_CONFIG,
  extractImageFileFromClipboard,
  generateBarcodeResult,
  getSymbologyMeta,
  parseBarcodeFromFile,
} from "../utils";

/**
 * 条形码工具的主状态与交互逻辑。
 */
function useBarcodeTool() {
  const [config, setConfig] = useState<BarcodeToolConfig>(
    DEFAULT_BARCODE_TOOL_CONFIG,
  );

  const [parseResult, setParseResult] = useState<BarcodeParseResult | null>(
    null,
  );
  const [parseLoading, setParseLoading] = useState(false);
  const [parseError, setParseError] = useState("");

  // 生成模式直接派生，避免在 effect 中触发额外渲染。
  const generateState = useMemo(() => {
    if (config.mode !== "generate") {
      return { result: null, error: "" };
    }

    if (!config.text.trim()) {
      return { result: null, error: "" };
    }

    try {
      return { result: generateBarcodeResult(config), error: "" };
    } catch (error) {
      return {
        result: null,
        error:
          error instanceof Error
            ? error.message
            : "条形码生成失败，请检查输入。",
      };
    }
  }, [config]);

  const updateConfig = useCallback(
    <Key extends keyof BarcodeToolConfig>(
      key: Key,
      value: BarcodeToolConfig[Key],
    ) => {
      setConfig((previousConfig) => ({
        ...previousConfig,
        [key]: value,
      }));
    },
    [],
  );

  const switchMode = useCallback((mode: BarcodeToolConfig["mode"]) => {
    setConfig((previousConfig) => ({
      ...previousConfig,
      mode,
    }));

    if (mode === "generate") {
      setParseError("");
    }
  }, []);

  // 切换码制时，自动同步示例值，避免上一个码制的内容触发校验失败。
  const switchSymbology = useCallback(
    (symbology: BarcodeToolConfig["symbology"]) => {
      setConfig((previousConfig) => ({
        ...previousConfig,
        symbology,
        text: getSymbologyMeta(symbology).example,
      }));
    },
    [],
  );

  const fillExample = useCallback(() => {
    setConfig((previousConfig) => ({
      ...previousConfig,
      text: getSymbologyMeta(previousConfig.symbology).example,
    }));
    toast.success("已填充当前码制的示例内容。");
  }, []);

  const resetToDefaults = useCallback(() => {
    setConfig(DEFAULT_BARCODE_TOOL_CONFIG);
    setParseResult(null);
    setParseError("");
    setParseLoading(false);
    toast.success("已恢复条形码工具默认配置。");
  }, []);

  const parseFile = useCallback(async (file: File | null) => {
    if (!file) {
      return;
    }

    setParseLoading(true);
    setParseError("");

    try {
      const nextResult = await parseBarcodeFromFile(file);

      setConfig((previousConfig) => ({
        ...previousConfig,
        mode: "parse",
      }));
      setParseResult(nextResult);
      toast.success("条形码解析成功。");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "条形码解析失败，请稍后重试。";

      setParseResult(null);
      setParseError(message);
      toast.error(message);
    } finally {
      setParseLoading(false);
    }
  }, []);

  const parseClipboard = useCallback(
    async (event: ClipboardEvent<HTMLElement>) => {
      const file = await extractImageFileFromClipboard(event);

      if (!file) {
        toast.message("剪贴板里没有检测到图片，请先复制条形码截图。");
        return;
      }

      await parseFile(file);
    },
    [parseFile],
  );

  const clearParseResult = useCallback(() => {
    setParseResult(null);
    setParseError("");
  }, []);

  const copyText = useCallback(
    async (value: string, successMessage: string) => {
      await navigator.clipboard.writeText(value);
      toast.success(successMessage);
    },
    [],
  );

  const value = useMemo(
    () => ({
      config,
      generateResult: generateState.result,
      generateError: generateState.error,
      parseResult,
      parseLoading,
      parseError,
      updateConfig,
      switchMode,
      switchSymbology,
      fillExample,
      resetToDefaults,
      parseFile,
      parseClipboard,
      clearParseResult,
      copyText,
    }),
    [
      config,
      generateState.result,
      generateState.error,
      parseResult,
      parseLoading,
      parseError,
      updateConfig,
      switchMode,
      switchSymbology,
      fillExample,
      resetToDefaults,
      parseFile,
      parseClipboard,
      clearParseResult,
      copyText,
    ],
  );

  return value;
}

export type BarcodeToolContextValue = ReturnType<typeof useBarcodeTool>;

export default useBarcodeTool;
