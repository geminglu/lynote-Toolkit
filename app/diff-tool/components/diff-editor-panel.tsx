import { useTheme } from "next-themes";
import dynamic from "next/dynamic";
import { useState, type FC } from "react";

import DiffToolbar from "./diff-toolbar";

/**
 * 客户端动态加载的 Monaco DiffEditor。
 *
 * Monaco 依赖浏览器环境和 Web Worker，不能参与服务端渲染，所以这里通过
 * `next/dynamic` 关闭 SSR，并在加载期间展示占位区域。
 */
const MonacoDiffEditor = dynamic(
  () => import("./monaco-diff-editor-client").then((module) => module.default),
  {
    loading: () => (
      <div className="flex h-full min-h-[520px] items-center justify-center rounded-2xl border border-border/60 bg-muted/20 text-sm text-muted-foreground">
        正在加载 Monaco DiffEditor...
      </div>
    ),
    ssr: false,
  },
);

/**
 * Diff 工具的编辑器工作区面板。
 *
 * 该组件负责把工具栏和 Monaco DiffEditor 组合在同一个可伸缩布局里，并通过
 * `formatRequestId` 把“格式化两侧”的用户操作传递给 Monaco 客户端组件。
 */
const DiffEditorPanel: FC = () => {
  /**
   * 当前主题，用于同步 Monaco 的亮色/暗色主题。
   */
  const { resolvedTheme } = useTheme();
  /**
   * 格式化请求序号。
   *
   * 每次点击格式化按钮都会递增，保证即使连续点击同一个按钮，子组件的 effect
   * 也能感知到新的格式化请求。
   */
  const [formatRequestId, setFormatRequestId] = useState(0);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <DiffToolbar
        onFormat={() => {
          setFormatRequestId((currentId) => currentId + 1);
        }}
      />

      <div className="min-h-[560px] flex-1 overflow-hidden rounded-2xl border border-border/60 bg-card">
        <MonacoDiffEditor
          formatRequestId={formatRequestId}
          theme={resolvedTheme as "dark" | "light"}
        />
      </div>
    </div>
  );
};

export default DiffEditorPanel;
