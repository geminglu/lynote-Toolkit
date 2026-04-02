"use client";

import MarkdownRenderer from "@/components/MarkdownRenderer";
import WorkspaceLayout from "@/components/WorkspaceLayout";

import ConfigPanel from "./components/config-panel";
import ResultPanel from "./components/result-panel";
import { Base64ToolProvider } from "./context";

type Base64ToolWorkspaceClientProps = {
  markdownContent: string;
};

function Base64ToolWorkspaceContent({
  markdownContent,
}: Base64ToolWorkspaceClientProps) {
  return (
    <WorkspaceLayout
      footer={<MarkdownRenderer content={markdownContent} />}
      header={{
        title: "Base64 / Base64URL 编解码工具",
        description:
          "支持文本、Base64、Base64URL、JWT 片段、Data URL 与文件内容的浏览器本地转换、逐行处理和字节预览。",
      }}
    >
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-2">
        <ConfigPanel />
        <ResultPanel />
      </div>
    </WorkspaceLayout>
  );
}

export default function Base64ToolWorkspaceClient({
  markdownContent,
}: Base64ToolWorkspaceClientProps) {
  return (
    <Base64ToolProvider>
      <Base64ToolWorkspaceContent markdownContent={markdownContent} />
    </Base64ToolProvider>
  );
}
