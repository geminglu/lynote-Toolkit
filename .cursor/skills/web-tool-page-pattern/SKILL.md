---
name: web-tool-page-pattern
description: Create or refactor developer tool pages in apps/web using this repository's standard structure. Use when adding a new online tool, creating a route under apps/web/app, wiring WorkspaceLayout, Provider/context/hooks, page metadata, JSON-LD, or README-driven page content to match the existing json-formatting, url-encoder, color-converter, jwt-debugger, key-generator, hash-generator, and rsa-tool pages.
---

# Web Tool Page Pattern

## When To Use

Use this skill when the task involves:

- adding a new tool under `apps/web/app/<tool>`
- refactoring a tool page to match existing patterns
- wiring a tool page with `WorkspaceLayout`
- splitting a tool into `page.tsx`, `workspace-client.tsx`, `context.tsx`, `hooks`, `type.ts`, and `utils.ts`

## Quick Start

Follow this order:

1. Add the tool entry to `apps/web/lib/seo.ts`.
2. Create a thin server `page.tsx`.
3. Create `workspace-client.tsx` as the client entry.
4. Add `context.tsx`, `hooks/useXxx.ts`, and `hooks/useXxxContext.ts`.
5. Put shared types in `type.ts` and pure helpers in `utils.ts`.
6. Split UI into `components/`.
7. Add `README.md` and render it through `MarkdownRenderer`.

## Required Structure

Preferred directory layout:

```text
apps/web/app/<tool>/
  page.tsx
  workspace-client.tsx
  README.md
  context.tsx
  type.ts
  utils.ts
  hooks/
    useXxx.ts
    useXxxContext.ts
  components/
    ...
```

## Page Contract

`page.tsx` should stay thin and server-side:

- resolve config with `getToolRouteConfig("/tool-route")`
- export `metadata = createToolMetadata(routeConfig)`
- read markdown via `readContentMarkdownFile(routeConfig.readmePath)`
- render `<JsonLd data={createSoftwareApplicationJsonLd(routeConfig)} />`
- render `<ToolWorkspaceClient markdownContent={markdownContent} />`

Do not place interactive business logic in `page.tsx`.

## Workspace Contract

`workspace-client.tsx` should usually:

- accept `markdownContent: string`
- wrap content in the tool Provider
- render `WorkspaceLayout`
- provide `header.title` and `header.description`
- render the interactive area in the main slot
- render `<MarkdownRenderer content={markdownContent} />` in `footer`

Default layout preference:

- mobile: single column
- desktop: two-column grid unless the tool needs a specialized layout

## State Contract

Split responsibilities like this:

- `hooks/useXxx.ts`: state, derived values, actions, async execution
- `context.tsx`: Provider creation
- `hooks/useXxxContext.ts`: guarded context access
- `type.ts`: config, result, option, and view-model types
- `utils.ts`: defaults, parsing, transformation, execution, clipboard helpers
- `components/`: UI only

## Project Conventions

- Reuse `WorkspaceLayout`, `MarkdownRenderer`, and shared SEO helpers.
- Keep homepage and sitemap integration driven by `TOOL_ROUTE_CONFIGS`.
- Prefer Chinese UI copy and documentation to match existing tools.
- Keep browser-local processing and privacy messaging explicit when relevant.

## Anti-Patterns

Avoid these:

- placing tool logic directly in `page.tsx`
- hardcoding metadata outside `apps/web/lib/seo.ts`
- skipping `README.md` for a tool page
- mixing context access everywhere without `useXxxContext.ts`
- letting components own parsing or crypto logic that belongs in `utils.ts` or `useXxx.ts`

## Additional Reference

For templates and checklists, read [reference.md](reference.md).
