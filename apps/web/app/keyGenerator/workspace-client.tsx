"use client";

import MarkdownRenderer from "@/components/MarkdownRenderer";
import { cn } from "@/lib/utils";

import WorkspaceLayout from "../../components/WorkspaceLayout";
import ConfigPanel from "./components/config-panel";
import ResultPanel from "./components/result-panel";
import { KeyGeneratorProvider } from "./context";

type KeyGeneratorWorkspaceClientProps = {
  markdownContent: string;
};

function KeyGeneratorWorkspaceContent({
  markdownContent,
}: KeyGeneratorWorkspaceClientProps) {
  return (
    <WorkspaceLayout
      footer={<MarkdownRenderer content={markdownContent} />}
      header={{
        title: "密钥生成工具",
        description:
          "支持 API Key、JWT Secret、AES-256、HMAC-SHA256 和 RSA Key Pair 的本地生成。",
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

export default function KeyGeneratorWorkspaceClient({
  markdownContent,
}: KeyGeneratorWorkspaceClientProps) {
  return (
    <KeyGeneratorProvider>
      <KeyGeneratorWorkspaceContent markdownContent={markdownContent} />
    </KeyGeneratorProvider>
  );
}
