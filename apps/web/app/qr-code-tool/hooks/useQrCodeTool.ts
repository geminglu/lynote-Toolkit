"use client";

import { toast } from "lynote-ui/sonner";
import type { ClipboardEvent } from "react";
import { useCallback, useMemo, useState } from "react";

import type { QrCodeToolConfig, QrLogoState, QrParseResult } from "../type";
import {
  DEFAULT_QR_CODE_TOOL_CONFIG,
  MAX_LOGO_FILE_SIZE,
  createImageMimeType,
  extractImageFileFromClipboard,
  formatFileSize,
  generateQrResult,
  getExampleValue,
  parseQrFromFile,
  readFileAsDataUrl,
} from "../utils";

/**
 * 二维码工具的主状态与交互逻辑。
 */
function useQrCodeTool() {
  const [config, setConfig] = useState<QrCodeToolConfig>(
    DEFAULT_QR_CODE_TOOL_CONFIG,
  );
  const [logoState, setLogoState] = useState<QrLogoState | null>(null);
  const [parseResult, setParseResult] = useState<QrParseResult | null>(null);
  const [parseLoading, setParseLoading] = useState(false);
  const [parseError, setParseError] = useState("");

  const generateState = useMemo(() => {
    if (config.mode !== "generate") {
      return {
        result: null,
        error: "",
      };
    }

    try {
      return {
        result: generateQrResult(config, logoState),
        error: "",
      };
    } catch (error) {
      return {
        result: null,
        error:
          error instanceof Error
            ? error.message
            : "二维码内容生成失败，请检查输入。",
      };
    }
  }, [config, logoState]);

  const updateConfig = useCallback(
    <Key extends keyof QrCodeToolConfig>(
      key: Key,
      value: QrCodeToolConfig[Key],
    ) => {
      setConfig((previousConfig) => ({
        ...previousConfig,
        [key]: value,
      }));
    },
    [],
  );

  const switchMode = useCallback((mode: QrCodeToolConfig["mode"]) => {
    setConfig((previousConfig) => ({
      ...previousConfig,
      mode,
    }));

    if (mode === "generate") {
      setParseError("");
    }
  }, []);

  const fillExample = useCallback(() => {
    setConfig((previousConfig) => {
      switch (previousConfig.contentType) {
        case "text":
          return {
            ...previousConfig,
            textValue: getExampleValue("text"),
          };
        case "url":
          return {
            ...previousConfig,
            urlValue: getExampleValue("url"),
          };
        case "wifi":
          return {
            ...previousConfig,
            wifiSsid: getExampleValue("wifi"),
            wifiPassword: "guest-2026",
            wifiEncryption: "WPA",
            wifiHidden: false,
          };
        case "phone":
          return {
            ...previousConfig,
            phoneNumber: DEFAULT_QR_CODE_TOOL_CONFIG.phoneNumber,
          };
        case "sms":
          return {
            ...previousConfig,
            smsNumber: DEFAULT_QR_CODE_TOOL_CONFIG.smsNumber,
            smsMessage: getExampleValue("sms"),
          };
        case "email":
          return {
            ...previousConfig,
            emailTo: getExampleValue("email"),
            emailSubject: DEFAULT_QR_CODE_TOOL_CONFIG.emailSubject,
            emailBody: DEFAULT_QR_CODE_TOOL_CONFIG.emailBody,
          };
        default:
          return previousConfig;
      }
    });

    toast.success("已填充当前内容类型的示例配置。");
  }, []);

  const resetToDefaults = useCallback(() => {
    setConfig(DEFAULT_QR_CODE_TOOL_CONFIG);
    setLogoState(null);
    setParseResult(null);
    setParseError("");
    setParseLoading(false);
    toast.success("已恢复二维码工具默认配置。");
  }, []);

  const setLogoFile = useCallback(async (file: File | null) => {
    if (!file) {
      setLogoState(null);
      return;
    }

    if (file.size > MAX_LOGO_FILE_SIZE) {
      const message = `Logo 图片请控制在 ${formatFileSize(MAX_LOGO_FILE_SIZE)} 以内。`;

      toast.error(message);
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);

      setLogoState({
        name: file.name,
        size: file.size,
        dataUrl,
      });
      toast.success("Logo 图片已导入，二维码预览会自动刷新。");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Logo 图片读取失败。",
      );
    }
  }, []);

  const clearLogo = useCallback(() => {
    setLogoState(null);
  }, []);

  const parseFile = useCallback(async (file: File | null) => {
    if (!file) {
      return;
    }

    setParseLoading(true);
    setParseError("");

    try {
      const nextResult = await parseQrFromFile(file);

      setConfig((previousConfig) => ({
        ...previousConfig,
        mode: "parse",
      }));
      setParseResult(nextResult);
      toast.success("二维码解析成功。");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "二维码解析失败，请稍后重试。";

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
        toast.message("剪贴板里没有检测到图片，请先复制二维码截图。");
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
      logoState,
      parseResult,
      parseLoading,
      parseError,
      generateResult: generateState.result,
      generateError: generateState.error,
      updateConfig,
      switchMode,
      fillExample,
      resetToDefaults,
      setLogoFile,
      clearLogo,
      parseFile,
      parseClipboard,
      clearParseResult,
      copyText,
      createImageMimeType,
    }),
    [
      clearLogo,
      clearParseResult,
      config,
      copyText,
      generateState.error,
      generateState.result,
      logoState,
      parseClipboard,
      parseError,
      parseFile,
      parseLoading,
      parseResult,
      resetToDefaults,
      setLogoFile,
      switchMode,
      updateConfig,
      fillExample,
    ],
  );

  return value;
}

export type QrCodeToolContextValue = ReturnType<typeof useQrCodeTool>;

export default useQrCodeTool;
