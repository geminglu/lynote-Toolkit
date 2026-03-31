"use client";

import MarkdownRenderer from "@/components/MarkdownRenderer";
import { cn } from "@/lib/utils";

import WorkspaceLayout from "../../components/WorkspaceLayout";
import ConfigPanel from "./components/config-panel";
import ResultPanel from "./components/result-panel";
import { JwtDebuggerProvider } from "./context";

type JwtDebuggerWorkspaceClientProps = {
  markdownContent: string;
};

function JwtDebuggerWorkspaceContent({
  markdownContent,
}: JwtDebuggerWorkspaceClientProps) {
  return (
    <WorkspaceLayout
      footer={<MarkdownRenderer content={markdownContent} />}
      header={{
        title: "JWT 调试工具",
        description:
          "支持 Header / Payload 解析、`exp / nbf / iat` 校验，以及基于 Secret、PEM Public Key 或 JWK 的本地验签。",
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

export default function JwtDebuggerWorkspaceClient({
  markdownContent,
}: JwtDebuggerWorkspaceClientProps) {
  return (
    <JwtDebuggerProvider>
      <JwtDebuggerWorkspaceContent markdownContent={markdownContent} />
    </JwtDebuggerProvider>
  );
}
