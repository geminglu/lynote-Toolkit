import { toast } from "lynote-ui/sonner";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { jsonFormattingDb } from "../db";
import type { EditorSide, JsonHistoryRecord, JsonSortOrder } from "../type";
import type { JsonTransformResult } from "../utils";
import {
  buildHistoryRecord,
  compressJsonText,
  createDownloadName,
  downloadTextFile,
  escapeJsonString,
  formatJsonText,
  getLeftEditorError,
  readJsonFile,
  sortHistoryRecords,
  sortJsonText,
} from "../utils";
import type { JsonFormattingWorkerResponse } from "../worker-types";

type WorkspaceState = {
  activeRecordId: string | null;
  leftValue: string;
  rightValue: string;
  leftError: string;
  leftSortOrder: JsonSortOrder;
  rightSortOrder: JsonSortOrder;
};
const INITIAL_WORKSPACE_STATE: WorkspaceState = {
  activeRecordId: null,
  leftValue: "",
  rightValue: "",
  leftError: "",
  leftSortOrder: "none",
  rightSortOrder: "none",
};

const HISTORY_PAGE_SIZE = 20;
const HISTORY_RECORD_LIMIT = 100;
const PERSIST_DELAY = 400;
const PREVIEW_DELAY = 350;

function getNextSortOrder(
  currentOrder: JsonSortOrder,
): Exclude<JsonSortOrder, "none"> {
  if (currentOrder === "none" || currentOrder === "desc") {
    return "asc";
  }

  return "desc";
}

function useJsonFormatting() {
  const [records, setRecords] = useState<JsonHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreRecords, setHasMoreRecords] = useState(false);
  const [workspace, setWorkspace] = useState<WorkspaceState>(
    INITIAL_WORKSPACE_STATE,
  );
  const workspaceRef = useRef(workspace);
  const recordsRef = useRef(records);
  const persistTimerRef = useRef<number | null>(null);
  const pendingRecordRef = useRef<JsonHistoryRecord | null>(null);
  const persistErrorShownRef = useRef(false);
  const previewTimerRef = useRef<number | null>(null);
  const previewRequestIdRef = useRef(0);
  const previewValueRef = useRef("");
  const workerRef = useRef<Worker | null>(null);
  const historyOperationRef = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    workspaceRef.current = workspace;
  }, [workspace]);

  useEffect(() => {
    recordsRef.current = records;
  }, [records]);
  const updateWorkspace = useCallback((nextWorkspace: WorkspaceState) => {
    workspaceRef.current = nextWorkspace;
    setWorkspace(nextWorkspace);
  }, []);

  /**
   * 历史记录读写必须串行，避免分页查询的旧快照覆盖防抖保存后的最新列表。
   */
  const runHistoryOperation = useCallback(
    <Result>(operation: () => Promise<Result>): Promise<Result> => {
      const result = historyOperationRef.current.then(operation, operation);
      historyOperationRef.current = result.then(
        () => undefined,
        () => undefined,
      );
      return result;
    },
    [],
  );

  const upsertLoadedRecord = useCallback((record: JsonHistoryRecord) => {
    const visibleLimit = Math.max(HISTORY_PAGE_SIZE, recordsRef.current.length);
    const nextRecords = sortHistoryRecords([
      record,
      ...recordsRef.current.filter((item) => item.id !== record.id),
    ]).slice(0, visibleLimit);

    recordsRef.current = nextRecords;
    setRecords(nextRecords);
    return nextRecords;
  }, []);

  const trimHistoryRecords = useCallback(async () => {
    const overflowIds = await jsonFormattingDb.history
      .orderBy("updatedAt")
      .reverse()
      .offset(HISTORY_RECORD_LIMIT)
      .primaryKeys();

    if (overflowIds.length > 0) {
      await jsonFormattingDb.history.bulkDelete(overflowIds);
    }
  }, []);

  const persistRecord = useCallback(
    (record: JsonHistoryRecord) =>
      runHistoryOperation(async () => {
        try {
          await jsonFormattingDb.transaction(
            "rw",
            jsonFormattingDb.history,
            async () => {
              await jsonFormattingDb.history.put(record);
              await trimHistoryRecords();
            },
          );

          const nextRecords = upsertLoadedRecord(record);
          const totalCount = await jsonFormattingDb.history.count();
          setHasMoreRecords(totalCount > nextRecords.length);

          if (persistErrorShownRef.current) {
            persistErrorShownRef.current = false;
            toast.success("本地历史记录已恢复保存");
          }
        } catch (error) {
          if (!persistErrorShownRef.current) {
            persistErrorShownRef.current = true;
            toast.error(
              error instanceof Error
                ? `历史记录保存失败：${error.message}`
                : "历史记录保存失败，请检查浏览器存储权限或空间",
            );
          }
        }
      }),
    [runHistoryOperation, trimHistoryRecords, upsertLoadedRecord],
  );

  const flushPendingPersist = useCallback(async () => {
    if (persistTimerRef.current !== null) {
      window.clearTimeout(persistTimerRef.current);
      persistTimerRef.current = null;
    }

    const record = pendingRecordRef.current;
    if (!record) {
      return;
    }

    pendingRecordRef.current = null;
    await persistRecord(record);
  }, [persistRecord]);

  const schedulePersist = useCallback(
    (record: JsonHistoryRecord) => {
      pendingRecordRef.current = record;
      if (persistTimerRef.current !== null) {
        window.clearTimeout(persistTimerRef.current);
      }
      persistTimerRef.current = window.setTimeout(() => {
        void flushPendingPersist();
      }, PERSIST_DELAY);
    },
    [flushPendingPersist],
  );

  useEffect(() => {
    let active = true;

    void (async () => {
      try {
        await runHistoryOperation(async () => {
          await jsonFormattingDb.transaction(
            "rw",
            jsonFormattingDb.history,
            trimHistoryRecords,
          );
          const savedRecords = await jsonFormattingDb.history
            .orderBy("updatedAt")
            .reverse()
            .limit(HISTORY_PAGE_SIZE)
            .toArray();
          const totalCount = await jsonFormattingDb.history.count();

          if (active) {
            recordsRef.current = savedRecords;
            setRecords(savedRecords);
            setHasMoreRecords(totalCount > savedRecords.length);
          }
        });
      } catch (error) {
        if (active) {
          toast.error(
            error instanceof Error
              ? `历史记录读取失败：${error.message}`
              : "历史记录读取失败，请检查浏览器存储权限",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    })();

    return () => {
      active = false;
      void flushPendingPersist();
    };
  }, [flushPendingPersist, runHistoryOperation, trimHistoryRecords]);

  const loadMoreRecords = useCallback(async () => {
    if (loadingMore || !hasMoreRecords) {
      return;
    }

    setLoadingMore(true);
    try {
      await runHistoryOperation(async () => {
        const loadedCount = recordsRef.current.length;
        const nextPage = await jsonFormattingDb.history
          .orderBy("updatedAt")
          .reverse()
          .offset(loadedCount)
          .limit(HISTORY_PAGE_SIZE)
          .toArray();
        const nextRecords = sortHistoryRecords([
          ...recordsRef.current,
          ...nextPage,
        ]).filter(
          (record, index, recordsToFilter) =>
            recordsToFilter.findIndex((item) => item.id === record.id) ===
            index,
        );
        const totalCount = await jsonFormattingDb.history.count();

        recordsRef.current = nextRecords;
        setRecords(nextRecords);
        setHasMoreRecords(totalCount > nextRecords.length);
      });
    } catch (error) {
      toast.error(
        error instanceof Error
          ? `加载更多历史记录失败：${error.message}`
          : "加载更多历史记录失败",
      );
    } finally {
      setLoadingMore(false);
    }
  }, [hasMoreRecords, loadingMore, runHistoryOperation]);

  const persistValues = useCallback(
    (leftValue: string, rightValue: string) => {
      const currentWorkspace = workspaceRef.current;
      const currentRecord =
        recordsRef.current.find(
          (item) => item.id === currentWorkspace.activeRecordId,
        ) ??
        (pendingRecordRef.current?.id === currentWorkspace.activeRecordId
          ? pendingRecordRef.current
          : null);
      const now = Date.now();
      const recordId = currentWorkspace.activeRecordId ?? crypto.randomUUID();
      const nextRecord = buildHistoryRecord({
        id: recordId,
        leftValue,
        rightValue,
        createdAt: currentRecord?.createdAt ?? now,
        updatedAt: now,
      });

      if (!currentWorkspace.activeRecordId) {
        updateWorkspace({
          ...currentWorkspace,
          activeRecordId: recordId,
        });
      }
      schedulePersist(nextRecord);
    },
    [schedulePersist, updateWorkspace],
  );

  const applyPreviewResult = useCallback(
    (leftValue: string, result: JsonTransformResult) => {
      const currentWorkspace = workspaceRef.current;
      if (currentWorkspace.leftValue !== leftValue) {
        return;
      }

      const nextRightValue = result.ok
        ? result.value
        : currentWorkspace.rightValue;
      const nextWorkspace: WorkspaceState = {
        activeRecordId: currentWorkspace.activeRecordId,
        leftValue,
        rightValue: nextRightValue,
        leftError: result.ok ? "" : result.error,
        leftSortOrder: "none",
        rightSortOrder: "none",
      };

      updateWorkspace(nextWorkspace);
      if (leftValue || nextRightValue || currentWorkspace.activeRecordId) {
        persistValues(leftValue, nextRightValue);
      }
    },
    [persistValues, updateWorkspace],
  );

  const cancelPendingPreview = useCallback(() => {
    previewRequestIdRef.current += 1;
    if (previewTimerRef.current !== null) {
      window.clearTimeout(previewTimerRef.current);
      previewTimerRef.current = null;
    }
  }, []);

  const schedulePreview = useCallback(
    (leftValue: string) => {
      cancelPendingPreview();
      previewValueRef.current = leftValue;
      const requestId = previewRequestIdRef.current;

      previewTimerRef.current = window.setTimeout(() => {
        previewTimerRef.current = null;

        if (!leftValue.trim()) {
          applyPreviewResult(leftValue, { ok: true, value: "" });
          return;
        }

        const worker = workerRef.current;
        if (worker) {
          worker.postMessage({ requestId, value: leftValue });
          return;
        }

        // Worker 不可用时仍只在输入停顿后回退到主线程，避免逐键阻塞。
        window.setTimeout(() => {
          if (requestId === previewRequestIdRef.current) {
            applyPreviewResult(leftValue, formatJsonText(leftValue, 2));
          }
        }, 0);
      }, PREVIEW_DELAY);
    },
    [applyPreviewResult, cancelPendingPreview],
  );

  useEffect(() => {
    const worker = new Worker(
      new URL("../workers/json-formatting.worker.js", import.meta.url),
      { type: "module" },
    );
    workerRef.current = worker;

    worker.addEventListener(
      "message",
      (event: MessageEvent<JsonFormattingWorkerResponse>) => {
        const { requestId, result, value } = event.data;
        if (
          requestId !== previewRequestIdRef.current ||
          value !== previewValueRef.current
        ) {
          return;
        }

        applyPreviewResult(value, result);
      },
    );

    worker.addEventListener("error", () => {
      if (workerRef.current !== worker) {
        return;
      }

      workerRef.current = null;
      worker.terminate();
      toast.error("后台格式化服务不可用，将在输入停顿后使用兼容模式");

      const requestId = previewRequestIdRef.current;
      const leftValue = previewValueRef.current;
      window.setTimeout(() => {
        if (
          requestId === previewRequestIdRef.current &&
          leftValue === previewValueRef.current
        ) {
          applyPreviewResult(leftValue, formatJsonText(leftValue, 2));
        }
      }, 0);
    });

    return () => {
      cancelPendingPreview();
      workerRef.current = null;
      worker.terminate();
    };
  }, [applyPreviewResult, cancelPendingPreview]);

  const commitLeftValue = useCallback(
    (nextLeftValue: string) => {
      const currentWorkspace = workspaceRef.current;
      const nextWorkspace: WorkspaceState = {
        activeRecordId: currentWorkspace.activeRecordId,
        leftValue: nextLeftValue,
        rightValue: nextLeftValue.trim() ? currentWorkspace.rightValue : "",
        leftError: "",
        leftSortOrder: "none",
        rightSortOrder: "none",
      };

      updateWorkspace(nextWorkspace);
      schedulePreview(nextLeftValue);
      if (
        nextLeftValue ||
        nextWorkspace.rightValue ||
        currentWorkspace.activeRecordId
      ) {
        persistValues(nextLeftValue, nextWorkspace.rightValue);
      }
    },
    [persistValues, schedulePreview, updateWorkspace],
  );

  const commitRightValue = useCallback(
    (nextRightValue: string) => {
      const currentWorkspace = workspaceRef.current;
      const nextWorkspace: WorkspaceState = {
        ...currentWorkspace,
        rightValue: nextRightValue,
        rightSortOrder: "none",
      };

      updateWorkspace(nextWorkspace);
      if (
        currentWorkspace.leftValue ||
        nextRightValue ||
        currentWorkspace.activeRecordId
      ) {
        persistValues(currentWorkspace.leftValue, nextRightValue);
      }
    },
    [persistValues, updateWorkspace],
  );

  const createDraft = useCallback(() => {
    cancelPendingPreview();
    void flushPendingPersist();
    updateWorkspace(INITIAL_WORKSPACE_STATE);
  }, [cancelPendingPreview, flushPendingPersist, updateWorkspace]);

  const selectRecord = useCallback(
    (recordId: string) => {
      const record = recordsRef.current.find((item) => item.id === recordId);
      if (!record) {
        return;
      }

      cancelPendingPreview();
      void flushPendingPersist();
      updateWorkspace({
        activeRecordId: record.id,
        leftValue: record.leftValue,
        rightValue: record.rightValue,
        leftError: getLeftEditorError(record.leftValue),
        leftSortOrder: "none",
        rightSortOrder: "none",
      });
    },
    [cancelPendingPreview, flushPendingPersist, updateWorkspace],
  );

  const deleteRecord = useCallback(
    async (recordId: string) => {
      await flushPendingPersist();

      try {
        await runHistoryOperation(async () => {
          await jsonFormattingDb.history.delete(recordId);
          const visibleLimit = Math.max(
            HISTORY_PAGE_SIZE,
            recordsRef.current.length,
          );
          const nextRecords = await jsonFormattingDb.history
            .orderBy("updatedAt")
            .reverse()
            .limit(visibleLimit)
            .toArray();
          const totalCount = await jsonFormattingDb.history.count();

          recordsRef.current = nextRecords;
          setRecords(nextRecords);
          setHasMoreRecords(totalCount > nextRecords.length);

          if (workspaceRef.current.activeRecordId === recordId) {
            cancelPendingPreview();
            const fallbackRecord = nextRecords[0];
            updateWorkspace(
              fallbackRecord
                ? {
                    activeRecordId: fallbackRecord.id,
                    leftValue: fallbackRecord.leftValue,
                    rightValue: fallbackRecord.rightValue,
                    leftError: getLeftEditorError(fallbackRecord.leftValue),
                    leftSortOrder: "none",
                    rightSortOrder: "none",
                  }
                : INITIAL_WORKSPACE_STATE,
            );
          }
        });
      } catch (error) {
        toast.error(
          error instanceof Error
            ? `历史记录删除失败：${error.message}`
            : "历史记录删除失败",
        );
      }
    },
    [
      cancelPendingPreview,
      flushPendingPersist,
      runHistoryOperation,
      updateWorkspace,
    ],
  );

  const updateLeftValue = useCallback(
    (value: string) => {
      commitLeftValue(value);
    },
    [commitLeftValue],
  );
  const updateRightValue = useCallback(
    (value: string) => {
      commitRightValue(value);
    },
    [commitRightValue],
  );

  /**
   * 格式化
   */
  const formatSide = useCallback(
    (side: EditorSide) => {
      const currentWorkspace = workspaceRef.current;
      const sourceValue =
        side === "left"
          ? currentWorkspace.leftValue
          : currentWorkspace.rightValue;
      if (!sourceValue.trim()) {
        return;
      }
      const result = formatJsonText(sourceValue, 2);
      if (!result.ok) {
        if (side === "left") {
          updateWorkspace({
            ...currentWorkspace,
            leftError: result.error,
          });
        }
        toast.error(result.error);
        return;
      }
      if (side === "left") {
        cancelPendingPreview();
        updateWorkspace({
          activeRecordId: currentWorkspace.activeRecordId,
          leftValue: result.value,
          rightValue: result.value,
          leftError: "",
          leftSortOrder: "none",
          rightSortOrder: "none",
        });
        persistValues(result.value, result.value);
        return;
      }
      updateWorkspace({
        ...currentWorkspace,
        rightValue: result.value,
        rightSortOrder: "none",
      });
      persistValues(currentWorkspace.leftValue, result.value);
    },
    [cancelPendingPreview, persistValues, updateWorkspace],
  );

  /**
   * 压缩
   */
  const compressSide = useCallback(
    (side: EditorSide) => {
      const currentWorkspace = workspaceRef.current;
      const sourceValue =
        side === "left"
          ? currentWorkspace.leftValue
          : currentWorkspace.rightValue;
      if (!sourceValue.trim()) {
        return;
      }
      const result = compressJsonText(sourceValue);
      if (!result.ok) {
        if (side === "left") {
          updateWorkspace({
            ...currentWorkspace,
            leftError: result.error,
          });
        }
        toast.error(result.error);
        return;
      }
      if (side === "left") {
        commitLeftValue(result.value);
        return;
      }
      commitRightValue(result.value);
    },
    [commitLeftValue, commitRightValue, updateWorkspace],
  );

  /**
   * 转义
   */
  const escapeSide = useCallback(
    (side: EditorSide) => {
      const currentWorkspace = workspaceRef.current;
      const sourceValue =
        side === "left"
          ? currentWorkspace.leftValue
          : currentWorkspace.rightValue;
      const escapedValue = escapeJsonString(sourceValue);
      if (side === "left") {
        commitLeftValue(escapedValue);
        return;
      }
      commitRightValue(escapedValue);
    },
    [commitLeftValue, commitRightValue],
  );

  /**
   * 清除
   */
  const clearSide = useCallback(
    (side: EditorSide) => {
      if (side === "left") {
        commitLeftValue("");
        return;
      }
      commitRightValue("");
    },
    [commitLeftValue, commitRightValue],
  );

  /**
   * 排序
   */
  const sortSide = useCallback(
    (side: EditorSide) => {
      const currentWorkspace = workspaceRef.current;
      const sourceValue =
        side === "left"
          ? currentWorkspace.leftValue
          : currentWorkspace.rightValue;

      if (!sourceValue.trim()) {
        return;
      }

      const currentOrder =
        side === "left"
          ? currentWorkspace.leftSortOrder
          : currentWorkspace.rightSortOrder;
      const nextOrder = getNextSortOrder(currentOrder);
      const result = sortJsonText(sourceValue, nextOrder, 2);

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      if (side === "left") {
        cancelPendingPreview();
        updateWorkspace({
          activeRecordId: currentWorkspace.activeRecordId,
          leftValue: result.value,
          rightValue: result.value,
          leftError: "",
          leftSortOrder: nextOrder,
          rightSortOrder: nextOrder,
        });
        persistValues(result.value, result.value);
        return;
      }

      updateWorkspace({
        ...currentWorkspace,
        rightValue: result.value,
        rightSortOrder: nextOrder,
      });
      persistValues(currentWorkspace.leftValue, result.value);
    },
    [cancelPendingPreview, persistValues, updateWorkspace],
  );

  /**
   * 复制
   */
  const copySide = useCallback(async (side: EditorSide) => {
    const currentWorkspace = workspaceRef.current;
    const sourceValue =
      side === "left"
        ? currentWorkspace.leftValue
        : currentWorkspace.rightValue;
    await navigator.clipboard.writeText(sourceValue);
    toast.success(side === "left" ? "左侧内容已复制" : "右侧内容已复制");
  }, []);

  /**
   * 下载
   */
  const downloadSide = useCallback((side: EditorSide) => {
    const currentWorkspace = workspaceRef.current;
    const sourceValue =
      side === "left"
        ? currentWorkspace.leftValue
        : currentWorkspace.rightValue;
    downloadTextFile(createDownloadName(side), sourceValue);
    toast.success(side === "left" ? "已下载左侧内容" : "已下载右侧内容");
  }, []);

  /**
   * 上传
   */
  const uploadSide = useCallback(
    async (file: File, side: EditorSide) => {
      try {
        const text = await readJsonFile(file);
        if (side === "left") {
          commitLeftValue(text);
        } else {
          commitRightValue(text);
        }
        toast.success("JSON 文件已导入");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "文件读取失败");
      }
    },
    [commitLeftValue, commitRightValue],
  );
  const value = useMemo(
    () => ({
      records,
      loading,
      loadingMore,
      hasMoreRecords,
      activeRecordId: workspace.activeRecordId,
      leftValue: workspace.leftValue,
      rightValue: workspace.rightValue,
      leftError: workspace.leftError,
      leftSortOrder: workspace.leftSortOrder,
      rightSortOrder: workspace.rightSortOrder,
      createDraft,
      loadMoreRecords,
      selectRecord,
      deleteRecord,
      updateLeftValue,
      updateRightValue,
      formatSide,
      compressSide,
      escapeSide,
      sortSide,
      clearSide,
      copySide,
      downloadSide,
      uploadSide,
    }),
    [
      clearSide,
      compressSide,
      copySide,
      createDraft,
      deleteRecord,
      downloadSide,
      escapeSide,
      sortSide,
      formatSide,
      hasMoreRecords,
      loading,
      loadingMore,
      loadMoreRecords,
      records,
      selectRecord,
      updateLeftValue,
      updateRightValue,
      uploadSide,
      workspace.activeRecordId,
      workspace.leftError,
      workspace.leftSortOrder,
      workspace.leftValue,
      workspace.rightSortOrder,
      workspace.rightValue,
    ],
  );

  return value;
}

export default useJsonFormatting;

export type JsonFormattingContextValue = ReturnType<typeof useJsonFormatting>;
