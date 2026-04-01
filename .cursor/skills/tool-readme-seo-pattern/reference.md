# Tool README SEO Reference

## SEO Config Checklist

When adding a tool to `apps/web/lib/seo.ts`, provide:

- `route`: page route, matching the folder name
- `readmePath`: usually `/app/<tool>/README.md`
- `title`: full page title for metadata and JSON-LD
- `shortTitle`: concise label for homepage cards
- `description`: one-sentence summary with real use cases
- `keywords`: high-intent search phrases that match actual behavior

## Writing Formula

Use this order when drafting copy:

1. What the tool does
2. What inputs or modes it supports
3. What outputs or checks it provides
4. Which developer scenarios it helps with
5. Why browser-local processing matters

## README Template

```md
这个工具用于……，适合……

## 功能说明

### 支持的输入 / 模式 / 格式

### 核心能力

## 使用说明

1. ...
2. ...
3. ...

## 安全说明

1. ...
2. ...
3. ...

## 限制说明

- ...
- ...

## 常见问题

### 问题 1

回答

## 相关工具

- [相关工具 A](/tool-a)
- [相关工具 B](/tool-b)
```

## Description Rules

Good descriptions tend to include:

- concrete input or algorithm names
- concrete tasks such as 调试、联调、排查、验签、转换、生成
- one or two realistic scenarios

Prefer:

- “支持 JWT Header / Payload 解析与本地验签，适合登录态排查和接口联调”

Avoid:

- “一个很好用的在线 JWT 工具”

## Keyword Rules

Prefer keywords that reflect:

- tool name
- major algorithms or formats
- primary user intent
- common alternative wording

Good keyword examples:

- `JWT 解析`
- `JWT 验签`
- `SHA256 在线生成`
- `Query 参数解析`
- `RSA 在线解密`

Avoid:

- too many near-duplicates
- keywords for unsupported features
- generic words with weak intent

## FAQ Guidance

Useful FAQ topics usually come from:

- mode differences
- format differences
- algorithm differences
- why a result looks unexpected
- why verification fails
- what the tool does not support

Each FAQ should answer a real debugging question, not restate the feature list.

## Related Tool Guidance

Use the `## 相关工具` section to connect the toolbox:

- link to tools that naturally continue the workflow
- keep links site-relative
- explain why the next tool is relevant

Examples:

- JSON output cleanup -> `/json-formatting`
- secret generation -> `/key-generator`
- signature or digest verification -> `/hash-generator`

## Final Review Checklist

- [ ] Title, short title, description, and keywords are all present.
- [ ] README intro and SEO description describe the same tool.
- [ ] README contains safety and limitation sections when the tool handles sensitive data.
- [ ] FAQ answers real user confusion points.
- [ ] Related tools are linked with a clear continuation path.
- [ ] Wording matches the current tone of the existing 7 tool pages.
