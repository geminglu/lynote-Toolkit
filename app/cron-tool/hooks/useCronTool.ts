"use client";

import { toast } from "lynote-ui/sonner";
import { useCallback, useMemo, useState } from "react";

import type {
  CronDayStrategy,
  CronFieldKey,
  CronFieldMode,
  CronFieldState,
  CronIssue,
  CronToolState,
} from "../type";
import {
  CRON_FIELD_META,
  buildCronExpression,
  copyToClipboard,
  createDefaultCronToolState,
  describeCronExpression,
  parseCronExpression,
  syncExpression,
  validateCronState,
} from "../utils";

function syncWithPatch(state: CronToolState, patch: Partial<CronToolState>) {
  return syncExpression({ ...state, ...patch });
}

function normalizeFieldForMode(
  key: CronFieldKey,
  mode: CronFieldMode,
  field: CronFieldState,
): CronFieldState {
  const meta = CRON_FIELD_META[key];

  if (mode === "every" || mode === "unspecified") {
    return { ...field, mode };
  }

  if (mode === "specific") {
    return {
      ...field,
      mode,
      values: field.values || meta.defaultValue,
    };
  }

  if (mode === "range") {
    return {
      ...field,
      mode,
      start: field.start || meta.defaultValue,
      end:
        field.end || String(Math.min(meta.max, Number(meta.defaultValue) + 1)),
    };
  }

  return {
    ...field,
    mode,
    start: field.start || meta.defaultValue,
    step: field.step || meta.defaultStep,
  };
}

function useCronTool() {
  const [state, setState] = useState<CronToolState>(() =>
    createDefaultCronToolState(),
  );
  const [issues, setIssues] = useState<CronIssue[]>(() =>
    validateCronState(createDefaultCronToolState()),
  );

  const description = useMemo(() => describeCronExpression(state), [state]);
  const generatedExpression = useMemo(
    () => buildCronExpression(state),
    [state],
  );

  const commitState = useCallback(
    (nextState: CronToolState, nextIssues?: CronIssue[]) => {
      const synced = syncExpression(nextState);
      setState(synced);
      setIssues(nextIssues ?? validateCronState(synced));
    },
    [],
  );

  const updateExpression = useCallback((expression: string) => {
    setState((previousState) => ({ ...previousState, expression }));
  }, []);

  const parseExpression = useCallback(() => {
    const result = parseCronExpression(state.expression);

    if (!result.ok) {
      setIssues(result.issues);
      toast.error(result.issues[0]?.message ?? "解析失败，请检查表达式。");
      return;
    }

    setState(result.state);
    setIssues(result.issues);
    toast.success("已解析并回显到界面。");
  }, [state.expression]);

  const updateDayStrategy = useCallback((dayStrategy: CronDayStrategy) => {
    setState((previousState) => {
      const nextState = syncWithPatch(previousState, { dayStrategy });
      setIssues(validateCronState(nextState));
      return nextState;
    });
  }, []);

  const updateFieldMode = useCallback(
    (key: CronFieldKey, mode: CronFieldMode) => {
      setState((previousState) => {
        const fields = {
          ...previousState.fields,
          [key]: normalizeFieldForMode(key, mode, previousState.fields[key]),
        };
        const nextState = syncWithPatch(previousState, { fields });
        setIssues(validateCronState(nextState));
        return nextState;
      });
    },
    [],
  );

  const updateFieldValue = useCallback(
    (key: CronFieldKey, fieldPatch: Partial<CronFieldState>) => {
      setState((previousState) => {
        const fields = {
          ...previousState.fields,
          [key]: { ...previousState.fields[key], ...fieldPatch },
        };
        const nextState = syncWithPatch(previousState, { fields });
        setIssues(validateCronState(nextState));
        return nextState;
      });
    },
    [],
  );

  const toggleSpecificValue = useCallback(
    (key: CronFieldKey, value: string) => {
      setState((previousState) => {
        const field = previousState.fields[key];
        const values = new Set(field.values.split(",").filter(Boolean));

        if (values.has(value)) {
          values.delete(value);
        } else {
          values.add(value);
        }

        const nextValues = [...values]
          .map(Number)
          .sort((left, right) => left - right)
          .map(String)
          .join(",");
        const fields = {
          ...previousState.fields,
          [key]: { ...field, mode: "specific" as const, values: nextValues },
        };
        const nextState = syncWithPatch(previousState, { fields });
        setIssues(validateCronState(nextState));
        return nextState;
      });
    },
    [],
  );

  const applyPreset = useCallback((expression: string) => {
    const result = parseCronExpression(expression);

    if (!result.ok) {
      setIssues(result.issues);
      toast.error("预设表达式解析失败。");
      return;
    }

    setState(result.state);
    setIssues(result.issues);
  }, []);

  const resetToDefaults = useCallback(() => {
    const nextState = createDefaultCronToolState();
    commitState(nextState);
  }, [commitState]);

  const copyExpression = useCallback(async () => {
    await copyToClipboard(generatedExpression);
    toast.success("已复制 cron 表达式。");
  }, [generatedExpression]);

  const value = useMemo(
    () => ({
      state,
      issues,
      description,
      generatedExpression,
      updateExpression,
      parseExpression,
      updateDayStrategy,
      updateFieldMode,
      updateFieldValue,
      toggleSpecificValue,
      applyPreset,
      resetToDefaults,
      copyExpression,
    }),
    [
      applyPreset,
      copyExpression,
      description,
      generatedExpression,
      issues,
      parseExpression,
      resetToDefaults,
      state,
      toggleSpecificValue,
      updateDayStrategy,
      updateExpression,
      updateFieldMode,
      updateFieldValue,
    ],
  );

  return value;
}

export type CronToolContextValue = ReturnType<typeof useCronTool>;

export default useCronTool;
