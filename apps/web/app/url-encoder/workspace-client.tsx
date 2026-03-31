"use client";

import MarkdownRenderer from "@/components/MarkdownRenderer";
import { cn } from "@/lib/utils";

import WorkspaceLayout from "../../components/WorkspaceLayout";
import ConfigPanel from "./components/config-panel";
import ResultPanel from "./components/result-panel";
import { UrlToolProvider } from "./context";

type UrlToolWorkspaceClientProps = {
  markdownContent: string;
};

function UrlToolWorkspaceContent({
  markdownContent,
}: UrlToolWorkspaceClientProps) {
  return (
    <WorkspaceLayout
      footer={<MarkdownRenderer content={markdownContent} />}
      header={{
        title: "URL 编码与解析工具",
        description:
          "支持完整 URL、参数值和 Query String 的编码、解码与结构解析，适合接口联调、回调地址排查和跳转参数检查。",
      }}
    >
      <div
        className={cn(
          "grid min-h-0 flex-1 gap-4",
          "grid-cols-1 lg:grid-cols-2",
        )}
      >
        <ConfigPanel />
        <ResultPanel />
      </div>
    </WorkspaceLayout>
  );
}

export default function UrlToolWorkspaceClient({
  markdownContent,
}: UrlToolWorkspaceClientProps) {
  return (
    <UrlToolProvider>
      <UrlToolWorkspaceContent markdownContent={markdownContent} />
    </UrlToolProvider>
  );
}
