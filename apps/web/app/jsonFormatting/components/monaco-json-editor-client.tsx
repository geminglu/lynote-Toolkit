"use client";

import Editor, { loader } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import * as monaco from "monaco-editor";

loader.config({ monaco });

(
  self as typeof self & {
    MonacoEnvironment?: {
      getWorker: (_workerId: string, label: string) => Worker;
    };
  }
).MonacoEnvironment = {
  getWorker(_workerId, label) {
    if (label === "json") {
      return new Worker(
        new URL(
          "monaco-editor/esm/vs/language/json/json.worker",
          import.meta.url,
        ),
        { type: "module" },
      );
    }

    return new Worker(
      new URL("monaco-editor/esm/vs/editor/editor.worker", import.meta.url),
      { type: "module" },
    );
  },
};

export type MonacoJsonEditorProps = {
  value: string;
  path: string;
  onChange: (value: string | undefined) => void;
  onMount: (editorInstance: editor.IStandaloneCodeEditor) => void;
};

const editorOptions: editor.IStandaloneEditorConstructionOptions = {
  automaticLayout: true,
  codeLens: false,
  folding: true,
  fontSize: 13,
  lineNumbersMinChars: 3,
  minimap: {
    enabled: false,
  },
  padding: {
    top: 16,
    bottom: 16,
  },
  roundedSelection: true,
  scrollBeyondLastLine: false,
  tabSize: 2,
  wordWrap: "on",
};

export default function MonacoJsonEditor({
  value,
  path,
  onChange,
  onMount,
}: MonacoJsonEditorProps) {
  return (
    <Editor
      beforeMount={(monacoInstance) => {
        monacoInstance.languages.json.jsonDefaults.setDiagnosticsOptions({
          allowComments: false,
          enableSchemaRequest: false,
          validate: true,
        });
      }}
      height="100%"
      language="json"
      onChange={onChange}
      onMount={onMount}
      options={editorOptions}
      path={path}
      theme="vs"
      value={value}
    />
  );
}
