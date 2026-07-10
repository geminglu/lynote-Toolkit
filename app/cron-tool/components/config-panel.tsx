"use client";

import { cn } from "@/lib/utils";
import { CalendarClock, RotateCcw, WandSparkles } from "lucide-react";
import { Button } from "lynote-ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "lynote-ui/card";
import { Input } from "lynote-ui/input";
import { Label } from "lynote-ui/label";
import { NativeSelect, NativeSelectOption } from "lynote-ui/native-select";
import type { FC } from "react";

import { useCronToolContext } from "../hooks/useCronToolContext";
import type { CronFieldKey, CronFieldMode } from "../type";
import {
  CRON_FIELD_META,
  CRON_FIELD_MODE_OPTIONS,
  CRON_FIELD_ORDER,
  CRON_PRESET_OPTIONS,
} from "../utils";

type FieldControlProps = {
  fieldKey: CronFieldKey;
};

const COMPACT_FIELDS = new Set<CronFieldKey>(["month", "dayOfWeek"]);

function getStepOptions(fieldKey: CronFieldKey) {
  const meta = CRON_FIELD_META[fieldKey];
  const max = meta.max - meta.min + 1;

  return Array.from({ length: max }, (_, index) => String(index + 1));
}

const FieldControl: FC<FieldControlProps> = ({ fieldKey }) => {
  const {
    state,
    generatedExpression,
    updateFieldMode,
    updateFieldValue,
    toggleSpecificValue,
  } = useCronToolContext();
  const meta = CRON_FIELD_META[fieldKey];
  const field = state.fields[fieldKey];
  const fieldExpression =
    generatedExpression.split(" ")[CRON_FIELD_ORDER.indexOf(fieldKey)];
  const selectedValues = new Set(field.values.split(",").filter(Boolean));
  const usesTextInput = fieldKey === "year";

  return (
    <section className="space-y-3 rounded-lg border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-medium">{meta.label}</h3>
        </div>
        <code className="rounded bg-muted px-2 py-1 text-xs">
          {fieldExpression}
        </code>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`cron-${fieldKey}-mode`}>类型</Label>
        <NativeSelect
          id={`cron-${fieldKey}-mode`}
          onChange={(event) => {
            updateFieldMode(fieldKey, event.target.value as CronFieldMode);
          }}
          value={field.mode === "unspecified" ? "every" : field.mode}
        >
          {CRON_FIELD_MODE_OPTIONS.map((option) => (
            <NativeSelectOption key={option.value} value={option.value}>
              {option.label}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>

      {field.mode === "every" && (
        <div className="rounded-md bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
          {meta.label}字段使用 *
        </div>
      )}

      {field.mode === "interval" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`cron-${fieldKey}-start`}>起始值</Label>
            {usesTextInput ? (
              <Input
                id={`cron-${fieldKey}-start`}
                inputMode="numeric"
                onChange={(event) => {
                  updateFieldValue(fieldKey, { start: event.target.value });
                }}
                value={field.start}
              />
            ) : (
              <NativeSelect
                id={`cron-${fieldKey}-start`}
                onChange={(event) => {
                  updateFieldValue(fieldKey, { start: event.target.value });
                }}
                value={field.start}
              >
                {meta.options.map((option) => (
                  <NativeSelectOption key={option.value} value={option.value}>
                    {option.label}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor={`cron-${fieldKey}-step`}>间隔</Label>
            {usesTextInput ? (
              <Input
                id={`cron-${fieldKey}-step`}
                inputMode="numeric"
                onChange={(event) => {
                  updateFieldValue(fieldKey, { step: event.target.value });
                }}
                value={field.step}
              />
            ) : (
              <NativeSelect
                id={`cron-${fieldKey}-step`}
                onChange={(event) => {
                  updateFieldValue(fieldKey, { step: event.target.value });
                }}
                value={field.step}
              >
                {getStepOptions(fieldKey).map((value) => (
                  <NativeSelectOption key={value} value={value}>
                    每 {value} {meta.unit}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            )}
          </div>
        </div>
      )}

      {field.mode === "range" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`cron-${fieldKey}-range-start`}>从</Label>
            {usesTextInput ? (
              <Input
                id={`cron-${fieldKey}-range-start`}
                inputMode="numeric"
                onChange={(event) => {
                  updateFieldValue(fieldKey, { start: event.target.value });
                }}
                value={field.start}
              />
            ) : (
              <NativeSelect
                id={`cron-${fieldKey}-range-start`}
                onChange={(event) => {
                  updateFieldValue(fieldKey, { start: event.target.value });
                }}
                value={field.start}
              >
                {meta.options.map((option) => (
                  <NativeSelectOption key={option.value} value={option.value}>
                    {option.label}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor={`cron-${fieldKey}-range-end`}>到</Label>
            {usesTextInput ? (
              <Input
                id={`cron-${fieldKey}-range-end`}
                inputMode="numeric"
                onChange={(event) => {
                  updateFieldValue(fieldKey, { end: event.target.value });
                }}
                value={field.end}
              />
            ) : (
              <NativeSelect
                id={`cron-${fieldKey}-range-end`}
                onChange={(event) => {
                  updateFieldValue(fieldKey, { end: event.target.value });
                }}
                value={field.end}
              >
                {meta.options.map((option) => (
                  <NativeSelectOption key={option.value} value={option.value}>
                    {option.label}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            )}
          </div>
        </div>
      )}

      {field.mode === "specific" && usesTextInput && (
        <div className="space-y-2">
          <Label htmlFor={`cron-${fieldKey}-values`}>指定年份</Label>
          <Input
            id={`cron-${fieldKey}-values`}
            inputMode="numeric"
            onChange={(event) => {
              updateFieldValue(fieldKey, { values: event.target.value });
            }}
            placeholder="例如 2026,2028"
            value={field.values}
          />
        </div>
      )}

      {field.mode === "specific" && !usesTextInput && (
        <div
          className={cn(
            "grid max-h-52 gap-1 overflow-auto pr-1",
            COMPACT_FIELDS.has(fieldKey)
              ? "grid-cols-3 sm:grid-cols-4"
              : "grid-cols-5 sm:grid-cols-8 lg:grid-cols-10",
          )}
        >
          {meta.options.map((option) => {
            const selected = selectedValues.has(option.value);

            return (
              <Button
                className="h-8 px-2 text-xs"
                key={option.value}
                onClick={() => {
                  toggleSpecificValue(fieldKey, option.value);
                }}
                type="button"
                variant={selected ? "default" : "outline"}
              >
                {option.label}
              </Button>
            );
          })}
        </div>
      )}
    </section>
  );
};

const ConfigPanel: FC = () => {
  const { state, updateDayStrategy, applyPreset, resetToDefaults } =
    useCronToolContext();

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Cron 生成器</CardTitle>
        <CardDescription>通过字段选择生成 7 字段 cron 表达式。</CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <WandSparkles className="h-4 w-4" />
            快捷示例
          </div>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
            {CRON_PRESET_OPTIONS.map((preset) => (
              <Button
                className="justify-start"
                key={preset.id}
                onClick={() => {
                  applyPreset(preset.expression);
                }}
                type="button"
                variant="outline"
              >
                {preset.label}
              </Button>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <div className="text-sm font-medium">时间</div>
          <div className="grid gap-3 lg:grid-cols-3">
            <FieldControl fieldKey="second" />
            <FieldControl fieldKey="minute" />
            <FieldControl fieldKey="hour" />
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm font-medium">日期</div>
            <div className="flex rounded-lg border p-1">
              <Button
                onClick={() => {
                  updateDayStrategy("dayOfMonth");
                }}
                size="sm"
                type="button"
                variant={
                  state.dayStrategy === "dayOfMonth" ? "default" : "ghost"
                }
              >
                按日期
              </Button>
              <Button
                onClick={() => {
                  updateDayStrategy("dayOfWeek");
                }}
                size="sm"
                type="button"
                variant={
                  state.dayStrategy === "dayOfWeek" ? "default" : "ghost"
                }
              >
                按星期
              </Button>
            </div>
          </div>
          <div className="grid gap-3 lg:grid-cols-3">
            {state.dayStrategy === "dayOfMonth" ? (
              <FieldControl fieldKey="dayOfMonth" />
            ) : (
              <FieldControl fieldKey="dayOfWeek" />
            )}
            <FieldControl fieldKey="month" />
            <FieldControl fieldKey="year" />
          </div>
        </section>
      </CardContent>

      <CardFooter>
        <Button onClick={resetToDefaults} type="button" variant="outline">
          <RotateCcw className="h-4 w-4" />
          恢复默认
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ConfigPanel;
