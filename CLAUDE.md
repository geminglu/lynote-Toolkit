# CLAUDE.md

@AGENTS.md

Always respond in Chinese-simplified

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Next.js 16 static-site web app deployed to GitHub Pages. The site exports static tool pages (base64-tool, color-converter, json-formatting, jwt-debugger, etc.) — no SSR/ISR/API routes (`output: "export"` in `next.config.ts`).

## Key Commands

| Command                       | Description                                          |
| ----------------------------- | ---------------------------------------------------- |
| `pnpm install`                | Install all deps (from root)                         |
| `pnpm dev`                    | Dev server (Next.js with Turbopack)                  |
| `pnpm build`                  | Production build                                     |
| `pnpm lint` / `pnpm lint:fix` | ESLint (from root)                                   |
| `pnpm type-check`             | TypeScript build check `tsc -b --noEmit` (from root) |
| `pnpm prettier`               | Format all code (from root)                          |

## TypeScript Conventions

- Strict mode enabled; no unused locals/params
- Prefer `interface` over `type` for objects; use `type` for unions and utility types
- Avoid `any` — prefer `unknown` or specific types
- Use `const enum` over `enum` for state enums; prefer string literal types
- Use `satisfies` operator for type validation
- Component props: use `FC<PropsType>` with `PropsType` as the type name
- Import order: React → third-party → `@lynote/*` internal → relative

## React 19 / Next.js 16 Conventions

- Favor React Server Components; minimize `'use client'` directives
- Use `useActionState` instead of deprecated `useFormState`
- Async runtime APIs: `await cookies()`, `await headers()`, `await draftMode()`
- Component pattern: `FC<PropsType>`, `cn()` for className merging, `forwardRef` for ref forwarding
- Cross-component state sharing: use `useContext` with a custom `useXxxContext` hook (never export raw context directly)
- Path alias: `@/*` maps to project root

## Comment Style

- Use **Chinese** comments for: component props, TS types, hooks, boundary conditions, security restrictions, compatibility branches
- Comments should explain "why" — not restate what the code does
- No comments for simple assignments, direct JSX rendering, or self-evident branches

## Commit Style

- Conventional Commits: `type(scope): summary`
- `type` only: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `style`, `perf`
- `summary` in Chinese or English, matching recent commit language in the module
- Focus on the result/purpose, not the mechanical change

## Non-Obvious Gotchas

- **CI uses Node 24** while `engines` says `>= 20` — version mismatch can mask issues
- **Type-check is commented out** in the pre-commit hook — commits bypass type checking
- **Hoisted node_modules**: `.npmrc` sets `node-linker=hoisted`, which differs from default pnpm isolation and may affect tool behavior

## Formatting

- Prettier with `prettier-plugin-organize-imports` and `prettier-plugin-tailwindcss`
- 2-space indentation, LF line endings (from EditorConfig)
