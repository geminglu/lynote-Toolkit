# Web Tool Page Reference

## Implementation Order

1. Create the route folder in `apps/web/app/<tool>`.
2. Add a `TOOL_ROUTE_CONFIGS` entry in `apps/web/lib/seo.ts`.
3. Create `README.md`.
4. Create `page.tsx`.
5. Create `workspace-client.tsx`.
6. Create `context.tsx`.
7. Create `hooks/useXxx.ts`.
8. Create `hooks/useXxxContext.ts`.
9. Create `type.ts` and `utils.ts`.
10. Split the UI into `components/`.

## Route Config Checklist

Each tool entry in `apps/web/lib/seo.ts` should include:

- `route`
- `readmePath`
- `title`
- `shortTitle`
- `description`
- `keywords`

Keep these aligned:

- `route` matches the folder name
- `readmePath` points to `/app/<tool>/README.md`
- page header title and description match the SEO intent
- README intro paragraph matches the page topic

## `page.tsx` Template

```tsx
import JsonLd from "@/components/JsonLd";
import { readContentMarkdownFile } from "@/lib/markdown";
import {
  createSoftwareApplicationJsonLd,
  createToolMetadata,
  getToolRouteConfig,
} from "@/lib/seo";
import ToolWorkspaceClient from "./workspace-client";

const routeConfig = getToolRouteConfig("/tool-route");

export const metadata = createToolMetadata(routeConfig);

export default async function ToolPage() {
  const markdownContent = await readContentMarkdownFile(routeConfig.readmePath);

  return (
    <>
      <JsonLd data={createSoftwareApplicationJsonLd(routeConfig)} />
      <ToolWorkspaceClient markdownContent={markdownContent} />
    </>
  );
}
```

## `workspace-client.tsx` Template

```tsx
"use client";

import MarkdownRenderer from "@/components/MarkdownRenderer";
import WorkspaceLayout from "@/components/WorkspaceLayout";
import { cn } from "@/lib/utils";
import ConfigPanel from "./components/config-panel";
import ResultPanel from "./components/result-panel";
import { ToolProvider } from "./context";

type ToolWorkspaceClientProps = {
  markdownContent: string;
};

function ToolWorkspaceContent({ markdownContent }: ToolWorkspaceClientProps) {
  return (
    <WorkspaceLayout
      footer={<MarkdownRenderer content={markdownContent} />}
      header={{
        title: "工具标题",
        description: "工具描述",
      }}
    >
      <div
        className={cn(
          "grid min-h-0 flex-1 gap-4",
          "grid-cols-1 lg:grid-cols-2",
        )}
      >
        <ConfigPanel />
        <ResultPanel />
      </div>
    </WorkspaceLayout>
  );
}

export default function ToolWorkspaceClient({
  markdownContent,
}: ToolWorkspaceClientProps) {
  return (
    <ToolProvider>
      <ToolWorkspaceContent markdownContent={markdownContent} />
    </ToolProvider>
  );
}
```

## State Template

`context.tsx`

```tsx
"use client";

import { createContext, type FC, type PropsWithChildren } from "react";
import useTool from "./hooks/useTool";
import type { ToolContextValue } from "./hooks/useTool";

export const ToolContext = createContext<ToolContextValue | null>(null);

export const ToolProvider: FC<PropsWithChildren> = ({ children }) => {
  const value = useTool();

  return <ToolContext.Provider value={value}>{children}</ToolContext.Provider>;
};
```

`hooks/useToolContext.ts`

```tsx
"use client";

import { useContext } from "react";
import { ToolContext } from "../context";

export function useToolContext() {
  const context = useContext(ToolContext);

  if (!context) {
    throw new Error("useToolContext must be used within ToolProvider");
  }

  return context;
}
```

## Design Notes

- Prefer one Provider per tool page.
- Keep complex parsing, crypto, conversion, or normalization out of components.
- Use `useMemo` for aggregated context values when the tool follows that pattern already.
- Use `useCallback` for event handlers passed into many children.
- Let `README.md` carry long-form explanation instead of overloading UI copy.

## Final Review Checklist

- [ ] The tool is registered in `apps/web/lib/seo.ts`.
- [ ] `page.tsx` is thin and server-side.
- [ ] `workspace-client.tsx` uses `WorkspaceLayout`.
- [ ] The Provider wraps the workspace content.
- [ ] `README.md` is rendered through `MarkdownRenderer`.
- [ ] State, types, helpers, and UI are separated cleanly.
- [ ] The page can appear correctly in homepage-driven and sitemap-driven flows because config is centralized.
