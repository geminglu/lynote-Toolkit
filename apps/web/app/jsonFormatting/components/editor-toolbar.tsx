import {
  Copy,
  Download,
  ListChevronsDownUp,
  ListChevronsUpDown,
  ListMinus,
  Paintbrush,
  PaintbrushVertical,
  SwatchBook,
  Upload,
} from "lucide-react";
import { Button } from "lynote-ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "lynote-ui/tooltip";
import { useRef, type FC, type ReactNode } from "react";

import type { EditorSide } from "../type";

export type PropsType = {
  side: EditorSide;
  onFormat: () => void;
  onClear: () => void;
  onUpload: (file: File) => Promise<void>;
  onDownload: () => void;
  onCopy: () => Promise<void>;
  onCompress: () => void;
  onEscape: () => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
};

type ToolbarIconButtonProps = {
  label: string;
  onClick: () => void;
  children: ReactNode;
};

const ToolbarIconButton: FC<ToolbarIconButtonProps> = ({
  label,
  onClick,
  children,
}) => (
  <Tooltip>
    <TooltipTrigger
      render={
        <Button
          aria-label={label}
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

const EditorToolbar: FC<PropsType> = ({
  side,
  onFormat,
  onClear,
  onUpload,
  onDownload,
  onCopy,
  onCompress,
  onEscape,
  onExpandAll,
  onCollapseAll,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="flex flex-wrap gap-2">
      <ToolbarIconButton label="格式化" onClick={onFormat}>
        <PaintbrushVertical />
      </ToolbarIconButton>
      <ToolbarIconButton label="清除" onClick={onClear}>
        <Paintbrush />
      </ToolbarIconButton>
      <ToolbarIconButton
        label="上传 JSON"
        onClick={() => {
          fileInputRef.current?.click();
        }}
      >
        <Upload />
      </ToolbarIconButton>
      <ToolbarIconButton label="下载文件" onClick={onDownload}>
        <Download />
      </ToolbarIconButton>
      <ToolbarIconButton
        label="复制"
        onClick={() => {
          void onCopy();
        }}
      >
        <Copy />
      </ToolbarIconButton>
      <ToolbarIconButton label="压缩" onClick={onCompress}>
        <ListMinus />
      </ToolbarIconButton>
      <ToolbarIconButton label="转义" onClick={onEscape}>
        <SwatchBook />
      </ToolbarIconButton>
      <ToolbarIconButton label="全部展开" onClick={onExpandAll}>
        <ListChevronsUpDown />
      </ToolbarIconButton>
      <ToolbarIconButton label="全部折叠" onClick={onCollapseAll}>
        <ListChevronsDownUp />
      </ToolbarIconButton>

      {/**
       * 上传按钮只负责触发选择文件。
       * 真正的导入逻辑统一交给页面状态层，并始终写入左侧主编辑区。
       */}
      <input
        ref={fileInputRef}
        accept=".json,application/json"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];

          if (!file) {
            return;
          }

          void onUpload(file);
          event.target.value = "";
        }}
        type="file"
      />

      <div className="text-muted-foreground flex items-center text-xs">
        {side === "left" ? "主输入区" : "结果编辑区"}
      </div>
    </div>
  );
};

export default EditorToolbar;
