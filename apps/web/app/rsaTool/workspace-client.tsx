"use client";

import MarkdownRenderer from "@/components/MarkdownRenderer";
import { cn } from "@/lib/utils";

import WorkspaceLayout from "../../components/WorkspaceLayout";
import ConfigPanel from "./components/config-panel";
import ResultPanel from "./components/result-panel";
import { RsaToolProvider } from "./context";

type RsaToolWorkspaceClientProps = {
  markdownContent: string;
};

function RsaToolWorkspaceContent({
  markdownContent,
}: RsaToolWorkspaceClientProps) {
  return (
    <WorkspaceLayout
      footer={<MarkdownRenderer content={markdownContent} />}
      header={{
        title: "RSA 工具箱",
        description:
          "支持 RSA-OAEP 加密解密、RSASSA / RSA-PSS 签名验签与密钥检查，全部在浏览器本地完成。",
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

export default function RsaToolWorkspaceClient({
  markdownContent,
}: RsaToolWorkspaceClientProps) {
  return (
    <RsaToolProvider>
      <RsaToolWorkspaceContent markdownContent={markdownContent} />
    </RsaToolProvider>
  );
}
