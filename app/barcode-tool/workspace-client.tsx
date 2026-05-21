"use client";

import MarkdownRenderer from "@/components/MarkdownRenderer";
import WorkspaceLayout from "@/components/WorkspaceLayout";

import ConfigPanel from "./components/config-panel";
import ResultPanel from "./components/result-panel";
import { BarcodeToolProvider } from "./context";

type BarcodeToolWorkspaceClientProps = {
  markdownContent: string;
};

function BarcodeToolWorkspaceContent({
  markdownContent,
}: BarcodeToolWorkspaceClientProps) {
  return (
    <WorkspaceLayout
      footer={<MarkdownRenderer content={markdownContent} />}
      header={{
        title: "条形码在线生成与解析工具",
        description:
          "支持 CODE128、EAN、UPC、Code39、ITF-14、DataMatrix、PDF417、Aztec 等码制的浏览器本地生成、PNG/SVG 导出与图片识别。",
      }}
    >
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-2">
        <ConfigPanel />
        <ResultPanel />
      </div>
    </WorkspaceLayout>
  );
}

export default function BarcodeToolWorkspaceClient({
  markdownContent,
}: BarcodeToolWorkspaceClientProps) {
  return (
    <BarcodeToolProvider>
      <BarcodeToolWorkspaceContent markdownContent={markdownContent} />
    </BarcodeToolProvider>
  );
}
