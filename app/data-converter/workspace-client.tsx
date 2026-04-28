"use client";

import MarkdownRenderer from "@/components/MarkdownRenderer";
import WorkspaceLayout from "@/components/WorkspaceLayout";
import { Alert, AlertDescription, AlertTitle } from "lynote-ui/alert";

import EditorPanel from "./components/editor-panel";
import { DataConverterProvider } from "./context";
import { useDataConverterContext } from "./hooks/useDataConverterContext";

type DataConverterWorkspaceClientProps = {
  markdownContent: string;
};

function DataConverterWorkspaceContent({
  markdownContent,
}: DataConverterWorkspaceClientProps) {
  const { leftError } = useDataConverterContext();

  return (
    <WorkspaceLayout
      footer={<MarkdownRenderer content={markdownContent} />}
      header={{
        title: "数据转换与代码生成工具",
        description:
          "左侧输入 JSON、YAML 或 XML，右侧实时预览目标数据格式或 TypeScript、Zod、Java、Go、C 模型代码。",
      }}
    >
      <div className="flex min-h-0 flex-1 flex-col gap-4">
        {leftError && (
          <Alert variant="destructive">
            <AlertTitle>左侧输入解析失败</AlertTitle>
            <AlertDescription>{leftError}</AlertDescription>
          </Alert>
        )}

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-2">
          <EditorPanel
            description="左侧是主输入区。切换输入类型会清空当前内容，重新编辑后右侧会自动更新。"
            side="left"
            title="主输入区"
          />
          <EditorPanel
            description="右侧是结果预览区。你可以切换输出类型，也可以临时编辑结果，但不会反向影响左侧。"
            side="right"
            title="结果预览区"
          />
        </div>
      </div>
    </WorkspaceLayout>
  );
}

export default function DataConverterWorkspaceClient({
  markdownContent,
}: DataConverterWorkspaceClientProps) {
  return (
    <DataConverterProvider>
      <DataConverterWorkspaceContent markdownContent={markdownContent} />
    </DataConverterProvider>
  );
}
