"use client";

import { DiffEditor, loader } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import * as monaco from "monaco-editor";
import { useEffect, useMemo, useRef } from "react";

import { useDiffToolContext } from "../hooks/useDiffToolContext";
import type { DiffLanguageOption, DiffStats } from "../type";

/**
 * 让 `@monaco-editor/react` 使用当前 ESM 打包出来的 Monaco 实例。
 *
 * 如果不显式配置，组件可能会尝试从默认 loader 加载 Monaco，和 Next/Turbopack
 * 的客户端模块拆分不一致。
 */
loader.config({ monaco });

/**
 * Monaco Worker 路由配置。
 *
 * Monaco 的 JSON、TS/JS、HTML、CSS 等语言服务依赖不同 worker。这里根据 label
 * 返回对应 worker，其他语言回退到通用 editor worker，保证语法高亮、诊断和
 * 格式化能力能在浏览器端正常运行。
 */
(
  self as typeof self & {
    MonacoEnvironment?: {
      getWorker: (_workerId: string, label: string) => Worker;
    };
  }
).MonacoEnvironment = {
  getWorker(_workerId, label) {
    if (label === "json") {
      return new Worker(
        new URL(
          "monaco-editor/esm/vs/language/json/json.worker",
          import.meta.url,
        ),
        { type: "module" },
      );
    }

    if (label === "typescript" || label === "javascript") {
      return new Worker(
        new URL(
          "monaco-editor/esm/vs/language/typescript/ts.worker",
          import.meta.url,
        ),
        { type: "module" },
      );
    }

    if (label === "html" || label === "handlebars" || label === "razor") {
      return new Worker(
        new URL(
          "monaco-editor/esm/vs/language/html/html.worker",
          import.meta.url,
        ),
        { type: "module" },
      );
    }

    if (label === "css" || label === "scss" || label === "less") {
      return new Worker(
        new URL(
          "monaco-editor/esm/vs/language/css/css.worker",
          import.meta.url,
        ),
        { type: "module" },
      );
    }

    return new Worker(
      new URL("monaco-editor/esm/vs/editor/editor.worker", import.meta.url),
      { type: "module" },
    );
  },
};

type MonacoDiffEditorClientProps = {
  /**
   * 格式化请求序号。
   *
   * 父组件每次点击“格式化两侧”都会递增该值，当前组件通过 effect 监听变化后
   * 调用 Monaco action。用序号而不是 boolean，可以连续触发同一个动作。
   */
  formatRequestId: number;
  /**
   * 当前站点主题，用于同步 Monaco 的 light / vs-dark 主题。
   */
  theme?: "dark" | "light";
};

/**
 * DiffEditor 选项扩展类型。
 *
 * 当前 Monaco 类型声明里可能没有暴露 `hideUnchangedRegions`，但运行时支持该
 * 选项，所以这里用交叉类型为本工具补齐字段描述。
 */
type DiffEditorOptions = editor.IDiffEditorConstructionOptions & {
  hideUnchangedRegions?: {
    enabled: boolean;
    contextLineCount: number;
    minimumLineCount: number;
    revealLineCount: number;
  };
};

/**
 * 统计单个 Monaco line change 涉及的新增/删除行。
 *
 * Monaco 的 diff block 同时包含 original 和 modified 两侧行号范围。这里不区分
 * “修改”与“新增/删除”的语义细节，只把 modified 范围计入新增，original 范围
 * 计入删除，用于工具栏提供大致变更规模。
 */
function countChangedLines(change: editor.ILineChange): DiffStats {
  const originalLines = Math.max(
    0,
    change.originalEndLineNumber - change.originalStartLineNumber + 1,
  );
  const modifiedLines = Math.max(
    0,
    change.modifiedEndLineNumber - change.modifiedStartLineNumber + 1,
  );

  return {
    changes: 1,
    additions: modifiedLines,
    deletions: originalLines,
  };
}

/**
 * 将 Monaco `getLineChanges()` 结果汇总成工具栏展示的统计数据。
 *
 * 当 Monaco 尚未计算出差异或两侧完全一致时，返回空统计，避免 UI 继续展示旧值。
 */
function createDiffStats(changes: editor.ILineChange[] | null): DiffStats {
  if (!changes?.length) {
    return {
      changes: 0,
      additions: 0,
      deletions: 0,
    };
  }

  return changes.reduce<DiffStats>(
    (stats, change) => {
      const nextStats = countChangedLines(change);

      return {
        changes: stats.changes + nextStats.changes,
        additions: stats.additions + nextStats.additions,
        deletions: stats.deletions + nextStats.deletions,
      };
    },
    {
      changes: 0,
      additions: 0,
      deletions: 0,
    },
  );
}

/**
 * 从 Monaco 运行时读取可用语言列表。
 *
 * 该列表用于工具栏语言下拉和上传文件自动识别。返回值会在状态层继续与本地兜底
 * 语言配置合并，避免某些语言缺扩展名时识别失败。
 */
function getLanguageOptions(
  monacoInstance: typeof monaco,
): DiffLanguageOption[] {
  return monacoInstance.languages.getLanguages().map((language) => ({
    value: language.id,
    label: language.aliases?.[0] ?? language.id,
    extensions: language.extensions ?? [],
  }));
}

/**
 * 执行 Monaco 文档格式化 action。
 *
 * 不同语言是否可格式化取决于 Monaco 是否注册了对应 provider；没有 action 时
 * 直接跳过，避免纯文本、日志等语言报错。
 */
async function runFormatAction(editorInstance: editor.IStandaloneCodeEditor) {
  const action = editorInstance.getAction("editor.action.formatDocument");

  if (!action) {
    return;
  }

  await action.run();
}

/**
 * 获取可安全传给 Monaco 的行号。
 *
 * 部分 diff block 在纯新增或纯删除时，某一侧的起始行可能为 0 或缺失；折叠未变化
 * 区域后 model 行数也可能变化。这里会用 fallback 行号兜底，并把结果夹紧到当前
 * model 的合法行号范围，避免 Monaco 抛出 `Illegal value for lineNumber`。
 */
function getSafeLineNumber(
  editorInstance: editor.IStandaloneCodeEditor,
  preferredLineNumber: number,
  fallbackLineNumber: number,
) {
  const model = editorInstance.getModel();

  if (!model) {
    return null;
  }

  const lineCount = model.getLineCount();
  const lineNumber =
    preferredLineNumber > 0 ? preferredLineNumber : fallbackLineNumber;

  if (!Number.isFinite(lineNumber)) {
    return 1;
  }

  return Math.min(Math.max(1, lineNumber), lineCount);
}

/**
 * 安全地滚动并定位到某一行。
 *
 * 当某侧没有可定位行号时直接跳过该侧；这对纯新增/纯删除 diff 很重要，因为其中
 * 一侧可能没有对应实体行。
 */
function revealSafeLine(
  editorInstance: editor.IStandaloneCodeEditor,
  lineNumber: number | null,
) {
  if (!lineNumber) {
    return;
  }

  editorInstance.revealLineInCenter(lineNumber);
  editorInstance.setPosition({ lineNumber, column: 1 });
}

/**
 * Monaco DiffEditor 客户端组件。
 *
 * 组件负责把 React 状态同步到 Monaco model，并把 Monaco 的编辑、diff 更新、
 * 格式化和跳转等事件反馈回状态层。它是唯一直接访问 Monaco 实例的地方。
 */
export default function MonacoDiffEditorClient({
  formatRequestId,
  theme,
}: MonacoDiffEditorClientProps) {
  const {
    originalText,
    modifiedText,
    originalLanguage,
    modifiedLanguage,
    viewMode,
    ignoreTrimWhitespace,
    collapseUnchangedRegions,
    wordWrap,
    readOnly,
    activeDiffIndex,
    updateText,
    updateDiffStats,
    setLanguageOptions,
  } = useDiffToolContext();
  const diffEditorRef = useRef<editor.IStandaloneDiffEditor | null>(null);
  /**
   * 当前 Monaco diff 结果缓存。
   *
   * 上/下差异跳转需要读取完整 line changes；用 ref 保存可以避免每次 diff 更新
   * 都触发额外 React 渲染。
   */
  const lineChangesRef = useRef<editor.ILineChange[]>([]);
  /**
   * 保存最新 `updateText`，供 Monaco 事件回调使用。
   *
   * Monaco 事件只在 mount 时注册一次，用 ref 可以避免闭包持有旧的状态更新函数。
   */
  const updateTextRef = useRef(updateText);
  /**
   * 保存最新 `updateDiffStats`，用于 Monaco diff 更新回调。
   */
  const updateDiffStatsRef = useRef(updateDiffStats);

  useEffect(() => {
    updateTextRef.current = updateText;
  }, [updateText]);

  useEffect(() => {
    updateDiffStatsRef.current = updateDiffStats;
  }, [updateDiffStats]);

  /**
   * Monaco DiffEditor 配置。
   *
   * 这些选项由 React 状态驱动，包括并排/逐行、忽略空白、折叠未变化行、只读、
   * 自动换行等。使用 memo 可以避免每次渲染都创建新的 options 对象。
   */
  const options = useMemo<DiffEditorOptions>(
    () => ({
      automaticLayout: true,
      codeLens: true,
      folding: true,
      fontSize: 14,
      hideUnchangedRegions: {
        enabled: collapseUnchangedRegions,
        contextLineCount: 3,
        minimumLineCount: 8,
        revealLineCount: 20,
      },
      ignoreTrimWhitespace,
      lineNumbersMinChars: 3,
      minimap: {
        enabled: false,
      },
      originalEditable: true,
      padding: {
        top: 16,
        bottom: 16,
      },
      readOnly,
      renderSideBySide: viewMode === "side-by-side",
      roundedSelection: true,
      scrollBeyondLastLine: false,
      scrollbar: {
        alwaysConsumeMouseWheel: false,
      },
      tabSize: 2,
      wordWrap: wordWrap ? "on" : "off",
    }),
    [
      collapseUnchangedRegions,
      ignoreTrimWhitespace,
      readOnly,
      viewMode,
      wordWrap,
    ],
  );

  useEffect(() => {
    if (formatRequestId === 0) {
      return;
    }

    const diffEditor = diffEditorRef.current;

    if (!diffEditor) {
      return;
    }

    void Promise.all([
      runFormatAction(diffEditor.getOriginalEditor()),
      runFormatAction(diffEditor.getModifiedEditor()),
    ]);
  }, [formatRequestId]);

  /**
   * 当语言状态变化时，同步更新 Monaco 两侧 model 的 language id。
   *
   * 仅改变 React prop 不足以覆盖已经创建的 model，因此这里显式调用 Monaco API。
   */
  useEffect(() => {
    const diffEditor = diffEditorRef.current;
    const model = diffEditor?.getModel();

    if (!diffEditor || !model) {
      return;
    }

    monaco.editor.setModelLanguage(model.original, originalLanguage);
    monaco.editor.setModelLanguage(model.modified, modifiedLanguage);
  }, [modifiedLanguage, originalLanguage]);

  /**
   * 根据当前差异索引跳转到对应 diff block。
   *
   * 跳转前会对两侧行号做合法性校验，兼容纯新增、纯删除和折叠未变化区域后的
   * 特殊行号。
   */
  useEffect(() => {
    const change = lineChangesRef.current[activeDiffIndex];
    const diffEditor = diffEditorRef.current;

    if (!change || !diffEditor) {
      return;
    }

    const originalEditor = diffEditor.getOriginalEditor();
    const modifiedEditor = diffEditor.getModifiedEditor();
    const originalLine = getSafeLineNumber(
      originalEditor,
      change.originalStartLineNumber,
      change.originalEndLineNumber,
    );
    const modifiedLine = getSafeLineNumber(
      modifiedEditor,
      change.modifiedStartLineNumber,
      change.modifiedEndLineNumber,
    );

    revealSafeLine(originalEditor, originalLine);
    revealSafeLine(modifiedEditor, modifiedLine);
  }, [activeDiffIndex]);

  return (
    <DiffEditor
      beforeMount={(monacoInstance) => {
        setLanguageOptions(getLanguageOptions(monacoInstance));
        monacoInstance.languages.json.jsonDefaults.setDiagnosticsOptions({
          allowComments: false,
          enableSchemaRequest: false,
          validate: true,
        });
      }}
      height="100%"
      loading={null}
      modified={modifiedText}
      modifiedLanguage={modifiedLanguage}
      modifiedModelPath="modified-text"
      onMount={(diffEditor) => {
        diffEditorRef.current = diffEditor;

        const originalEditor = diffEditor.getOriginalEditor();
        const modifiedEditor = diffEditor.getModifiedEditor();
        const model = diffEditor.getModel();

        if (model) {
          monaco.editor.setModelLanguage(model.original, originalLanguage);
          monaco.editor.setModelLanguage(model.modified, modifiedLanguage);
        }

        originalEditor.onDidChangeModelContent(() => {
          updateTextRef.current("original", originalEditor.getValue());
        });
        modifiedEditor.onDidChangeModelContent(() => {
          updateTextRef.current("modified", modifiedEditor.getValue());
        });
        diffEditor.onDidUpdateDiff(() => {
          const lineChanges = diffEditor.getLineChanges() ?? [];

          lineChangesRef.current = lineChanges;
          updateDiffStatsRef.current(createDiffStats(lineChanges));
        });
      }}
      options={options}
      original={originalText}
      originalLanguage={originalLanguage}
      originalModelPath="original-text"
      theme={theme === "dark" ? "vs-dark" : "light"}
    />
  );
}
