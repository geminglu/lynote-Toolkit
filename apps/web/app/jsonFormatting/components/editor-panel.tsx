import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "lynote-ui/card";
import type { editor } from "monaco-editor";
import dynamic from "next/dynamic";
import { useMemo, useRef, type FC } from "react";

import { useTheme } from "next-themes";
import { useJsonFormattingContext } from "../hooks/useJsonFormattingContext";
import type { EditorSide } from "../type";
import EditorToolbar from "./editor-toolbar";

const MonacoJsonEditor = dynamic(
  () => import("./monaco-json-editor-client").then((module) => module.default),
  {
    loading: () => <div className="h-full min-h-[420px] bg-muted/20" />,
    ssr: false,
  },
);

export type PropsType = {
  side: EditorSide;
  title: string;
  description: string;
};

const EditorPanel: FC<PropsType> = ({ side, title, description }) => {
  const {
    leftValue,
    rightValue,
    leftSortOrder,
    rightSortOrder,
    updateLeftValue,
    updateRightValue,
    formatSide,
    clearSide,
    uploadSide,
    downloadSide,
    copySide,
    compressSide,
    escapeSide,
    sortSide,
  } = useJsonFormattingContext();

  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  const value = useMemo(
    () => (side === "left" ? leftValue : rightValue),
    [leftValue, rightValue, side],
  );
  const sortOrder = side === "left" ? leftSortOrder : rightSortOrder;
  const { resolvedTheme } = useTheme();

  return (
    <Card className="">
      <CardHeader>
        <div className="">
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>

        <EditorToolbar
          onClear={() => {
            clearSide(side);
          }}
          onCollapseAll={() => {
            void editorRef.current?.getAction("editor.foldAll")?.run();
          }}
          onCompress={() => {
            compressSide(side);
          }}
          onCopy={async () => {
            await copySide(side);
          }}
          onDownload={() => {
            downloadSide(side);
          }}
          onEscape={() => {
            escapeSide(side);
          }}
          onSort={() => {
            sortSide(side);
          }}
          onExpandAll={() => {
            void editorRef.current?.getAction("editor.unfoldAll")?.run();
          }}
          onFormat={() => {
            formatSide(side);
          }}
          onUpload={async (file) => {
            uploadSide(file, side);
          }}
          side={side}
          sortOrder={sortOrder}
        />
      </CardHeader>

      <CardContent className="min-h-0 flex-1 p-0">
        <div className="h-full min-h-[420px]">
          <MonacoJsonEditor
            theme={resolvedTheme as "dark" | "light"}
            onChange={(nextValue) => {
              const safeValue = nextValue ?? "";

              if (side === "left") {
                updateLeftValue(safeValue);
                return;
              }

              updateRightValue(safeValue);
            }}
            onMount={(editorInstance) => {
              editorRef.current = editorInstance;
            }}
            path={side === "left" ? "left.json" : "right.json"}
            value={value}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default EditorPanel;
