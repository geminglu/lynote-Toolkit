import { cn } from "@/lib/utils";
import { Button } from "lynote-ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "lynote-ui/dialog";
import { Empty, EmptyHeader, EmptyTitle } from "lynote-ui/empty";
import { ScrollArea } from "lynote-ui/scroll-area";
import { useSidebar } from "lynote-ui/sidebar";
import { useMemo, useState, type FC } from "react";

import { useJsonFormattingContext } from "../hooks/useJsonFormattingContext";

function formatUpdateTime(timestamp: number) {
  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    day: "2-digit",
  }).format(timestamp);
}

const HistorySidebarContent: FC = () => {
  const {
    activeRecordId,
    createDraft,
    deleteRecord,
    loading,
    records,
    selectRecord,
  } = useJsonFormattingContext();
  const { isMobile, setOpenMobile, state } = useSidebar();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const collapsed = !isMobile && state === "collapsed";

  const closeMobileSidebar = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const currentDeletingRecord = useMemo(
    () => records.find((item) => item.id === deletingId) ?? null,
    [deletingId, records],
  );

  return (
    <>
      <div className="flex items-center gap-2 border-b px-3 py-3">
        <Button
          className={cn("flex-1", collapsed && "px-0")}
          onClick={() => {
            createDraft();
            closeMobileSidebar();
          }}
          size="sm"
        >
          {collapsed ? "新" : "新建草稿"}
        </Button>
      </div>

      <div className="px-3 pt-3 pb-2">
        <div className="text-xs text-muted-foreground">
          {collapsed ? `记 ${records.length}` : `历史记录 ${records.length} 条`}
        </div>
      </div>

      <ScrollArea className="">
        <div className="flex flex-col gap-2 px-3 py-3">
          {!loading && records.length === 0 && (
            <Empty className="border-none p-4">
              <EmptyHeader>
                <EmptyTitle className="text-sm">暂无历史记录</EmptyTitle>
              </EmptyHeader>
            </Empty>
          )}

          {records.map((record, index) => {
            const active = record.id === activeRecordId;

            return (
              <div
                className={cn(
                  "flex items-start gap-2 rounded-lg border bg-background p-2 transition-colors hover:bg-accent/50",
                  active && "border-primary/40 bg-accent/40",
                  collapsed && "justify-center px-1",
                )}
                key={record.id}
              >
                <button
                  className={cn(
                    "min-w-0 flex-1 text-left",
                    collapsed && "flex items-center justify-center text-center",
                  )}
                  onClick={() => {
                    selectRecord(record.id);
                    closeMobileSidebar();
                  }}
                  title={record.title}
                  type="button"
                >
                  {collapsed ? (
                    <div className="text-sm font-medium">{index + 1}</div>
                  ) : (
                    <div className="flex min-w-0 flex-col gap-1">
                      <div className="truncate text-sm font-medium">
                        {record.title}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatUpdateTime(record.updatedAt)}
                      </div>
                    </div>
                  )}
                </button>

                <Button
                  className={cn(collapsed && "hidden")}
                  onClick={() => {
                    setDeletingId(record.id);
                  }}
                  size="sm"
                  type="button"
                  variant="destructive"
                >
                  删除
                </Button>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      <Dialog
        onOpenChange={(open) => {
          if (!open) {
            setDeletingId(null);
          }
        }}
        open={!!currentDeletingRecord}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>删除历史记录</DialogTitle>
            <DialogDescription>
              {currentDeletingRecord
                ? `确定删除“${currentDeletingRecord.title}”吗？该操作会移除本地保存的数据。`
                : "确定删除当前历史记录吗？"}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={() => {
                setDeletingId(null);
              }}
              variant="outline"
            >
              取消
            </Button>
            <Button
              onClick={() => {
                if (!currentDeletingRecord) {
                  return;
                }

                void deleteRecord(currentDeletingRecord.id);
                setDeletingId(null);
              }}
              variant="destructive"
            >
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

type HistorySidebarProps = {
  className?: string;
};

const HistorySidebar: FC<HistorySidebarProps> = () => {
  return <HistorySidebarContent />;
};

export default HistorySidebar;
