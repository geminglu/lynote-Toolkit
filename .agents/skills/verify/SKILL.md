---
name: verify
description: Run the full verification pipeline — lint, type-check, and build. Use after making changes to ensure code quality.
---

# /verify

Run the following commands in sequence, stopping at the first failure:

1. **Lint**: `pnpm lint` (from project root)
2. **Type check**: `pnpm type-check` (from project root)
3. **Build**: `pnpm build`

Report which step failed (if any) and the error output. If all pass, confirm success.

Note: The pre-commit hook only runs prettier and eslint — type-checking is disabled in git hooks, so this skill is the recommended way to verify type safety before committing.
