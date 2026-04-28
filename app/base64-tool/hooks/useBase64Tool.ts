"use client";

import { toast } from "lynote-ui/sonner";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type {
  Base64TextDecoding,
  Base64ToolConfig,
  Base64ToolInputMode,
  Base64ToolOutputMode,
  Base64ToolResult,
} from "../type";
import {
  copyToClipboard,
  createExampleInput,
  DEFAULT_BASE64_TOOL_CONFIG,
  downloadTextFile,
  formatFileSize,
  generateBase64ToolResult,
  MAX_FILE_SIZE_BYTES,
  readFileAsBytes,
} from "../utils";

type FileState = {
  file: File | null;
  bytes: Uint8Array | null;
};

/**
 * Base64 工具的主状态与交互逻辑。
 */
function useBase64Tool() {
  const [config, setConfig] = useState<Base64ToolConfig>(
    DEFAULT_BASE64_TOOL_CONFIG,
  );
  const [fileState, setFileState] = useState<FileState>({
    file: null,
    bytes: null,
  });
  const [result, setResult] = useState<Base64ToolResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const requestIdRef = useRef(0);

  useEffect(() => {
    const hasInput =
      config.inputMode === "file"
        ? Boolean(fileState.file && fileState.bytes)
        : Boolean(config.input.trim());

    if (!hasInput) {
      setResult(null);
      setError("");
      setLoading(false);
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setLoading(true);

    const timer = window.setTimeout(() => {
      try {
        const nextResult = generateBase64ToolResult(config, fileState);

        if (requestIdRef.current !== requestId) {
          return;
        }

        setResult(nextResult);
        setError("");
      } catch (nextError) {
        if (requestIdRef.current !== requestId) {
          return;
        }

        setResult(null);
        setError(
          nextError instanceof Error
            ? nextError.message
            : "Base64 处理失败，请检查输入内容。",
        );
      } finally {
        if (requestIdRef.current === requestId) {
          setLoading(false);
        }
      }
    }, 120);

    return () => {
      window.clearTimeout(timer);
    };
  }, [config, fileState]);

  const updateInput = useCallback((input: string) => {
    setConfig((previousConfig) => ({
      ...previousConfig,
      input,
    }));
  }, []);

  const updateInputMode = useCallback((inputMode: Base64ToolInputMode) => {
    setConfig((previousConfig) => ({
      ...previousConfig,
      inputMode,
      input:
        inputMode === "file"
          ? ""
          : previousConfig.inputMode === "file"
            ? ""
            : previousConfig.input,
      lineByLine:
        inputMode === "file" || inputMode === "data-url"
          ? false
          : previousConfig.lineByLine,
    }));

    if (inputMode !== "file") {
      setFileState({
        file: null,
        bytes: null,
      });
    }
  }, []);

  const updateOutputMode = useCallback((outputMode: Base64ToolOutputMode) => {
    setConfig((previousConfig) => ({
      ...previousConfig,
      outputMode,
    }));
  }, []);

  const updateTextDecoding = useCallback((textDecoding: Base64TextDecoding) => {
    setConfig((previousConfig) => ({
      ...previousConfig,
      textDecoding,
    }));
  }, []);

  const updateDataUrlMimeType = useCallback((dataUrlMimeType: string) => {
    setConfig((previousConfig) => ({
      ...previousConfig,
      dataUrlMimeType,
    }));
  }, []);

  const updateIgnoreWhitespace = useCallback((ignoreWhitespace: boolean) => {
    setConfig((previousConfig) => ({
      ...previousConfig,
      ignoreWhitespace,
    }));
  }, []);

  const updateAutoPad = useCallback((autoPad: boolean) => {
    setConfig((previousConfig) => ({
      ...previousConfig,
      autoPad,
    }));
  }, []);

  const updateKeepBase64UrlPadding = useCallback(
    (keepBase64UrlPadding: boolean) => {
      setConfig((previousConfig) => ({
        ...previousConfig,
        keepBase64UrlPadding,
      }));
    },
    [],
  );

  const updateLineByLine = useCallback((lineByLine: boolean) => {
    setConfig((previousConfig) => ({
      ...previousConfig,
      lineByLine,
    }));
  }, []);

  const fillExample = useCallback(() => {
    if (config.inputMode === "file") {
      toast.message("文件模式请直接选择本地文件，示例不会自动填充。");
      return;
    }

    setConfig((previousConfig) => ({
      ...previousConfig,
      input: createExampleInput(previousConfig.inputMode),
    }));
    toast.success("已填充当前模式的示例内容。");
  }, [config.inputMode]);

  const clearInput = useCallback(() => {
    setConfig((previousConfig) => ({
      ...previousConfig,
      input: "",
    }));
    setFileState({
      file: null,
      bytes: null,
    });
  }, []);

  const resetToDefaults = useCallback(() => {
    setConfig(DEFAULT_BASE64_TOOL_CONFIG);
    setFileState({
      file: null,
      bytes: null,
    });
  }, []);

  const setSelectedFile = useCallback(async (file: File | null) => {
    if (!file) {
      setFileState({
        file: null,
        bytes: null,
      });
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      const nextError = `文件大小超出限制，当前仅支持不超过 ${formatFileSize(MAX_FILE_SIZE_BYTES)} 的单文件。`;

      setError(nextError);
      setResult(null);
      toast.error(nextError);
      return;
    }

    setLoading(true);

    try {
      const bytes = await readFileAsBytes(file);

      setFileState({
        file,
        bytes,
      });
      setError("");
      toast.success("文件已导入，结果将在当前页面内存中即时更新。");
    } catch (nextError) {
      const message =
        nextError instanceof Error ? nextError.message : "文件读取失败。";

      setFileState({
        file: null,
        bytes: null,
      });
      setError(message);
      setResult(null);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearSelectedFile = useCallback(() => {
    setFileState({
      file: null,
      bytes: null,
    });
  }, []);

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

      downloadTextFile(output.filename, output.value, output.mimeType);
      toast.success(`${output.title}已下载到本地文件。`);
    },
    [result],
  );

  const value = useMemo(
    () => ({
      config,
      fileState,
      result,
      loading,
      error,
      updateInput,
      updateInputMode,
      updateOutputMode,
      updateTextDecoding,
      updateDataUrlMimeType,
      updateIgnoreWhitespace,
      updateAutoPad,
      updateKeepBase64UrlPadding,
      updateLineByLine,
      fillExample,
      clearInput,
      resetToDefaults,
      setSelectedFile,
      clearSelectedFile,
      copyOutput,
      downloadOutput,
    }),
    [
      clearInput,
      clearSelectedFile,
      config,
      copyOutput,
      downloadOutput,
      error,
      fileState,
      fillExample,
      loading,
      resetToDefaults,
      result,
      setSelectedFile,
      updateAutoPad,
      updateDataUrlMimeType,
      updateIgnoreWhitespace,
      updateInput,
      updateInputMode,
      updateKeepBase64UrlPadding,
      updateLineByLine,
      updateOutputMode,
      updateTextDecoding,
    ],
  );

  return value;
}

export type Base64ToolContextValue = ReturnType<typeof useBase64Tool>;

export default useBase64Tool;
