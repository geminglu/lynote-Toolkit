"use client";

import MarkdownRenderer from "@/components/MarkdownRenderer";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "lynote-ui/alert";
import WorkspaceLayout from "../../components/WorkspaceLayout";
import EditorPanel from "./components/editor-panel";
import HistorySidebar from "./components/history-sidebar";
import { JsonFormattingProvider } from "./context";
import { useJsonFormattingContext } from "./hooks/useJsonFormattingContext";

type JsonFormattingWorkspaceClientProps = {
  markdownContent: string;
};

function JsonFormattingWorkspaceContent({
  markdownContent,
}: JsonFormattingWorkspaceClientProps) {
  const { leftError } = useJsonFormattingContext();

  return (
    <div className="">
      <WorkspaceLayout
        contentClassName=""
        footer={<MarkdownRenderer content={markdownContent} />}
        header={{
          title: "JSON 格式化",
          description:
            "左侧作为主输入源，右侧会在左侧 JSON 合法时自动同步格式化结果。",
        }}
        sidebar={<HistorySidebar />}
      >
        <div className="min-h-[calc(100vh-0px)]">
          {leftError && (
            <Alert variant="destructive">
              <AlertTitle>左侧 JSON 解析失败</AlertTitle>
              <AlertDescription>{leftError}</AlertDescription>
            </Alert>
          )}

          <div
            className={cn(
              "grid h-full min-h-0 flex-1 gap-4",
              "grid-cols-1 lg:grid-cols-2",
            )}
          >
            <EditorPanel
              description="这里是原始 JSON 输入区。左侧变化会驱动右侧重新生成格式化结果。"
              side="left"
              title="原始数据"
            />
            <EditorPanel
              description="这里是格式化结果区。你可以继续手动编辑，但不会反向同步到左侧。"
              side="right"
              title="格式化结果"
            />
          </div>
        </div>
      </WorkspaceLayout>
    </div>
  );
}

export default function JsonFormattingWorkspaceClient({
  markdownContent,
}: JsonFormattingWorkspaceClientProps) {
  return (
    <JsonFormattingProvider>
      <JsonFormattingWorkspaceContent markdownContent={markdownContent} />
    </JsonFormattingProvider>
  );
}
