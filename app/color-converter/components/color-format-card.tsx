"use client";

import { PaletteIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "lynote-ui/alert";
import { Button } from "lynote-ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "lynote-ui/card";
import { Input } from "lynote-ui/input";
import { Label } from "lynote-ui/label";
import { Slider } from "lynote-ui/slider";
import { type FC, type KeyboardEvent, useState } from "react";

import type { ColorFormatCardData, ColorFormatMode } from "../type";

export type ColorFormatCardProps = {
  data: ColorFormatCardData;
  draftValue: string;
  error?: string;
  pickerHexValue: string;
  alphaValue: number;
  onDraftChange: (mode: ColorFormatMode, input: string) => void;
  onCommitInput: (mode: ColorFormatMode, input: string) => boolean;
  onUpdateChannel: (mode: ColorFormatMode, key: string, value: number) => void;
  onCopy: (mode: ColorFormatMode) => Promise<void>;
  onPickerHexChange: (value: string) => void;
  onPickerAlphaChange: (value: number) => void;
};

const ColorFormatCard: FC<ColorFormatCardProps> = ({
  data,
  draftValue,
  error,
  pickerHexValue,
  alphaValue,
  onDraftChange,
  onCommitInput,
  onUpdateChannel,
  onCopy,
  onPickerHexChange,
  onPickerAlphaChange,
}) => {
  const [pickerOpen, setPickerOpen] = useState(false);
  const applyDraft = () => {
    onCommitInput(data.mode, draftValue);
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();
    applyDraft();
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{data.title}</CardTitle>
        <CardDescription>{data.description}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor={`${data.mode}-formatted-value`}>格式输入</Label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              id={`${data.mode}-formatted-value`}
              onChange={(event) => {
                onDraftChange(data.mode, event.target.value);
              }}
              onKeyDown={handleInputKeyDown}
              placeholder={data.placeholder}
              value={draftValue}
            />
            <Button onClick={applyDraft} type="button" variant="outline">
              应用
            </Button>
            <Button
              onClick={() => {
                void onCopy(data.mode);
              }}
              type="button"
              variant="outline"
            >
              复制
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTitle>输入无效</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-3 border-y py-4">
          <Button
            aria-controls={`${data.mode}-color-picker`}
            aria-expanded={pickerOpen}
            onClick={() => {
              setPickerOpen((open) => !open);
            }}
            type="button"
            variant="outline"
          >
            <PaletteIcon />
            {pickerOpen ? "收起颜色选择器" : "打开颜色选择器"}
          </Button>

          {pickerOpen && (
            <div
              className="grid gap-4 rounded-lg border bg-muted/20 p-3 sm:grid-cols-2"
              id={`${data.mode}-color-picker`}
            >
              <div className="space-y-2">
                <Label htmlFor={`${data.mode}-picker-color`}>基础色</Label>
                <div className="flex items-center gap-3">
                  <Input
                    aria-label={`${data.title} 基础色`}
                    className="h-10 w-16 cursor-pointer p-1"
                    id={`${data.mode}-picker-color`}
                    onChange={(event) => {
                      onPickerHexChange(event.target.value);
                    }}
                    type="color"
                    value={pickerHexValue}
                  />
                  <span className="font-mono text-sm text-muted-foreground">
                    {pickerHexValue.toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor={`${data.mode}-picker-alpha`}>透明度</Label>
                  <span className="text-xs text-muted-foreground">
                    {Math.round(alphaValue * 100)}%
                  </span>
                </div>
                <Input
                  id={`${data.mode}-picker-alpha`}
                  max={1}
                  min={0}
                  onChange={(event) => {
                    const nextValue = Number(event.target.value);

                    if (Number.isFinite(nextValue)) {
                      onPickerAlphaChange(nextValue);
                    }
                  }}
                  step={0.001}
                  type="number"
                  value={alphaValue}
                />
                <Slider
                  aria-label={`${data.title} 透明度`}
                  max={1}
                  min={0}
                  onValueChange={(value) => {
                    const nextValue = Array.isArray(value) ? value[0] : value;

                    onPickerAlphaChange(nextValue ?? alphaValue);
                  }}
                  step={0.001}
                  value={[alphaValue]}
                />
              </div>
            </div>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {data.channels.map((channel) => (
            <div className="space-y-2" key={`${data.mode}-${channel.key}`}>
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor={`${data.mode}-${channel.key}`}>
                  {channel.label}
                </Label>
                <span className="text-xs text-muted-foreground">
                  {channel.value}
                  {channel.unit ?? ""}
                </span>
              </div>

              <Input
                id={`${data.mode}-${channel.key}`}
                max={channel.max}
                min={channel.min}
                onChange={(event) => {
                  const nextValue = Number(event.target.value);

                  if (!Number.isFinite(nextValue)) {
                    return;
                  }

                  onUpdateChannel(data.mode, channel.key, nextValue);
                }}
                step={channel.step}
                type="number"
                value={channel.value}
              />

              <Slider
                max={channel.max}
                min={channel.min}
                onValueChange={(value) => {
                  const nextValue = Array.isArray(value) ? value[0] : value;

                  onUpdateChannel(
                    data.mode,
                    channel.key,
                    nextValue ?? channel.value,
                  );
                }}
                step={channel.step}
                value={[channel.value]}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ColorFormatCard;
