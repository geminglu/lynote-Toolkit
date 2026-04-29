import {
  ArrowLeftRight,
  Copy,
  Download,
  Eraser,
  FileUp,
  PaintbrushVertical,
  Redo,
  RotateCcw,
  Undo,
} from "lucide-react";
import { Button } from "lynote-ui/button";
import { Label } from "lynote-ui/label";
import { NativeSelect, NativeSelectOption } from "lynote-ui/native-select";
import { Switch } from "lynote-ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "lynote-ui/tooltip";
import dynamic from "next/dynamic";
import { useRef, type FC, type ReactNode } from "react";

import { useDiffToolContext } from "../hooks/useDiffToolContext";
import type { DiffSide, DiffViewMode } from "../type";
import { formatFileSize } from "../utils";
import type { LanguageComboboxProps } from "./language-combobox";

/**
 * 仅在浏览器端渲染的语法高亮搜索选择器。
 *
 * Base UI Combobox 会生成运行时 id 和状态属性，参与 SSR 时容易出现 hydration
 * 属性不一致。这里关闭 SSR，让它只在客户端接管语言搜索交互。
 */
const LanguageCombobox = dynamic<LanguageComboboxProps>(
  () => import("./language-combobox").then((module) => module.default),
  {
    ssr: false,
    loading: () => (
      <div className="h-8 w-48 rounded-md border border-input bg-background px-3 py-1 text-sm text-muted-foreground">
        加载语言列表...
      </div>
    ),
  },
);

/**
 * 图标按钮组件的入参。
 *
 * 工具栏大量操作都使用 icon button，这里统一声明 label、点击事件和禁用状态，
 * 同时把 label 用于 tooltip 和无障碍文本。
 */
type ToolbarIconButtonProps = {
  /**
   * 按钮可访问名称和 tooltip 文案。
   */
  label: string;
  /**
   * 点击按钮时执行的动作。
   */
  onClick: () => void;
  /**
   * 按钮内展示的图标。
   */
  children: ReactNode;
  /**
   * 是否禁用按钮。
   */
  disabled?: boolean;
};

/**
 * 带 tooltip 的工具栏图标按钮。
 *
 * 该组件封装 `lynote-ui` 的 Button 和 Tooltip，保证所有工具栏按钮在视觉、
 * tooltip 和无障碍文本上保持一致。
 */
const ToolbarIconButton: FC<ToolbarIconButtonProps> = ({
  label,
  onClick,
  children,
  disabled,
}) => (
  <Tooltip>
    <TooltipTrigger
      render={
        <Button
          aria-label={label}
          disabled={disabled}
          onClick={onClick}
          size="icon"
          variant="outline"
        >
          {children}
          <span className="sr-only">{label}</span>
        </Button>
      }
    />
    <TooltipContent>
      <p>{label}</p>
    </TooltipContent>
  </Tooltip>
);

/**
 * 单侧文件操作区域属性。
 */
type SideActionGroupProps = {
  /**
   * 当前操作对应 DiffEditor 的哪一侧。
   */
  side: DiffSide;
  /**
   * 展示给用户的区域标题，例如“原始文本”或“修改后文本”。
   */
  title: string;
};

/**
 * 原始文本/修改后文本的文件操作组。
 *
 * 负责展示最近上传文件信息，并提供上传、复制、下载三个针对单侧内容的操作。
 * 语言高亮不在这里切换，因为当前产品设计要求全局只保留一个语法高亮下拉。
 */
const SideActionGroup: FC<SideActionGroupProps> = ({ side, title }) => {
  const { originalFile, modifiedFile, uploadFile, copySide, downloadSide } =
    useDiffToolContext();
  /**
   * 隐藏的文件选择 input。
   *
   * UI 上使用图标按钮触发文件选择，真实 input 保持隐藏，便于统一按钮样式。
   */
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  /**
   * 当前侧最近一次上传的文件信息。
   */
  const fileInfo = side === "original" ? originalFile : modifiedFile;

  return (
    <div className="rounded-2xl border border-border/60 bg-background/70 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-sm font-medium">{title}</div>
          <div className="text-xs text-muted-foreground">
            {fileInfo
              ? `${fileInfo.name} · ${formatFileSize(fileInfo.size)} · ${
                  fileInfo.language
                }`
              : "可手动输入，或上传 UTF-8 文本文件"}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <ToolbarIconButton
            label={`上传${title}`}
            onClick={() => {
              fileInputRef.current?.click();
            }}
          >
            <FileUp />
          </ToolbarIconButton>
          <ToolbarIconButton
            label={`复制${title}`}
            onClick={() => {
              void copySide(side);
            }}
          >
            <Copy />
          </ToolbarIconButton>
          <ToolbarIconButton
            label={`下载${title}`}
            onClick={() => {
              downloadSide(side);
            }}
          >
            <Download />
          </ToolbarIconButton>
        </div>
      </div>

      <input
        ref={fileInputRef}
        accept=".txt,.md,.markdown,.json,.jsonc,.js,.mjs,.cjs,.ts,.tsx,.html,.htm,.css,.scss,.less,.xml,.svg,.yaml,.yml,.sql,.sh,.bash,.zsh,.py,.java,.go,.rs,.c,.cc,.cpp,.h,.hpp,.cs,.php,.rb,text/*,application/json"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];

          if (!file) {
            return;
          }

          void uploadFile(side, file);
          event.target.value = "";
        }}
        type="file"
      />
    </div>
  );
};

type DiffToolbarProps = {
  /**
   * 触发 Monaco 对两侧文档执行格式化。
   *
   * 真正的 Monaco action 在编辑器组件内执行，工具栏只负责发起请求。
   */
  onFormat: () => void;
};

/**
 * 文本对比工具的主工具栏。
 *
 * 该组件聚合单侧文件操作、全局 DiffEditor 设置、差异跳转和统计展示。它不直接
 * 调用 Monaco 实例，只通过上下文调用状态层动作。
 */
const DiffToolbar: FC<DiffToolbarProps> = ({ onFormat }) => {
  const {
    viewMode,
    ignoreTrimWhitespace,
    collapseUnchangedRegions,
    wordWrap,
    readOnly,
    originalLanguage,
    languageOptions,
    diffStats,
    activeDiffIndex,
    updateViewMode,
    updateIgnoreTrimWhitespace,
    updateCollapseUnchangedRegions,
    updateWordWrap,
    updateReadOnly,
    updateBothLanguages,
    clearAll,
    resetExample,
    swapSides,
    goToPreviousDiff,
    goToNextDiff,
  } = useDiffToolContext();

  return (
    <div className="space-y-4">
      <div className="grid gap-3 xl:grid-cols-2">
        <SideActionGroup side="original" title="原始文本" />
        <SideActionGroup side="modified" title="修改后文本" />
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border/60 bg-card/80 p-3">
        <ToolbarIconButton label="格式化两侧" onClick={onFormat}>
          <PaintbrushVertical />
        </ToolbarIconButton>
        <ToolbarIconButton label="清空工作区" onClick={clearAll}>
          <Eraser />
        </ToolbarIconButton>
        <ToolbarIconButton label="交换两侧内容" onClick={swapSides}>
          <ArrowLeftRight />
        </ToolbarIconButton>
        <ToolbarIconButton label="恢复示例内容" onClick={resetExample}>
          <RotateCcw />
        </ToolbarIconButton>
        <ToolbarIconButton
          disabled={diffStats.changes === 0}
          label="上一个差异"
          onClick={goToPreviousDiff}
        >
          <Undo />
        </ToolbarIconButton>
        <ToolbarIconButton
          disabled={diffStats.changes === 0}
          label="下一个差异"
          onClick={goToNextDiff}
        >
          <Redo />
        </ToolbarIconButton>

        <div className="h-8 w-px bg-border" />

        <div className="flex items-center gap-2">
          <Label htmlFor="diff-view-mode" className="text-xs">
            视图
          </Label>
          <NativeSelect
            id="diff-view-mode"
            onChange={(event) => {
              updateViewMode(event.target.value as DiffViewMode);
            }}
            value={viewMode}
          >
            <NativeSelectOption value="side-by-side">并排</NativeSelectOption>
            <NativeSelectOption value="inline">逐行</NativeSelectOption>
          </NativeSelect>
        </div>

        <div className="flex items-center gap-2">
          <Label htmlFor="diff-language" className="text-xs">
            语法高亮
          </Label>
          <LanguageCombobox
            onChange={updateBothLanguages}
            options={languageOptions}
            value={originalLanguage}
          />
        </div>

        <div className="flex flex-wrap gap-3 text-sm">
          <label className="flex items-center gap-2 rounded-xl border px-3 py-2">
            <Switch
              checked={ignoreTrimWhitespace}
              onCheckedChange={updateIgnoreTrimWhitespace}
            />
            忽略行尾空白
          </label>
          <label className="flex items-center gap-2 rounded-xl border px-3 py-2">
            <Switch
              checked={collapseUnchangedRegions}
              onCheckedChange={updateCollapseUnchangedRegions}
            />
            折叠未变化行
          </label>
          <label className="flex items-center gap-2 rounded-xl border px-3 py-2">
            <Switch checked={wordWrap} onCheckedChange={updateWordWrap} />
            自动换行
          </label>
          <label className="flex items-center gap-2 rounded-xl border px-3 py-2">
            <Switch checked={readOnly} onCheckedChange={updateReadOnly} />
            只读
          </label>
        </div>

        <div className="ml-auto flex items-center gap-2 text-sm">
          <div className="">
            <span className="text-green-600 dark:text-green-400">
              +{diffStats.additions}
            </span>{" "}
            <span className="text-red-600 dark:text-red-400">
              -{diffStats.deletions}
            </span>{" "}
            <span className="text-yellow-600 dark:text-yellow-400">
              ~
              {diffStats.changes > 0
                ? `${activeDiffIndex + 1}/${diffStats.changes}`
                : 0}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiffToolbar;
