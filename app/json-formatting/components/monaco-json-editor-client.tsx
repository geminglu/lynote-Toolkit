"use client";

import Editor, { loader } from "@monaco-editor/react";
import type { editor, json } from "monaco-editor";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api.js";
import * as jsonContribution from "monaco-editor/esm/vs/language/json/monaco.contribution.js";

loader.config({ monaco });

/**
 * Monaco 的 ESM 声明没有暴露 JSON contribution 的运行时具名导出，
 * 但精简入口也不会把它挂到 monaco.languages.json，因此在这里显式约束导出类型。
 */
const { jsonDefaults } = jsonContribution as unknown as {
  jsonDefaults: typeof json.jsonDefaults;
};

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
  theme?: "dark" | "light";
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
  scrollbar: {
    alwaysConsumeMouseWheel: false,
  },
};

export default function MonacoJsonEditor({
  value,
  path,
  onChange,
  onMount,
  theme,
}: MonacoJsonEditorProps) {
  return (
    <Editor
      beforeMount={() => {
        jsonDefaults.setDiagnosticsOptions({
          allowComments: false,
          enableSchemaRequest: false,
          validate: true,
        });
      }}
      height="100%"
      language="json"
      loading={null}
      onChange={onChange}
      onMount={onMount}
      options={editorOptions}
      path={path}
      theme={theme === "dark" ? "vs-dark" : "light"}
      value={value}
    />
  );
}
