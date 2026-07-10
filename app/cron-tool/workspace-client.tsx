"use client";

import MarkdownRenderer from "@/components/MarkdownRenderer";
import WorkspaceLayout from "@/components/WorkspaceLayout";
import { cn } from "@/lib/utils";
import { CalendarClock } from "lucide-react";

import ConfigPanel from "./components/config-panel";
import ResultPanel from "./components/result-panel";
import { CronToolProvider } from "./context";

type CronToolWorkspaceClientProps = {
  markdownContent: string;
};

function CronToolWorkspaceContent({
  markdownContent,
}: CronToolWorkspaceClientProps) {
  return (
    <WorkspaceLayout
      footer={<MarkdownRenderer content={markdownContent} />}
      header={{
        title: "Cron 表达式生成器",
        description:
          "通过中文可视化字段生成 7 字段 cron 表达式，也可以解析表达式并回显到界面。",
        icon: <CalendarClock className="h-5 w-5" />,
      }}
    >
      <div
        className={cn(
          "grid min-h-0 flex-1 gap-4",
          "grid-cols-1 xl:grid-cols-[minmax(520px,1.25fr)_minmax(420px,0.75fr)]",
        )}
      >
        <ConfigPanel />
        <ResultPanel />
      </div>
    </WorkspaceLayout>
  );
}

export default function CronToolWorkspaceClient({
  markdownContent,
}: CronToolWorkspaceClientProps) {
  return (
    <CronToolProvider>
      <CronToolWorkspaceContent markdownContent={markdownContent} />
    </CronToolProvider>
  );
}
