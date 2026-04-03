"use client";

import MarkdownRenderer from "@/components/MarkdownRenderer";
import WorkspaceLayout from "@/components/WorkspaceLayout";

import ConfigPanel from "./components/config-panel";
import ResultPanel from "./components/result-panel";
import { QrCodeToolProvider } from "./context";

type QrCodeToolWorkspaceClientProps = {
  markdownContent: string;
};

function QrCodeToolWorkspaceContent({
  markdownContent,
}: QrCodeToolWorkspaceClientProps) {
  return (
    <WorkspaceLayout
      footer={<MarkdownRenderer content={markdownContent} />}
      header={{
        title: "二维码在线生成与解析工具",
        description:
          "支持文本、网址、Wi-Fi、电话、短信和邮箱二维码的本地生成、Logo 美化、透明背景导出与图片解析。",
      }}
    >
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-2">
        <ConfigPanel />
        <ResultPanel />
      </div>
    </WorkspaceLayout>
  );
}

export default function QrCodeToolWorkspaceClient({
  markdownContent,
}: QrCodeToolWorkspaceClientProps) {
  return (
    <QrCodeToolProvider>
      <QrCodeToolWorkspaceContent markdownContent={markdownContent} />
    </QrCodeToolProvider>
  );
}
