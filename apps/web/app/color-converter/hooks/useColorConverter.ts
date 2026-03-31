"use client";

import { toast } from "lynote-ui/sonner";
import { useCallback, useMemo, useState } from "react";

import type { ColorFormatMode } from "../type";
import {
  COLOR_FORMAT_SEQUENCE,
  createFormatCardData,
  DEFAULT_COLOR,
  formatColorByMode,
  getModeErrorMessage,
  getPrimaryPreviewValue,
  parseColorByMode,
  toInternalRgbColor,
  updateColorChannel,
} from "../utils";

function createDraftValues(color: ReturnType<typeof toInternalRgbColor>) {
  return Object.fromEntries(
    COLOR_FORMAT_SEQUENCE.map((mode) => [mode, formatColorByMode(mode, color)]),
  ) as Record<ColorFormatMode, string>;
}

/**
 * 颜色转换工具的核心状态与交互逻辑。
 */
function useColorConverter() {
  const [state, setState] = useState(() => {
    const initialColor = toInternalRgbColor(DEFAULT_COLOR);

    return {
      color: initialColor,
      draftValues: createDraftValues(initialColor),
    };
  });
  const [errors, setErrors] = useState<
    Partial<Record<ColorFormatMode, string>>
  >({});
  const { color, draftValues } = state;

  const clearModeError = useCallback((mode: ColorFormatMode) => {
    setErrors((previousErrors) => {
      if (!previousErrors[mode]) {
        return previousErrors;
      }

      return {
        ...previousErrors,
        [mode]: "",
      };
    });
  }, []);

  const updateDraftValue = useCallback(
    (mode: ColorFormatMode, input: string) => {
      setState((previousState) => ({
        ...previousState,
        draftValues: {
          ...previousState.draftValues,
          [mode]: input,
        },
      }));
    },
    [],
  );

  const commitModeInput = useCallback(
    (mode: ColorFormatMode, input: string) => {
      const nextColor = parseColorByMode(mode, input);

      if (!nextColor) {
        const nextError = getModeErrorMessage(mode);

        setErrors((previousErrors) => ({
          ...previousErrors,
          [mode]: nextError,
        }));
        toast.error(nextError);
        return false;
      }

      setState({
        color: nextColor,
        draftValues: createDraftValues(nextColor),
      });
      clearModeError(mode);
      return true;
    },
    [clearModeError],
  );

  const updateModeChannel = useCallback(
    (mode: ColorFormatMode, key: string, value: number) => {
      setState((previousState) => {
        const nextColor = updateColorChannel(
          previousState.color,
          mode,
          key,
          value,
        );

        return {
          color: nextColor,
          draftValues: createDraftValues(nextColor),
        };
      });
      clearModeError(mode);
    },
    [clearModeError],
  );

  const updatePickerHex = useCallback(
    (hexValue: string) => {
      const nextColor = parseColorByMode("hex", hexValue);

      if (!nextColor) {
        return;
      }

      setState((previousState) => {
        const mergedColor = {
          ...nextColor,
          alpha: previousState.color.alpha,
        };

        return {
          color: mergedColor,
          draftValues: createDraftValues(mergedColor),
        };
      });
      clearModeError("hex");
    },
    [clearModeError],
  );

  const updatePickerAlpha = useCallback((value: number) => {
    setState((previousState) => {
      const nextColor = {
        ...previousState.color,
        alpha: Math.min(Math.max(value, 0), 1),
      };

      return {
        color: nextColor,
        draftValues: createDraftValues(nextColor),
      };
    });
  }, []);

  const copyModeValue = useCallback(
    async (mode: ColorFormatMode) => {
      const value = formatColorByMode(mode, color);

      await navigator.clipboard.writeText(value);
      toast.success(`${value} 已复制到剪贴板。`);
    },
    [color],
  );

  const resetToDefault = useCallback(() => {
    const nextColor = toInternalRgbColor(DEFAULT_COLOR);

    setState({
      color: nextColor,
      draftValues: createDraftValues(nextColor),
    });
    setErrors({});
    toast.success("颜色已恢复为默认值。");
  }, []);

  const cardData = useMemo(() => createFormatCardData(color), [color]);
  const previewValue = useMemo(() => getPrimaryPreviewValue(color), [color]);

  const value = useMemo(
    () => ({
      color,
      cardData,
      draftValues,
      errors,
      previewValue,
      pickerHexValue: formatColorByMode("hex", color).slice(0, 7),
      commitModeInput,
      updateDraftValue,
      updateModeChannel,
      updatePickerHex,
      updatePickerAlpha,
      copyModeValue,
      resetToDefault,
    }),
    [
      cardData,
      color,
      commitModeInput,
      copyModeValue,
      draftValues,
      errors,
      previewValue,
      resetToDefault,
      updateDraftValue,
      updateModeChannel,
      updatePickerAlpha,
      updatePickerHex,
    ],
  );

  return value;
}

export default useColorConverter;

export type ColorConverterContextValue = ReturnType<typeof useColorConverter>;
