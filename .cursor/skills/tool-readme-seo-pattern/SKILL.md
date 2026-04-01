---
name: tool-readme-seo-pattern
description: Write or update README and SEO metadata for developer tool pages in apps/web. Use when adding a new tool, revising tool descriptions, defining keywords, syncing README content with page headers and route config, or creating FAQ, safety notes, limitations, and related-tool links for pages like json-formatting, url-encoder, color-converter, jwt-debugger, key-generator, hash-generator, and rsa-tool.
---

# Tool README SEO Pattern

## When To Use

Use this skill when the task involves:

- creating `README.md` for a tool page
- writing or refining tool SEO copy
- adding a tool entry to `apps/web/lib/seo.ts`
- aligning README, page header, and metadata

## Quick Start

For each tool:

1. Define `title`, `shortTitle`, `description`, and `keywords` in `apps/web/lib/seo.ts`.
2. Write a README intro that explains what the tool does and where it helps.
3. Add sections for features, usage, safety, limits, FAQ, and related tools.
4. Keep the page header and README intro aligned in wording and scope.
5. Prefer concrete developer scenarios over generic marketing text.

## SEO Source Of Truth

`apps/web/lib/seo.ts` is the source of truth for:

- route metadata
- JSON-LD input
- homepage card content
- sitemap inclusion

Do not invent parallel metadata elsewhere.

## README Contract

Every tool README should usually include:

- intro paragraph
- `## 功能说明`
- `## 使用说明`
- `## 安全说明`
- `## 限制说明`
- `## 常见问题`
- `## 相关工具`

Optional sections are allowed when useful:

- mode or algorithm comparison
- format differences
- code examples
- scenario breakdown

## Copywriting Rules

- Prefer Simplified Chinese to match the current site.
- Write for both users and search engines.
- Keep terminology stable across SEO config, page header, and README.
- Make browser-local processing explicit for sensitive tools.
- Link related tools with site-relative paths such as `/json-formatting`.

## Alignment Rules

These items should not drift apart:

- `seo.ts` title and workspace header title
- `seo.ts` description and README intro
- tool capabilities in UI and README sections
- privacy guarantees in UI and README

## Anti-Patterns

Avoid these:

- vague descriptions like “在线工具” without scenarios
- keyword stuffing that does not match real functionality
- README sections that repeat headings but add no concrete value
- claiming uploads, persistence, or remote verification when the tool is browser-local
- missing related-tool links in a multi-tool toolbox

## Additional Reference

For templates and writing checklists, read [reference.md](reference.md).
