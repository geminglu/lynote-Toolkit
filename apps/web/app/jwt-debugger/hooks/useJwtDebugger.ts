"use client";

import { toast } from "lynote-ui/sonner";
import { useCallback, useMemo, useState } from "react";

import type {
  JwtDebuggerConfig,
  JwtDebuggerResult,
  JwtVerificationKeyType,
} from "../type";
import {
  DEFAULT_JWT_DEBUGGER_CONFIG,
  copyToClipboard,
  executeJwtDebugger,
} from "../utils";

/**
 * JWT 调试工具状态与交互逻辑
 */
function useJwtDebugger() {
  const [config, setConfig] = useState<JwtDebuggerConfig>(
    DEFAULT_JWT_DEBUGGER_CONFIG,
  );
  const [result, setResult] = useState<JwtDebuggerResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const clearTransientState = useCallback(() => {
    setResult(null);
    setError("");
  }, []);

  const updateToken = useCallback(
    (token: string) => {
      setConfig((previousConfig) => ({
        ...previousConfig,
        token,
      }));
      clearTransientState();
    },
    [clearTransientState],
  );

  const updateVerificationEnabled = useCallback(
    (verificationEnabled: boolean) => {
      setConfig((previousConfig) => ({
        ...previousConfig,
        verificationEnabled,
      }));
      clearTransientState();
    },
    [clearTransientState],
  );

  const updateVerificationKeyType = useCallback(
    (verificationKeyType: JwtVerificationKeyType) => {
      setConfig((previousConfig) => ({
        ...previousConfig,
        verificationKeyType,
      }));
      clearTransientState();
    },
    [clearTransientState],
  );

  const updateVerificationKey = useCallback(
    (verificationKey: string) => {
      setConfig((previousConfig) => ({
        ...previousConfig,
        verificationKey,
      }));
      clearTransientState();
    },
    [clearTransientState],
  );

  const updateClockToleranceSeconds = useCallback(
    (clockToleranceSeconds: number) => {
      setConfig((previousConfig) => ({
        ...previousConfig,
        clockToleranceSeconds: Number.isFinite(clockToleranceSeconds)
          ? Math.max(0, clockToleranceSeconds)
          : 0,
      }));
      clearTransientState();
    },
    [clearTransientState],
  );

  const resetToDefaults = useCallback(() => {
    setConfig(DEFAULT_JWT_DEBUGGER_CONFIG);
    clearTransientState();
  }, [clearTransientState]);

  const clearResult = useCallback(() => {
    clearTransientState();
  }, [clearTransientState]);

  const execute = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const nextResult = await executeJwtDebugger(config);

      setResult(nextResult);
      toast.success(
        `${config.verificationEnabled ? "JWT 解析与验签" : "JWT 解析"}已完成，当前结果仅保留在本页面内存中。`,
      );
    } catch (executionError) {
      const nextError =
        executionError instanceof Error
          ? executionError.message
          : "JWT 解析失败，请重试。";

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
      updateToken,
      updateVerificationEnabled,
      updateVerificationKeyType,
      updateVerificationKey,
      updateClockToleranceSeconds,
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
      updateClockToleranceSeconds,
      updateToken,
      updateVerificationEnabled,
      updateVerificationKey,
      updateVerificationKeyType,
    ],
  );

  return value;
}

export type JwtDebuggerContextValue = ReturnType<typeof useJwtDebugger>;

export default useJwtDebugger;
