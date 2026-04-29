import { toast } from "lynote-ui/sonner";
import { useCallback, useMemo, useState } from "react";

import type {
  DiffFileInfo,
  DiffLanguageOption,
  DiffSide,
  DiffStats,
  DiffViewMode,
} from "../type";
import {
  DEFAULT_MODIFIED_TEXT,
  DEFAULT_ORIGINAL_TEXT,
  createDownloadName,
  createEmptyDiffStats,
  detectLanguageFromFileName,
  downloadTextFile,
  normalizeLanguageOptions,
  readUtf8TextFile,
} from "../utils";

/**
 * Diff 工具的完整工作区状态。
 *
 * 该状态只保存 UI 和 Monaco model 同步所需的信息；文件内容以字符串保存，
 * 上传文件本体不会进入状态，避免持有浏览器文件句柄。
 */
type WorkspaceState = {
  /**
   * Monaco DiffEditor original model 的文本内容。
   */
  originalText: string;
  /**
   * Monaco DiffEditor modified model 的文本内容。
   */
  modifiedText: string;
  /**
   * 原始文本侧使用的 Monaco language id。
   */
  originalLanguage: string;
  /**
   * 修改后文本侧使用的 Monaco language id。
   */
  modifiedLanguage: string;
  /**
   * 原始文本侧最近一次上传的文件信息；手动输入时为 null。
   */
  originalFile: DiffFileInfo | null;
  /**
   * 修改后文本侧最近一次上传的文件信息；手动输入时为 null。
   */
  modifiedFile: DiffFileInfo | null;
  /**
   * 当前 diff 展示模式，控制 Monaco `renderSideBySide`。
   */
  viewMode: DiffViewMode;
  /**
   * 是否忽略行尾空白差异。
   */
  ignoreTrimWhitespace: boolean;
  /**
   * 是否折叠大段未变化区域，只展示差异附近上下文。
   */
  collapseUnchangedRegions: boolean;
  /**
   * 是否开启 Monaco 自动换行。
   */
  wordWrap: boolean;
  /**
   * 是否禁止编辑器内容修改。
   */
  readOnly: boolean;
  /**
   * 当前跳转到的差异块索引。
   */
  activeDiffIndex: number;
  /**
   * 基于 Monaco line changes 计算出的差异统计。
   */
  diffStats: DiffStats;
};

/**
 * Diff 工具的默认初始状态。
 *
 * 默认放入一组 JSON 示例，方便用户打开页面后立即看到差异、格式化和高亮效果；
 * 设置项选择偏代码审查场景的默认值：并排视图、折叠未变化行、可编辑。
 */
const INITIAL_WORKSPACE_STATE: WorkspaceState = {
  originalText: DEFAULT_ORIGINAL_TEXT,
  modifiedText: DEFAULT_MODIFIED_TEXT,
  originalLanguage: "json",
  modifiedLanguage: "json",
  originalFile: null,
  modifiedFile: null,
  viewMode: "side-by-side",
  ignoreTrimWhitespace: false,
  collapseUnchangedRegions: true,
  wordWrap: false,
  readOnly: false,
  activeDiffIndex: 0,
  diffStats: createEmptyDiffStats(),
};

/**
 * 将内部侧别转换为中文 UI 文案。
 *
 * 多个操作都会给 toast 或按钮使用同一组文案，集中处理可以避免“左侧/原始文本”
 * 这类描述在页面中不一致。
 */
function getSideLabel(side: DiffSide) {
  return side === "original" ? "原始文本" : "修改后文本";
}

/**
 * 管理文本对比工具的业务状态和动作。
 *
 * 该 hook 不直接持有 Monaco 实例，只维护 React 状态和浏览器文件/剪贴板/下载等
 * 外围能力；真正的编辑器 API 调用放在 Monaco 组件中处理。
 */
function useDiffTool() {
  /**
   * 当前工作区状态，包括两侧文本、语言、展示设置和差异统计。
   */
  const [workspace, setWorkspace] = useState<WorkspaceState>(
    INITIAL_WORKSPACE_STATE,
  );
  /**
   * 可供用户选择的 Monaco 语言列表。
   *
   * 初始先使用兜底语言，Monaco 加载完成后再由编辑器组件注入真实语言列表。
   */
  const [languageOptions, setLanguageOptionsState] = useState<
    DiffLanguageOption[]
  >(() => normalizeLanguageOptions([]));

  /**
   * 接收 Monaco 注册语言并合并兜底语言配置。
   *
   * 该函数由 `MonacoDiffEditorClient` 在 `beforeMount` 中调用，确保上传识别和
   * 手动高亮下拉都基于当前运行时真正可用的语言。
   */
  const setLanguageOptions = useCallback((options: DiffLanguageOption[]) => {
    setLanguageOptionsState(normalizeLanguageOptions(options));
  }, []);

  /**
   * 更新指定侧的文本内容。
   *
   * 每次文本变化都把差异跳转索引重置到 0，避免用户继续跳转到旧 diff 结果中
   * 已经不存在的差异块。
   */
  const updateText = useCallback((side: DiffSide, value: string) => {
    setWorkspace((previousWorkspace) => ({
      ...previousWorkspace,
      activeDiffIndex: 0,
      [side === "original" ? "originalText" : "modifiedText"]: value,
    }));
  }, []);

  /**
   * 更新指定侧的语法高亮语言。
   *
   * 目前 UI 主要使用全局高亮切换，但保留单侧更新能力，方便上传文件或后续扩展
   * “左右不同语言对比”的场景。
   */
  const updateLanguage = useCallback((side: DiffSide, language: string) => {
    setWorkspace((previousWorkspace) => ({
      ...previousWorkspace,
      [side === "original" ? "originalLanguage" : "modifiedLanguage"]: language,
    }));
  }, []);

  /**
   * 同时更新两侧 Monaco model 的语法高亮语言。
   *
   * DiffEditor 常见使用场景是比较同一种格式的两个版本，因此工具栏只暴露一个
   * 语言选择器，并用该函数保证两侧保持一致。
   */
  const updateBothLanguages = useCallback((language: string) => {
    setWorkspace((previousWorkspace) => ({
      ...previousWorkspace,
      originalLanguage: language,
      modifiedLanguage: language,
    }));
  }, []);

  /**
   * 上传并导入指定侧的 UTF-8 文本文件。
   *
   * 上传会直接覆盖对应侧文本，不做确认；语言根据文件后缀自动识别，并同步到
   * 两侧高亮，保证比较同类文件时视觉一致。
   */
  const uploadFile = useCallback(
    async (side: DiffSide, file: File) => {
      try {
        const text = await readUtf8TextFile(file);
        const language = detectLanguageFromFileName(file.name, languageOptions);
        const fileInfo: DiffFileInfo = {
          name: file.name,
          size: file.size,
          language,
        };

        setWorkspace((previousWorkspace) => ({
          ...previousWorkspace,
          activeDiffIndex: 0,
          [side === "original" ? "originalText" : "modifiedText"]: text,
          originalLanguage: language,
          modifiedLanguage: language,
          [side === "original" ? "originalFile" : "modifiedFile"]: fileInfo,
        }));
        toast.success(`${getSideLabel(side)}已导入，语言识别为 ${language}`);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "文件读取失败");
      }
    },
    [languageOptions],
  );

  /**
   * 清空当前工作区内容。
   *
   * 只清空文本和文件信息，保留用户当前的视图设置和语言设置，符合“继续在当前
   * 配置下开始下一次对比”的使用预期。
   */
  const clearAll = useCallback(() => {
    setWorkspace((previousWorkspace) => ({
      ...previousWorkspace,
      originalText: "",
      modifiedText: "",
      originalFile: null,
      modifiedFile: null,
      activeDiffIndex: 0,
      diffStats: createEmptyDiffStats(),
    }));
    toast.success("工作区已清空");
  }, []);

  /**
   * 恢复默认示例和默认设置。
   *
   * 与清空不同，重置会回到完整初始状态，用于用户试用后快速回到可演示页面。
   */
  const resetExample = useCallback(() => {
    setWorkspace(INITIAL_WORKSPACE_STATE);
    toast.success("已恢复示例内容");
  }, []);

  /**
   * 交换原始文本和修改后文本。
   *
   * 同时交换语言和上传文件信息，确保左右两侧的 UI 元数据和实际内容保持一致。
   */
  const swapSides = useCallback(() => {
    setWorkspace((previousWorkspace) => ({
      ...previousWorkspace,
      originalText: previousWorkspace.modifiedText,
      modifiedText: previousWorkspace.originalText,
      originalLanguage: previousWorkspace.modifiedLanguage,
      modifiedLanguage: previousWorkspace.originalLanguage,
      originalFile: previousWorkspace.modifiedFile,
      modifiedFile: previousWorkspace.originalFile,
      activeDiffIndex: 0,
    }));
    toast.success("已交换原始文本和修改后文本");
  }, []);

  /**
   * 复制指定侧文本到系统剪贴板。
   */
  const copySide = useCallback(
    async (side: DiffSide) => {
      const text =
        side === "original" ? workspace.originalText : workspace.modifiedText;

      await navigator.clipboard.writeText(text);
      toast.success(`${getSideLabel(side)}已复制`);
    },
    [workspace.modifiedText, workspace.originalText],
  );

  /**
   * 下载指定侧文本。
   *
   * 默认文件名根据侧别和当前语言生成，不使用上传文件名，避免把用户本地命名习惯
   * 误带到导出文件里。
   */
  const downloadSide = useCallback(
    (side: DiffSide) => {
      const language =
        side === "original"
          ? workspace.originalLanguage
          : workspace.modifiedLanguage;
      const text =
        side === "original" ? workspace.originalText : workspace.modifiedText;

      downloadTextFile(createDownloadName(side, language), text);
      toast.success(`${getSideLabel(side)}已下载`);
    },
    [
      workspace.modifiedLanguage,
      workspace.modifiedText,
      workspace.originalLanguage,
      workspace.originalText,
    ],
  );

  /**
   * 切换 DiffEditor 展示模式。
   */
  const updateViewMode = useCallback((viewMode: DiffViewMode) => {
    setWorkspace((previousWorkspace) => ({
      ...previousWorkspace,
      viewMode,
    }));
  }, []);

  /**
   * 切换是否忽略行尾空白差异。
   *
   * 该选项会影响 Monaco 重新计算 diff，所以同步重置当前差异索引。
   */
  const updateIgnoreTrimWhitespace = useCallback((enabled: boolean) => {
    setWorkspace((previousWorkspace) => ({
      ...previousWorkspace,
      activeDiffIndex: 0,
      ignoreTrimWhitespace: enabled,
    }));
  }, []);

  /**
   * 切换是否折叠未变化区域。
   *
   * 该状态直接传给 Monaco `hideUnchangedRegions`，用于长文件对比时聚焦差异。
   */
  const updateCollapseUnchangedRegions = useCallback((enabled: boolean) => {
    setWorkspace((previousWorkspace) => ({
      ...previousWorkspace,
      collapseUnchangedRegions: enabled,
    }));
  }, []);

  /**
   * 切换自动换行。
   */
  const updateWordWrap = useCallback((enabled: boolean) => {
    setWorkspace((previousWorkspace) => ({
      ...previousWorkspace,
      wordWrap: enabled,
    }));
  }, []);

  /**
   * 切换只读模式。
   *
   * 只读模式会阻止用户编辑两侧文本，适合纯查看 diff 的场景。
   */
  const updateReadOnly = useCallback((enabled: boolean) => {
    setWorkspace((previousWorkspace) => ({
      ...previousWorkspace,
      readOnly: enabled,
    }));
  }, []);

  /**
   * 接收 Monaco diff 计算结果并更新统计信息。
   *
   * 如果新的差异块数量少于当前索引，会把索引夹紧到最后一个可用差异，避免
   * 后续跳转时访问不存在的 line change。
   */
  const updateDiffStats = useCallback((diffStats: DiffStats) => {
    setWorkspace((previousWorkspace) => ({
      ...previousWorkspace,
      activeDiffIndex:
        diffStats.changes === 0
          ? 0
          : Math.min(previousWorkspace.activeDiffIndex, diffStats.changes - 1),
      diffStats,
    }));
  }, []);

  /**
   * 跳转到上一个差异块。
   *
   * 采用取模循环，第一处差异再向上跳时会回到最后一处，减少用户反复点击时的
   * 边界感。
   */
  const goToPreviousDiff = useCallback(() => {
    setWorkspace((previousWorkspace) => {
      if (previousWorkspace.diffStats.changes === 0) {
        return previousWorkspace;
      }

      return {
        ...previousWorkspace,
        activeDiffIndex:
          (previousWorkspace.activeDiffIndex -
            1 +
            previousWorkspace.diffStats.changes) %
          previousWorkspace.diffStats.changes,
      };
    });
  }, []);

  /**
   * 跳转到下一个差异块。
   *
   * 与 `goToPreviousDiff` 一样使用循环跳转，最后一处差异后会回到第一处。
   */
  const goToNextDiff = useCallback(() => {
    setWorkspace((previousWorkspace) => {
      if (previousWorkspace.diffStats.changes === 0) {
        return previousWorkspace;
      }

      return {
        ...previousWorkspace,
        activeDiffIndex:
          (previousWorkspace.activeDiffIndex + 1) %
          previousWorkspace.diffStats.changes,
      };
    });
  }, []);

  /**
   * 对外暴露的上下文值。
   *
   * 使用 `useMemo` 固定对象引用，避免消费上下文的组件在无关状态不变时重复渲染。
   */
  const value = useMemo(
    () => ({
      ...workspace,
      languageOptions,
      updateText,
      updateLanguage,
      updateBothLanguages,
      uploadFile,
      clearAll,
      resetExample,
      swapSides,
      copySide,
      downloadSide,
      updateViewMode,
      updateIgnoreTrimWhitespace,
      updateCollapseUnchangedRegions,
      updateWordWrap,
      updateReadOnly,
      updateDiffStats,
      setLanguageOptions,
      goToPreviousDiff,
      goToNextDiff,
    }),
    [
      clearAll,
      copySide,
      downloadSide,
      goToNextDiff,
      goToPreviousDiff,
      languageOptions,
      resetExample,
      setLanguageOptions,
      swapSides,
      updateDiffStats,
      updateCollapseUnchangedRegions,
      updateIgnoreTrimWhitespace,
      updateBothLanguages,
      updateLanguage,
      updateReadOnly,
      updateText,
      updateViewMode,
      updateWordWrap,
      uploadFile,
      workspace,
    ],
  );

  return value;
}

export default useDiffTool;

/**
 * Diff 工具上下文类型。
 *
 * 直接从 hook 返回值推导，避免手写 context 类型和实际 hook 实现发生漂移。
 */
export type DiffToolContextValue = ReturnType<typeof useDiffTool>;
