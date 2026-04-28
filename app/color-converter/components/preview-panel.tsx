"use client";

import { Badge } from "lynote-ui/badge";
import { Button } from "lynote-ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "lynote-ui/card";
import type { CSSProperties, FC } from "react";

import { useColorConverterContext } from "../hooks/useColorConverterContext";
import { formatColorByMode } from "../utils";

const CHECKERBOARD_BACKGROUND = {
  backgroundImage: `
    linear-gradient(45deg, hsl(var(--muted)) 25%, transparent 25%),
    linear-gradient(-45deg, hsl(var(--muted)) 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, hsl(var(--muted)) 75%),
    linear-gradient(-45deg, transparent 75%, hsl(var(--muted)) 75%)
  `,
  backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
  backgroundSize: "20px 20px",
} satisfies CSSProperties;

const PreviewPanel: FC = () => {
  const { color, copyModeValue, previewValue, resetToDefault } =
    useColorConverterContext();

  return (
    <Card className="h-fit lg:sticky lg:top-6 lg:col-span-1 lg:row-span-2">
      <CardHeader>
        <CardTitle>当前颜色</CardTitle>
        <CardDescription>
          左侧保留统一预览与快捷操作，右侧所有格式会围绕这一份颜色状态联动。
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="overflow-hidden rounded-2xl border">
          <div className="h-48 w-full" style={CHECKERBOARD_BACKGROUND}>
            <div
              className="h-full w-full"
              style={{
                backgroundColor: formatColorByMode("rgba", color),
              }}
            />
          </div>
        </div>

        <div className="space-y-2 rounded-xl border p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="font-medium">主展示值</div>
            <Badge variant="outline">OKLCH</Badge>
          </div>
          <div className="font-mono text-sm break-all">{previewValue}</div>
          <p className="text-xs text-muted-foreground">
            预览区只展示当前颜色与透明棋盘格，不额外渲染不透明背景对比。
          </p>
        </div>

        <div className="grid gap-3 rounded-xl border p-4 text-sm sm:grid-cols-2">
          <div>
            <div className="text-muted-foreground">HEXA</div>
            <div className="font-mono">{formatColorByMode("hex", color)}</div>
          </div>
          <div>
            <div className="text-muted-foreground">RGBA</div>
            <div className="font-mono">{formatColorByMode("rgba", color)}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Alpha</div>
            <div className="font-mono">{color.alpha.toFixed(3)}</div>
          </div>
          <div>
            <div className="text-muted-foreground">推荐复制</div>
            <div className="font-mono">{formatColorByMode("oklch", color)}</div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex flex-wrap gap-2">
        <Button
          onClick={() => {
            void copyModeValue("hex");
          }}
          variant="outline"
        >
          复制 HEXA
        </Button>
        <Button
          onClick={() => {
            void copyModeValue("oklch");
          }}
          variant="outline"
        >
          复制 OKLCH
        </Button>
        <Button onClick={resetToDefault} variant="ghost">
          恢复默认颜色
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PreviewPanel;
