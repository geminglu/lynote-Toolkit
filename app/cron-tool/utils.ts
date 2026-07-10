import type {
  CronDayStrategy,
  CronFieldKey,
  CronFieldMeta,
  CronFieldMode,
  CronFieldState,
  CronIssue,
  CronIssueSeverity,
  CronToolState,
  ParseResult,
} from "./type";

export const CRON_FIELD_ORDER: CronFieldKey[] = [
  "second",
  "minute",
  "hour",
  "dayOfMonth",
  "month",
  "dayOfWeek",
  "year",
];

export const CRON_FIELD_MODE_OPTIONS: Array<{
  value: Exclude<CronFieldMode, "unspecified">;
  label: string;
}> = [
  { value: "every", label: "每一" },
  { value: "interval", label: "周期" },
  { value: "specific", label: "指定" },
  { value: "range", label: "范围" },
];

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_MIN = 1970;
const YEAR_MAX = 2099;

const WEEKDAY_LABELS: Record<number, string> = {
  1: "周日",
  2: "周一",
  3: "周二",
  4: "周三",
  5: "周四",
  6: "周五",
  7: "周六",
};

function createNumberOptions(
  min: number,
  max: number,
  formatter: (value: number) => string = String,
) {
  return Array.from({ length: max - min + 1 }, (_, index) => {
    const value = min + index;

    return { value: String(value), label: formatter(value) };
  });
}

export const CRON_FIELD_META: Record<CronFieldKey, CronFieldMeta> = {
  second: {
    key: "second",
    label: "秒",
    unit: "秒",
    min: 0,
    max: 59,
    defaultValue: "0",
    defaultStep: "5",
    options: createNumberOptions(0, 59),
    supportsUnspecified: false,
  },
  minute: {
    key: "minute",
    label: "分",
    unit: "分钟",
    min: 0,
    max: 59,
    defaultValue: "0",
    defaultStep: "5",
    options: createNumberOptions(0, 59),
    supportsUnspecified: false,
  },
  hour: {
    key: "hour",
    label: "时",
    unit: "小时",
    min: 0,
    max: 23,
    defaultValue: "9",
    defaultStep: "1",
    options: createNumberOptions(0, 23, (value) => `${value}时`),
    supportsUnspecified: false,
  },
  dayOfMonth: {
    key: "dayOfMonth",
    label: "日",
    unit: "日",
    min: 1,
    max: 31,
    defaultValue: "1",
    defaultStep: "1",
    options: createNumberOptions(1, 31, (value) => `${value}日`),
    supportsUnspecified: true,
  },
  month: {
    key: "month",
    label: "月",
    unit: "个月",
    min: 1,
    max: 12,
    defaultValue: "1",
    defaultStep: "1",
    options: createNumberOptions(1, 12, (value) => `${value}月`),
    supportsUnspecified: false,
  },
  dayOfWeek: {
    key: "dayOfWeek",
    label: "周",
    unit: "天",
    min: 1,
    max: 7,
    defaultValue: "2",
    defaultStep: "1",
    options: createNumberOptions(1, 7, (value) => WEEKDAY_LABELS[value]),
    supportsUnspecified: true,
  },
  year: {
    key: "year",
    label: "年",
    unit: "年",
    min: YEAR_MIN,
    max: YEAR_MAX,
    defaultValue: String(CURRENT_YEAR),
    defaultStep: "1",
    options: [],
    supportsUnspecified: false,
  },
};

export const CRON_PRESET_OPTIONS = [
  { id: "daily-9", label: "每天 09:00", expression: "0 0 9 * * ? *" },
  { id: "every-5-minutes", label: "每 5 分钟", expression: "0 0/5 * * * ? *" },
  { id: "weekday-930", label: "工作日 09:30", expression: "0 30 9 ? * 2-6 *" },
  { id: "monthly-first", label: "每月 1 日", expression: "0 0 0 1 * ? *" },
  { id: "yearly", label: "每年 1 月 1 日", expression: "0 0 0 1 1 ? *" },
];

function createIssue(
  id: string,
  severity: CronIssueSeverity,
  message: string,
): CronIssue {
  return { id, severity, message };
}

function createFieldState(
  mode: CronFieldMode,
  meta: CronFieldMeta,
  overrides: Partial<CronFieldState> = {},
): CronFieldState {
  return {
    mode,
    values: mode === "specific" ? meta.defaultValue : "",
    start: meta.defaultValue,
    end: String(Math.min(meta.max, Number(meta.defaultValue) + 1)),
    step: meta.defaultStep,
    ...overrides,
  };
}

function normalizeState(state: CronToolState): CronToolState {
  const fields = { ...state.fields };

  if (state.dayStrategy === "dayOfMonth") {
    fields.dayOfWeek = createFieldState(
      "unspecified",
      CRON_FIELD_META.dayOfWeek,
    );
    if (fields.dayOfMonth.mode === "unspecified") {
      fields.dayOfMonth = createFieldState("every", CRON_FIELD_META.dayOfMonth);
    }
  } else {
    fields.dayOfMonth = createFieldState(
      "unspecified",
      CRON_FIELD_META.dayOfMonth,
    );
    if (fields.dayOfWeek.mode === "unspecified") {
      fields.dayOfWeek = createFieldState("every", CRON_FIELD_META.dayOfWeek);
    }
  }

  return { ...state, fields };
}

export function createDefaultCronToolState(): CronToolState {
  const fields: Record<CronFieldKey, CronFieldState> = {
    second: createFieldState("specific", CRON_FIELD_META.second, {
      values: "0",
    }),
    minute: createFieldState("specific", CRON_FIELD_META.minute, {
      values: "0",
    }),
    hour: createFieldState("specific", CRON_FIELD_META.hour, { values: "9" }),
    dayOfMonth: createFieldState("every", CRON_FIELD_META.dayOfMonth),
    month: createFieldState("every", CRON_FIELD_META.month),
    dayOfWeek: createFieldState("unspecified", CRON_FIELD_META.dayOfWeek),
    year: createFieldState("every", CRON_FIELD_META.year),
  };
  const state: CronToolState = {
    expression: "",
    fields,
    dayStrategy: "dayOfMonth",
  };

  return syncExpression(state);
}

export function syncExpression(state: CronToolState): CronToolState {
  const normalized = normalizeState(state);

  return {
    ...normalized,
    expression: buildCronExpression(normalized),
  };
}

export function buildCronExpression(state: CronToolState): string {
  const normalized = normalizeState(state);

  return CRON_FIELD_ORDER.map((key) =>
    fieldStateToCron(CRON_FIELD_META[key], normalized.fields[key]),
  ).join(" ");
}

function fieldStateToCron(meta: CronFieldMeta, field: CronFieldState) {
  if (field.mode === "unspecified") return "?";
  if (field.mode === "every") return "*";

  if (field.mode === "interval") {
    const start = normalizeSingleValue(field.start, meta) ?? meta.min;
    const step =
      normalizePositiveInteger(field.step) ?? Number(meta.defaultStep);

    return `${start}/${step}`;
  }

  if (field.mode === "range") {
    const start = normalizeSingleValue(field.start, meta) ?? meta.min;
    const end = normalizeSingleValue(field.end, meta) ?? meta.max;

    return `${start}-${end}`;
  }

  const values = normalizeValues(field.values, meta);

  return values.length ? values.join(",") : meta.defaultValue;
}

export function parseCronExpression(expression: string): ParseResult {
  const text = expression.trim().replace(/\s+/g, " ");
  const issues: CronIssue[] = [];

  if (!text) {
    return {
      ok: false,
      issues: [createIssue("empty", "danger", "请输入 cron 表达式。")],
    };
  }

  if (/^(cron|rate)\s*\(/i.test(text)) {
    return {
      ok: false,
      issues: [
        createIssue(
          "wrapper-unsupported",
          "danger",
          "当前工具只支持直接输入 6 或 7 字段表达式，不支持 cron(...) 或 rate(...）。",
        ),
      ],
    };
  }

  if (/[LW#]/i.test(text)) {
    return {
      ok: false,
      issues: [
        createIssue(
          "advanced-unsupported",
          "danger",
          "当前工具暂不支持 L、W、# 等高级 Quartz 符号。",
        ),
      ],
    };
  }

  const parts = text.split(" ");

  if (parts.length !== 6 && parts.length !== 7) {
    return {
      ok: false,
      issues: [
        createIssue(
          "field-count",
          "danger",
          "cron 表达式必须是 6 字段或 7 字段：秒 分 时 日 月 周 年。",
        ),
      ],
    };
  }

  const normalizedParts = parts.length === 6 ? [...parts, "*"] : parts;

  if (parts.length === 6) {
    issues.push(
      createIssue("year-added", "info", "已按全年处理，自动补全年字段 *。"),
    );
  }

  const [second, minute, hour, dayOfMonth, month, dayOfWeek, year] =
    normalizedParts;
  const dayStrategy = resolveDayStrategy(dayOfMonth, dayOfWeek);

  if (!dayStrategy) {
    return {
      ok: false,
      issues: [
        createIssue(
          "day-strategy",
          "danger",
          "日期字段和星期字段必须有且只有一个为 ?。例如：0 30 9 ? * 2-6 *。",
        ),
      ],
    };
  }

  const parsedFields = {
    second: parseFieldToken(second, CRON_FIELD_META.second),
    minute: parseFieldToken(minute, CRON_FIELD_META.minute),
    hour: parseFieldToken(hour, CRON_FIELD_META.hour),
    dayOfMonth: parseFieldToken(dayOfMonth, CRON_FIELD_META.dayOfMonth),
    month: parseFieldToken(month, CRON_FIELD_META.month),
    dayOfWeek: parseFieldToken(dayOfWeek, CRON_FIELD_META.dayOfWeek),
    year: parseFieldToken(year, CRON_FIELD_META.year),
  } satisfies Record<CronFieldKey, ReturnType<typeof parseFieldToken>>;

  const parseIssues = CRON_FIELD_ORDER.flatMap(
    (key) => parsedFields[key].issues,
  );

  if (parseIssues.some((issue) => issue.severity === "danger")) {
    return { ok: false, issues: [...issues, ...parseIssues] };
  }

  const state = syncExpression({
    expression: normalizedParts.join(" "),
    fields: {
      second: parsedFields.second.field,
      minute: parsedFields.minute.field,
      hour: parsedFields.hour.field,
      dayOfMonth: parsedFields.dayOfMonth.field,
      month: parsedFields.month.field,
      dayOfWeek: parsedFields.dayOfWeek.field,
      year: parsedFields.year.field,
    },
    dayStrategy,
  });

  return {
    ok: true,
    state,
    issues: [...issues, ...validateCronState(state)],
  };
}

function resolveDayStrategy(
  dayOfMonth: string,
  dayOfWeek: string,
): CronDayStrategy | null {
  if (dayOfMonth === "?" && dayOfWeek !== "?") return "dayOfWeek";
  if (dayOfWeek === "?" && dayOfMonth !== "?") return "dayOfMonth";

  return null;
}

function parseFieldToken(token: string, meta: CronFieldMeta) {
  const issues: CronIssue[] = [];
  const value = token.trim();

  if (value === "?") {
    if (!meta.supportsUnspecified) {
      issues.push(
        createIssue(
          `${meta.key}-question`,
          "danger",
          `${meta.label}字段不能使用 ?。只有日和周字段支持 ?。`,
        ),
      );
    }

    return {
      field: createFieldState("unspecified", meta),
      issues,
    };
  }

  if (value === "*") {
    return { field: createFieldState("every", meta), issues };
  }

  if (value.includes("/")) {
    const match = value.match(/^(\*|\d+)\/(\d+)$/);

    if (!match) {
      issues.push(
        createIssue(
          `${meta.key}-interval-format`,
          "danger",
          `${meta.label}字段的周期格式应为 起始值/间隔，例如 0/5。`,
        ),
      );
      return { field: createFieldState("interval", meta), issues };
    }

    const start = match[1] === "*" ? String(meta.min) : match[1];
    const step = match[2];
    issues.push(...validateSingleValue(start, meta));
    issues.push(...validateStep(step, meta));

    return {
      field: createFieldState("interval", meta, { start, step }),
      issues,
    };
  }

  if (value.includes("-") && !value.includes(",")) {
    const match = value.match(/^(\d+)-(\d+)$/);

    if (!match) {
      issues.push(
        createIssue(
          `${meta.key}-range-format`,
          "danger",
          `${meta.label}字段的范围格式应为 起始值-结束值，例如 1-5。`,
        ),
      );
      return { field: createFieldState("range", meta), issues };
    }

    const [, start, end] = match;
    issues.push(...validateRange(start, end, meta));

    return {
      field: createFieldState("range", meta, { start, end }),
      issues,
    };
  }

  if (/^\d+(,\d+)*$/.test(value)) {
    issues.push(...validateValues(value, meta));

    return {
      field: createFieldState("specific", meta, {
        values: normalizeValues(value, meta).join(","),
      }),
      issues,
    };
  }

  if (value.includes(",") || value.includes("-")) {
    issues.push(
      createIssue(
        `${meta.key}-mixed-format`,
        "danger",
        `${meta.label}字段暂不支持列表和范围混合，请使用纯列表或纯范围。`,
      ),
    );
  } else {
    issues.push(
      createIssue(
        `${meta.key}-invalid-token`,
        "danger",
        `${meta.label}字段只能使用数字、*、?、列表、范围或周期。`,
      ),
    );
  }

  return { field: createFieldState("every", meta), issues };
}

export function validateCronState(state: CronToolState): CronIssue[] {
  const normalized = normalizeState(state);
  const issues: CronIssue[] = [];

  for (const key of CRON_FIELD_ORDER) {
    const meta = CRON_FIELD_META[key];
    const field = normalized.fields[key];

    if (field.mode === "unspecified") {
      if (!meta.supportsUnspecified) {
        issues.push(
          createIssue(
            `${key}-unspecified`,
            "danger",
            `${meta.label}字段不能使用 ?。`,
          ),
        );
      }
      continue;
    }

    if (field.mode === "every") continue;

    if (field.mode === "interval") {
      issues.push(...validateSingleValue(field.start, meta));
      issues.push(...validateStep(field.step, meta));
      continue;
    }

    if (field.mode === "range") {
      issues.push(...validateRange(field.start, field.end, meta));
      continue;
    }

    issues.push(...validateValues(field.values, meta));
  }

  return issues;
}

function validateValues(values: string, meta: CronFieldMeta): CronIssue[] {
  const issues: CronIssue[] = [];
  const parts = values
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return [
      createIssue(
        `${meta.key}-empty-values`,
        "danger",
        `${meta.label}字段至少需要选择一个值。`,
      ),
    ];
  }

  for (const part of parts) {
    issues.push(...validateSingleValue(part, meta));
  }

  return issues;
}

function validateRange(
  start: string,
  end: string,
  meta: CronFieldMeta,
): CronIssue[] {
  const issues = [
    ...validateSingleValue(start, meta),
    ...validateSingleValue(end, meta),
  ];
  const startNumber = Number(start);
  const endNumber = Number(end);

  if (issues.length === 0 && meta.key === "year" && startNumber > endNumber) {
    issues.push(
      createIssue(
        `${meta.key}-range-order`,
        "danger",
        `${meta.label}字段的范围起始值不能大于结束值。`,
      ),
    );
  }

  return issues;
}

function validateStep(step: string, meta: CronFieldMeta): CronIssue[] {
  const number = Number(step);
  const maxStep = meta.max - meta.min + 1;

  if (!/^\d+$/.test(step) || number < 1 || number > maxStep) {
    return [
      createIssue(
        `${meta.key}-step`,
        "danger",
        `${meta.label}字段的周期必须是 1-${maxStep} 之间的整数。`,
      ),
    ];
  }

  return [];
}

function validateSingleValue(value: string, meta: CronFieldMeta): CronIssue[] {
  const number = Number(value);

  if (!/^\d+$/.test(value) || number < meta.min || number > meta.max) {
    return [
      createIssue(
        `${meta.key}-value`,
        "danger",
        `${meta.label}字段必须在 ${meta.min}-${meta.max} 之间。`,
      ),
    ];
  }

  return [];
}

function normalizeValues(values: string, meta: CronFieldMeta) {
  return [
    ...new Set(
      values
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
        .map(Number)
        .filter(
          (value) =>
            Number.isInteger(value) && value >= meta.min && value <= meta.max,
        ),
    ),
  ].sort((left, right) => left - right);
}

function normalizeSingleValue(value: string, meta: CronFieldMeta) {
  const number = Number(value);

  return Number.isInteger(number) && number >= meta.min && number <= meta.max
    ? number
    : null;
}

function normalizePositiveInteger(value: string) {
  const number = Number(value);

  return Number.isInteger(number) && number > 0 ? number : null;
}

export function describeCronExpression(state: CronToolState): string {
  const issues = validateCronState(state);

  if (issues.some((issue) => issue.severity === "danger")) {
    return "表达式存在错误，请先修正字段。";
  }

  const normalized = normalizeState(state);
  const year = describeDateField(CRON_FIELD_META.year, normalized.fields.year);
  const month = describeDateField(
    CRON_FIELD_META.month,
    normalized.fields.month,
  );
  const day =
    normalized.dayStrategy === "dayOfMonth"
      ? describeDateField(
          CRON_FIELD_META.dayOfMonth,
          normalized.fields.dayOfMonth,
        )
      : describeDateField(
          CRON_FIELD_META.dayOfWeek,
          normalized.fields.dayOfWeek,
        );
  const time = describeTime(normalized);

  return `${year}${month}${day} ${time} 执行`;
}

function describeTime(state: CronToolState) {
  const hour = getSingleSpecificValue(CRON_FIELD_META.hour, state.fields.hour);
  const minute = getSingleSpecificValue(
    CRON_FIELD_META.minute,
    state.fields.minute,
  );
  const second = getSingleSpecificValue(
    CRON_FIELD_META.second,
    state.fields.second,
  );

  if (hour !== null && minute !== null && second !== null) {
    return `${pad(hour)}:${pad(minute)}:${pad(second)}`;
  }

  return [
    describeDateField(CRON_FIELD_META.hour, state.fields.hour),
    describeDateField(CRON_FIELD_META.minute, state.fields.minute),
    describeDateField(CRON_FIELD_META.second, state.fields.second),
  ].join("、");
}

function getSingleSpecificValue(meta: CronFieldMeta, field: CronFieldState) {
  if (field.mode !== "specific") return null;
  const values = normalizeValues(field.values, meta);

  return values.length === 1 ? values[0] : null;
}

function describeDateField(meta: CronFieldMeta, field: CronFieldState) {
  if (field.mode === "unspecified") return "";

  if (field.mode === "every") {
    if (meta.key === "second") return "每秒";
    if (meta.key === "minute") return "每分钟";
    if (meta.key === "hour") return "每小时";
    if (meta.key === "dayOfMonth") return "每日";
    if (meta.key === "month") return "每月";
    if (meta.key === "dayOfWeek") return "每天";
    return "每年";
  }

  if (field.mode === "interval") {
    return `从${formatValue(Number(field.start), meta)}开始每${field.step}${meta.unit}`;
  }

  if (field.mode === "range") {
    return `${formatValue(Number(field.start), meta)}至${formatValue(Number(field.end), meta)}`;
  }

  const values = normalizeValues(field.values, meta);

  return values.map((value) => formatValue(value, meta)).join("、");
}

function formatValue(value: number, meta: CronFieldMeta) {
  if (meta.key === "second") return `${value}秒`;
  if (meta.key === "minute") return `${value}分`;
  if (meta.key === "hour") return `${value}时`;
  if (meta.key === "dayOfMonth") return `第${value}日`;
  if (meta.key === "month") return `${value}月`;
  if (meta.key === "dayOfWeek") return WEEKDAY_LABELS[value] ?? `周${value}`;

  return `${value}年`;
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

export async function copyToClipboard(value: string) {
  await navigator.clipboard.writeText(value);
}
