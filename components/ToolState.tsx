import { CircleAlertIcon, LoaderCircleIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "lynote-ui/alert";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "lynote-ui/empty";
import type { FC } from "react";

interface ToolErrorStatePropsType {
  title: string;
  message: string;
}

interface ToolEmptyStatePropsType {
  title: string;
  description: string;
}

interface ToolLoadingStatePropsType {
  message: string;
}

/** 统一工具页错误状态，确保错误信息在各工作台具有一致层级。 */
export const ToolErrorState: FC<ToolErrorStatePropsType> = ({
  title,
  message,
}) => (
  <Alert variant="destructive">
    <CircleAlertIcon />
    <AlertTitle>{title}</AlertTitle>
    <AlertDescription>{message}</AlertDescription>
  </Alert>
);

/** 统一工具页初始空态，引导用户回到左侧完成下一步操作。 */
export const ToolEmptyState: FC<ToolEmptyStatePropsType> = ({
  title,
  description,
}) => (
  <Empty className="min-h-28 border border-dashed bg-muted/10">
    <EmptyHeader>
      <EmptyTitle>{title}</EmptyTitle>
      <EmptyDescription>{description}</EmptyDescription>
    </EmptyHeader>
  </Empty>
);

/** 统一工具页执行中状态，并通过 live region 向辅助技术播报。 */
export const ToolLoadingState: FC<ToolLoadingStatePropsType> = ({
  message,
}) => (
  <div
    aria-live="polite"
    className="flex min-h-28 items-center gap-3 rounded-lg border border-dashed bg-muted/10 p-6 text-sm"
    role="status"
  >
    <LoaderCircleIcon
      aria-hidden="true"
      className="size-4 shrink-0 animate-spin motion-reduce:animate-none"
    />
    <span>{message}</span>
  </div>
);
