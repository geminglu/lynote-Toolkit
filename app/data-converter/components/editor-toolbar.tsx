import {
  Copy,
  Download,
  Eraser,
  PaintbrushVertical,
  Upload,
} from "lucide-react";
import { Button } from "lynote-ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "lynote-ui/tooltip";
import { useRef, type FC, type ReactNode } from "react";

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

/**
 * 编辑器工具栏属性。
 */
export type EditorToolbarProps = {
  canUpload?: boolean;
  onFormat: () => void;
  onClear: () => void;
  onCopy: () => Promise<void>;
  onDownload: () => void;
  onUpload?: (file: File) => Promise<void>;
};

const EditorToolbar: FC<EditorToolbarProps> = ({
  canUpload = false,
  onFormat,
  onClear,
  onCopy,
  onDownload,
  onUpload,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="flex flex-wrap gap-2">
      <ToolbarIconButton label="格式化" onClick={onFormat}>
        <PaintbrushVertical />
      </ToolbarIconButton>
      <ToolbarIconButton label="清空" onClick={onClear}>
        <Eraser />
      </ToolbarIconButton>
      <ToolbarIconButton
        label="复制"
        onClick={() => {
          void onCopy();
        }}
      >
        <Copy />
      </ToolbarIconButton>
      <ToolbarIconButton label="下载文件" onClick={onDownload}>
        <Download />
      </ToolbarIconButton>

      {canUpload && onUpload && (
        <>
          <ToolbarIconButton
            label="上传文件"
            onClick={() => {
              fileInputRef.current?.click();
            }}
          >
            <Upload />
          </ToolbarIconButton>

          <input
            ref={fileInputRef}
            accept=".json,.yaml,.yml,.xml,text/plain,application/json,application/xml"
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
        </>
      )}
    </div>
  );
};

export default EditorToolbar;
