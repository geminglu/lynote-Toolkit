"use client";

import Editor, { loader } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import * as monaco from "monaco-editor";

import type { OutputFormat, XmlOptions } from "../type";
import {
  DEFAULT_XML_OPTIONS,
  formatValueByOutputFormat,
  getMonacoLanguage,
} from "../utils";

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

    if (label === "typescript" || label === "javascript") {
      return new Worker(
        new URL(
          "monaco-editor/esm/vs/language/typescript/ts.worker",
          import.meta.url,
        ),
        { type: "module" },
      );
    }

    if (label === "html") {
      return new Worker(
        new URL(
          "monaco-editor/esm/vs/language/html/html.worker",
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

let formatterRegistered = false;

function ensureLanguage(monacoInstance: typeof monaco, languageId: string) {
  if (
    !monacoInstance.languages
      .getLanguages()
      .some((item) => item.id === languageId)
  ) {
    monacoInstance.languages.register({ id: languageId });
  }
}

function createDocumentFormatter(
  format: OutputFormat,
  xmlOptions: XmlOptions,
): monaco.languages.DocumentFormattingEditProvider {
  return {
    provideDocumentFormattingEdits(model) {
      const result = formatValueByOutputFormat(
        format,
        model.getValue(),
        xmlOptions,
      );

      if (!result.ok) {
        return [];
      }

      return [
        {
          range: model.getFullModelRange(),
          text: result.value,
        },
      ];
    },
  };
}

function registerFormatters(monacoInstance: typeof monaco) {
  if (formatterRegistered) {
    return;
  }

  ensureLanguage(monacoInstance, "yaml");
  ensureLanguage(monacoInstance, "xml");

  monacoInstance.languages.registerDocumentFormattingEditProvider(
    "yaml",
    createDocumentFormatter("yaml", DEFAULT_XML_OPTIONS),
  );
  monacoInstance.languages.registerDocumentFormattingEditProvider(
    "xml",
    createDocumentFormatter("xml", DEFAULT_XML_OPTIONS),
  );
  monacoInstance.languages.registerDocumentFormattingEditProvider(
    "java",
    createDocumentFormatter("java", DEFAULT_XML_OPTIONS),
  );
  monacoInstance.languages.registerDocumentFormattingEditProvider(
    "go",
    createDocumentFormatter("go", DEFAULT_XML_OPTIONS),
  );
  monacoInstance.languages.registerDocumentFormattingEditProvider(
    "cpp",
    createDocumentFormatter("c", DEFAULT_XML_OPTIONS),
  );

  formatterRegistered = true;
}

/**
 * Monaco 编辑器组件属性。
 */
export type MonacoCodeEditorProps = {
  value: string;
  path: string;
  format: OutputFormat;
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

export default function MonacoCodeEditor({
  value,
  path,
  format,
  onChange,
  onMount,
  theme,
}: MonacoCodeEditorProps) {
  return (
    <Editor
      beforeMount={(monacoInstance) => {
        registerFormatters(monacoInstance);
        monacoInstance.languages.json.jsonDefaults.setDiagnosticsOptions({
          allowComments: false,
          enableSchemaRequest: false,
          validate: true,
        });
      }}
      height="100%"
      language={getMonacoLanguage(format)}
      onChange={onChange}
      onMount={onMount}
      options={editorOptions}
      path={path}
      theme={theme === "dark" ? "vs-dark" : "light"}
      value={value}
    />
  );
}
