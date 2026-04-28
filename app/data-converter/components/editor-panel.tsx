import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "lynote-ui/card";
import { Input } from "lynote-ui/input";
import { Label } from "lynote-ui/label";
import { NativeSelect, NativeSelectOption } from "lynote-ui/native-select";
import { Switch } from "lynote-ui/switch";
import type { editor } from "monaco-editor";
import dynamic from "next/dynamic";
import { useRef, type FC } from "react";

import { useTheme } from "next-themes";
import { useDataConverterContext } from "../hooks/useDataConverterContext";
import type { DataFormat, EditorSide, OutputFormat } from "../type";
import {
  DATA_FORMAT_OPTIONS,
  OUTPUT_FORMAT_OPTIONS,
  getFormatExtension,
  isCodeFormat,
} from "../utils";
import EditorToolbar from "./editor-toolbar";

const MonacoCodeEditor = dynamic(
  () => import("./monaco-code-editor-client").then((module) => module.default),
  {
    loading: () => <div className="h-full min-h-[420px] bg-muted/20" />,
    ssr: false,
  },
);

/**
 * 编辑器面板属性。
 */
export type EditorPanelProps = {
  side: EditorSide;
  title: string;
  description: string;
};

const EditorPanel: FC<EditorPanelProps> = ({ side, title, description }) => {
  const {
    leftFormat,
    rightFormat,
    leftValue,
    rightValue,
    rootTypeName,
    xmlOptions,
    codeGenOptions,
    updateLeftValue,
    updateRightValue,
    changeLeftFormat,
    changeRightFormat,
    setRootTypeName,
    setXmlOptions,
    setCodeGenOptions,
    clearSide,
    copySide,
    downloadSide,
    uploadLeftFile,
  } = useDataConverterContext();
  const { resolvedTheme } = useTheme();
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  const currentFormat = side === "left" ? leftFormat : rightFormat;
  const currentValue = side === "left" ? leftValue : rightValue;
  const editorPath = `${side}.${getFormatExtension(currentFormat)}`;
  const showXmlOptions =
    side === "left" && (leftFormat === "xml" || rightFormat === "xml");
  const showCodeOptions = side === "right" && isCodeFormat(rightFormat);

  return (
    <Card className="flex h-[calc(100vh-200px)] min-h-0 flex-1 flex-col">
      <CardHeader className="space-y-4">
        <div className="space-y-1">
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>

        <div className="flex flex-col gap-3">
          <div className="grid gap-3 md:grid-cols-[minmax(0,220px)_minmax(0,1fr)]">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">
                {side === "left" ? "输入类型" : "输出类型"}
              </p>
              {side === "left" ? (
                <NativeSelect
                  onChange={(event) => {
                    changeLeftFormat(event.target.value as DataFormat);
                  }}
                  size="default"
                  value={leftFormat}
                >
                  {DATA_FORMAT_OPTIONS.map((option) => (
                    <NativeSelectOption key={option.value} value={option.value}>
                      {option.label}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              ) : (
                <NativeSelect
                  onChange={(event) => {
                    changeRightFormat(event.target.value as OutputFormat);
                  }}
                  size="default"
                  value={rightFormat}
                >
                  {OUTPUT_FORMAT_OPTIONS.map((option) => (
                    <NativeSelectOption key={option.value} value={option.value}>
                      {option.label}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              )}
            </div>

            {side === "right" &&
              !["json", "yaml", "xml"].includes(rightFormat) && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">根类型名称</p>
                  <Input
                    onChange={(event) => {
                      setRootTypeName(event.target.value);
                    }}
                    placeholder="RootModel"
                    value={rootTypeName}
                  />
                </div>
              )}
          </div>

          {showXmlOptions && (
            <div className="grid gap-3 rounded-lg border bg-muted/20 p-3 md:grid-cols-3">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">XML 属性前缀</p>
                <Input
                  onChange={(event) => {
                    setXmlOptions((previous) => ({
                      ...previous,
                      attributePrefix: event.target.value,
                    }));
                  }}
                  placeholder="@"
                  value={xmlOptions.attributePrefix}
                />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">XML 文本节点名</p>
                <Input
                  onChange={(event) => {
                    setXmlOptions((previous) => ({
                      ...previous,
                      textNodeName: event.target.value,
                    }));
                  }}
                  placeholder="#text"
                  value={xmlOptions.textNodeName}
                />
              </div>
              <div className="flex items-center justify-between rounded-md border bg-background px-3 py-2">
                <div className="space-y-1">
                  <Label>单节点强制数组</Label>
                  <p className="text-xs text-muted-foreground">
                    解析 XML 时把节点统一转为数组
                  </p>
                </div>
                <Switch
                  checked={xmlOptions.forceArrayForTags}
                  onCheckedChange={(checked) => {
                    setXmlOptions((previous) => ({
                      ...previous,
                      forceArrayForTags: checked,
                    }));
                  }}
                />
              </div>
            </div>
          )}

          {showCodeOptions && (
            <div className="grid gap-3 rounded-lg border bg-muted/20 p-3">
              {rightFormat === "typescript" && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">
                    TypeScript 声明风格
                  </p>
                  <NativeSelect
                    onChange={(event) => {
                      setCodeGenOptions((previous) => ({
                        ...previous,
                        typescript: {
                          ...previous.typescript,
                          declarationStyle: event.target.value as
                            | "interface"
                            | "type",
                        },
                      }));
                    }}
                    value={codeGenOptions.typescript.declarationStyle}
                  >
                    <NativeSelectOption value="interface">
                      interface
                    </NativeSelectOption>
                    <NativeSelectOption value="type">type</NativeSelectOption>
                  </NativeSelect>
                </div>
              )}

              {rightFormat === "zod" && (
                <div className="flex items-center justify-between rounded-md border bg-background px-3 py-2">
                  <div className="space-y-1">
                    <Label>附带 infer 类型</Label>
                    <p className="text-xs text-muted-foreground">
                      在 Schema 下方同时生成 TypeScript 类型别名
                    </p>
                  </div>
                  <Switch
                    checked={codeGenOptions.zod.includeInferType}
                    onCheckedChange={(checked) => {
                      setCodeGenOptions((previous) => ({
                        ...previous,
                        zod: {
                          ...previous.zod,
                          includeInferType: checked,
                        },
                      }));
                    }}
                  />
                </div>
              )}

              {rightFormat === "go" && (
                <div className="flex items-center justify-between rounded-md border bg-background px-3 py-2">
                  <div className="space-y-1">
                    <Label>生成 JSON Tag</Label>
                    <p className="text-xs text-muted-foreground">
                      为 Go struct 字段附带 `json` 标签
                    </p>
                  </div>
                  <Switch
                    checked={codeGenOptions.go.includeJsonTag}
                    onCheckedChange={(checked) => {
                      setCodeGenOptions((previous) => ({
                        ...previous,
                        go: {
                          ...previous.go,
                          includeJsonTag: checked,
                        },
                      }));
                    }}
                  />
                </div>
              )}
            </div>
          )}

          <EditorToolbar
            canUpload={side === "left"}
            onClear={() => {
              clearSide(side);
            }}
            onCopy={async () => {
              await copySide(side);
            }}
            onDownload={() => {
              downloadSide(side);
            }}
            onFormat={() => {
              void editorRef.current
                ?.getAction("editor.action.formatDocument")
                ?.run();
            }}
            onUpload={
              side === "left"
                ? async (file) => {
                    await uploadLeftFile(file);
                  }
                : undefined
            }
          />
        </div>
      </CardHeader>

      <CardContent className="min-h-0 flex-1 p-0">
        <div className="h-full min-h-[420px]">
          <MonacoCodeEditor
            format={currentFormat}
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
            path={editorPath}
            theme={resolvedTheme as "dark" | "light"}
            value={currentValue}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default EditorPanel;
