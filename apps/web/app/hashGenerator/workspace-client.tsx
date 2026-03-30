"use client";

import MarkdownRenderer from "@/components/MarkdownRenderer";
import { cn } from "@/lib/utils";

import WorkspaceLayout from "../../components/WorkspaceLayout";
import ConfigPanel from "./components/config-panel";
import ResultPanel from "./components/result-panel";
import { HashGeneratorProvider } from "./context";

type HashGeneratorWorkspaceClientProps = {
  markdownContent: string;
};

function HashGeneratorWorkspaceContent({
  markdownContent,
}: HashGeneratorWorkspaceClientProps) {
  return (
    <WorkspaceLayout
      footer={<MarkdownRenderer content={markdownContent} />}
      header={{
        title: "哈希与 HMAC 工具",
        description:
          "支持文本与单文件输入，可在 Hash 与 HMAC 模式间切换，并在浏览器本地完成多算法计算与校验。",
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

export default function HashGeneratorWorkspaceClient({
  markdownContent,
}: HashGeneratorWorkspaceClientProps) {
  return (
    <HashGeneratorProvider>
      <HashGeneratorWorkspaceContent markdownContent={markdownContent} />
    </HashGeneratorProvider>
  );
}
