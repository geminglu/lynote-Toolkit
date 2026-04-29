import { useContext } from "react";

import { DiffToolContext } from "../context";

/**
 * 读取 Diff 工具上下文。
 *
 * 该 hook 会校验调用位置是否在 `DiffToolProvider` 内部。相比直接导出 context，
 * 这里可以在组件误用时给出明确错误，减少空值判断散落在业务组件里。
 */
export const useDiffToolContext = () => {
  const context = useContext(DiffToolContext);

  if (!context) {
    throw new Error("useDiffToolContext must be used within DiffToolProvider");
  }

  return context;
};
