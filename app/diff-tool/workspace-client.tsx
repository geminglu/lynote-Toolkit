"use client";

import MarkdownRenderer from "@/components/MarkdownRenderer";
import WorkspaceLayout from "@/components/WorkspaceLayout";

import DiffEditorPanel from "./components/diff-editor-panel";
import { DiffToolProvider } from "./context";

/**
 * Diff 工具客户端入口属性。
 */
type DiffToolWorkspaceClientProps = {
  /**
   * 服务端读取的 README Markdown 内容，用于页面底部说明文档。
   */
  markdownContent: string;
};

/**
 * Diff 工具的实际工作区内容。
 *
 * 该组件只负责组织通用 `WorkspaceLayout`、页面头部说明、主编辑器区域和底部
 * Markdown 文档，不直接处理 Monaco 或文件业务逻辑。
 */
function DiffToolWorkspaceContent({
  markdownContent,
}: DiffToolWorkspaceClientProps) {
  return (
    <WorkspaceLayout
      footer={<MarkdownRenderer content={markdownContent} />}
      header={{
        title: "文本对比工具",
        description:
          "基于 Monaco DiffEditor 对比 JSON、Markdown、TXT 和常见代码文件，支持并排/逐行视图、上传、格式化和差异跳转。",
      }}
    >
      <DiffEditorPanel />
    </WorkspaceLayout>
  );
}

/**
 * Diff 工具页面客户端入口。
 *
 * 在这里挂载 `DiffToolProvider`，让工具栏、编辑器和文档区域都处在同一个客户端
 * 状态树下。
 */
export default function DiffToolWorkspaceClient({
  markdownContent,
}: DiffToolWorkspaceClientProps) {
  return (
    <DiffToolProvider>
      <DiffToolWorkspaceContent markdownContent={markdownContent} />
    </DiffToolProvider>
  );
}
