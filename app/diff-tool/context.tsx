import { createContext, type FC, type PropsWithChildren } from "react";

import useDiffTool, { type DiffToolContextValue } from "./hooks/useDiffTool";

/**
 * Diff 工具的 React Context。
 *
 * 上下文集中暴露工作区状态和操作方法，避免工具栏、编辑器面板等组件之间通过
 * 多层 props 传递大量状态。
 */
export const DiffToolContext = createContext<DiffToolContextValue | null>(null);

/**
 * Diff 工具状态 Provider。
 *
 * Provider 在页面客户端入口创建一次 `useDiffTool` 状态，并把同一个状态实例提供给
 * 所有子组件，保证工具栏操作和 Monaco 编辑器内容保持同步。
 */
export const DiffToolProvider: FC<PropsWithChildren> = ({ children }) => {
  const value = useDiffTool();

  return (
    <DiffToolContext.Provider value={value}>
      {children}
    </DiffToolContext.Provider>
  );
};
