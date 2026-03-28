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

import { useJsonFormattingContext } from "../hooks/useJsonFormattingContext";
import type { EditorSide } from "../type";
import EditorToolbar from "./editor-toolbar";

const MonacoJsonEditor = dynamic(
  () => import("./monaco-json-editor-client").then((module) => module.default),
  {
    loading: () => <div className="bg-muted/20 h-full min-h-[420px]" />,
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
    updateLeftValue,
    updateRightValue,
    formatSide,
    clearSide,
    uploadToLeft,
    downloadSide,
    copySide,
    compressSide,
    escapeSide,
  } = useJsonFormattingContext();

  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  const value = useMemo(
    () => (side === "left" ? leftValue : rightValue),
    [leftValue, rightValue, side],
  );

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
          onExpandAll={() => {
            void editorRef.current?.getAction("editor.unfoldAll")?.run();
          }}
          onFormat={() => {
            formatSide(side);
          }}
          onUpload={uploadToLeft}
          side={side}
        />
      </CardHeader>

      <CardContent className="min-h-0 flex-1 p-0">
        <div className="h-full min-h-[420px]">
          <MonacoJsonEditor
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
