export type CronFieldKey =
  | "second"
  | "minute"
  | "hour"
  | "dayOfMonth"
  | "month"
  | "dayOfWeek"
  | "year";

export type CronFieldMode =
  | "every"
  | "interval"
  | "specific"
  | "range"
  | "unspecified";

export type CronDayStrategy = "dayOfMonth" | "dayOfWeek";

export type CronFieldState = {
  mode: CronFieldMode;
  values: string;
  start: string;
  end: string;
  step: string;
};

export type CronToolState = {
  expression: string;
  fields: Record<CronFieldKey, CronFieldState>;
  dayStrategy: CronDayStrategy;
};

export type CronIssueSeverity = "info" | "warning" | "danger";

export type CronIssue = {
  id: string;
  severity: CronIssueSeverity;
  message: string;
};

export type CronFieldOption = {
  value: string;
  label: string;
};

export type CronFieldMeta = {
  key: CronFieldKey;
  label: string;
  unit: string;
  min: number;
  max: number;
  defaultValue: string;
  defaultStep: string;
  options: CronFieldOption[];
  supportsUnspecified: boolean;
};

export type ParseResult =
  | {
      ok: true;
      state: CronToolState;
      issues: CronIssue[];
    }
  | {
      ok: false;
      issues: CronIssue[];
    };
