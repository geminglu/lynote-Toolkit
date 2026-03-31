"use client";

import MarkdownRenderer from "@/components/MarkdownRenderer";
import WorkspaceLayout from "@/components/WorkspaceLayout";
import { cn } from "@/lib/utils";

import type { FC } from "react";
import FormatsPanel from "./components/formats-panel";
import PreviewPanel from "./components/preview-panel";
import { ColorConverterProvider } from "./context";

type ColorConverterWorkspaceClientProps = {
  markdownContent: string;
};

const ColorConverterWorkspaceContent: FC<
  ColorConverterWorkspaceClientProps
> = ({ markdownContent }) => {
  return (
    <WorkspaceLayout
      footer={<MarkdownRenderer content={markdownContent} />}
      header={{
        title: "CSS 颜色转换工具",
        description:
          "支持 HEXA、RGBA、HSLA、HWB、Lab、LCH 和 OKLCH 的联动转换、滑块调色与本地复制。",
      }}
    >
      <div
        className={cn(
          "grid min-h-0 flex-1 gap-4",
          "grid-cols-1 lg:grid-cols-5",
        )}
      >
        <PreviewPanel />
        <FormatsPanel />
      </div>
    </WorkspaceLayout>
  );
};

export default function ColorConverterWorkspaceClient({
  markdownContent,
}: ColorConverterWorkspaceClientProps) {
  return (
    <ColorConverterProvider>
      <ColorConverterWorkspaceContent markdownContent={markdownContent} />
    </ColorConverterProvider>
  );
}
