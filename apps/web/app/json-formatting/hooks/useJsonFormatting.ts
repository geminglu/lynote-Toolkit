import { toast } from "lynote-ui/sonner";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { jsonFormattingDb } from "../db";
import type { EditorSide, JsonHistoryRecord, JsonSortOrder } from "../type";
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

const PERSIST_DELAY = 400;

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
  const [workspace, setWorkspace] = useState<WorkspaceState>(
    INITIAL_WORKSPACE_STATE,
  );
  const workspaceRef = useRef(workspace);
  const recordsRef = useRef(records);
  const persistTimerRef = useRef<number | null>(null);
  const pendingRecordRef = useRef<JsonHistoryRecord | null>(null);
  useEffect(() => {
    workspaceRef.current = workspace;
  }, [workspace]);
  useEffect(() => {
    recordsRef.current = records;
  }, [records]);
  const flushPendingPersist = useCallback(async () => {
    if (persistTimerRef.current) {
      window.clearTimeout(persistTimerRef.current);
      persistTimerRef.current = null;
    }
    const record = pendingRecordRef.current;
    if (!record) {
      return;
    }
    pendingRecordRef.current = null;
    await jsonFormattingDb.history.put(record);
  }, []);
  const schedulePersist = useCallback(
    (record: JsonHistoryRecord) => {
      pendingRecordRef.current = record;
      if (persistTimerRef.current) {
        window.clearTimeout(persistTimerRef.current);
      }
      persistTimerRef.current = window.setTimeout(() => {
        void flushPendingPersist();
      }, PERSIST_DELAY);
    },
    [flushPendingPersist],
  );
  useEffect(() => {
    void (async () => {
      try {
        const savedRecords = await jsonFormattingDb.history
          .orderBy("updatedAt")
          .reverse()
          .toArray();
        setRecords(savedRecords);
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      void flushPendingPersist();
    };
  }, [flushPendingPersist]);
  const upsertRecord = useCallback(
    (record: JsonHistoryRecord) => {
      setRecords((previousRecords) =>
        sortHistoryRecords([
          record,
          ...previousRecords.filter((item) => item.id !== record.id),
        ]),
      );
      schedulePersist(record);
    },
    [schedulePersist],
  );
  const persistValues = useCallback(
    (leftValue: string, rightValue: string) => {
      const currentWorkspace = workspaceRef.current;
      const currentRecord = recordsRef.current.find(
        (item) => item.id === currentWorkspace.activeRecordId,
      );
      const now = Date.now();
      const recordId = currentWorkspace.activeRecordId ?? crypto.randomUUID();
      const createdAt = currentRecord?.createdAt ?? now;
      const nextRecord = buildHistoryRecord({
        id: recordId,
        leftValue,
        rightValue,
        createdAt,
        updatedAt: now,
      });
      if (!currentWorkspace.activeRecordId) {
        setWorkspace((previousWorkspace) => ({
          ...previousWorkspace,
          activeRecordId: recordId,
        }));
      }
      upsertRecord(nextRecord);
    },
    [upsertRecord],
  );
  const commitLeftValue = useCallback(
    (nextLeftValue: string) => {
      const currentWorkspace = workspaceRef.current;
      let nextRightValue = currentWorkspace.rightValue;
      let nextError = "";
      /**
       * 左侧是主数据源。
       * 只要左侧 JSON 合法，就直接重新生成右侧内容并覆盖右侧的手动编辑结果。
       */
      if (!nextLeftValue.trim()) {
        nextRightValue = "";
      } else {
        const result = formatJsonText(nextLeftValue, 2);
        if (result.ok) {
          nextRightValue = result.value;
        } else {
          nextError = result.error;
        }
      }
      setWorkspace({
        activeRecordId: currentWorkspace.activeRecordId,
        leftValue: nextLeftValue,
        rightValue: nextRightValue,
        leftError: nextError,
        leftSortOrder: "none",
        rightSortOrder: "none",
      });
      if (nextLeftValue || nextRightValue || currentWorkspace.activeRecordId) {
        persistValues(nextLeftValue, nextRightValue);
      }
    },
    [persistValues],
  );
  const commitRightValue = useCallback(
    (nextRightValue: string) => {
      const currentWorkspace = workspaceRef.current;
      setWorkspace({
        ...currentWorkspace,
        rightValue: nextRightValue,
        rightSortOrder: "none",
      });
      if (
        currentWorkspace.leftValue ||
        nextRightValue ||
        currentWorkspace.activeRecordId
      ) {
        persistValues(currentWorkspace.leftValue, nextRightValue);
      }
    },
    [persistValues],
  );
  const createDraft = useCallback(() => {
    void flushPendingPersist();
    setWorkspace(INITIAL_WORKSPACE_STATE);
  }, [flushPendingPersist]);
  const selectRecord = useCallback(
    (recordId: string) => {
      const record = recordsRef.current.find((item) => item.id === recordId);
      if (!record) {
        return;
      }
      void flushPendingPersist();
      setWorkspace({
        activeRecordId: record.id,
        leftValue: record.leftValue,
        rightValue: record.rightValue,
        leftError: getLeftEditorError(record.leftValue),
        leftSortOrder: "none",
        rightSortOrder: "none",
      });
    },
    [flushPendingPersist],
  );
  const deleteRecord = useCallback(
    async (recordId: string) => {
      await flushPendingPersist();
      await jsonFormattingDb.history.delete(recordId);
      const nextRecords = recordsRef.current.filter(
        (item) => item.id !== recordId,
      );
      setRecords(nextRecords);
      if (workspaceRef.current.activeRecordId === recordId) {
        const fallbackRecord = sortHistoryRecords(nextRecords)[0];
        if (fallbackRecord) {
          setWorkspace({
            activeRecordId: fallbackRecord.id,
            leftValue: fallbackRecord.leftValue,
            rightValue: fallbackRecord.rightValue,
            leftError: getLeftEditorError(fallbackRecord.leftValue),
            leftSortOrder: "none",
            rightSortOrder: "none",
          });
        } else {
          setWorkspace(INITIAL_WORKSPACE_STATE);
        }
      }
    },
    [flushPendingPersist],
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
          setWorkspace({
            ...currentWorkspace,
            leftError: result.error,
          });
        }
        toast.error(result.error);
        return;
      }
      if (side === "left") {
        setWorkspace({
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
      setWorkspace({
        ...currentWorkspace,
        rightValue: result.value,
        rightSortOrder: "none",
      });
      persistValues(currentWorkspace.leftValue, result.value);
    },
    [persistValues],
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
          setWorkspace({
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
    [commitLeftValue, commitRightValue],
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
        setWorkspace({
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

      setWorkspace({
        ...currentWorkspace,
        rightValue: result.value,
        rightSortOrder: nextOrder,
      });
      persistValues(currentWorkspace.leftValue, result.value);
    },
    [persistValues],
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
      activeRecordId: workspace.activeRecordId,
      leftValue: workspace.leftValue,
      rightValue: workspace.rightValue,
      leftError: workspace.leftError,
      leftSortOrder: workspace.leftSortOrder,
      rightSortOrder: workspace.rightSortOrder,
      createDraft,
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
      loading,
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
