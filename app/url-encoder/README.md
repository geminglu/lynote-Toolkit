这个工具用于在当前浏览器页面中完成常见 `URL` 的编码、解码与结构解析，适合接口联调、回调地址排查、OAuth / SSO 跳转检查和 Query 参数调试。

## 输入模式

1. `完整 URL`
2. `参数值`
3. `Query String`

### 处理方式

1. `编码`
2. `解码`
3. `解析`

### 结构化输出

1. `URL 结构拆解`
2. `Query 参数列表`
3. `Query JSON`
4. `重组后的 Query String`
5. `重组后的完整 URL`

## `encodeURI` 和 `encodeURIComponent` 的区别

### `完整 URL` 模式

当前模式更接近 `encodeURI` / `decodeURI`，适合处理整段链接。

- 优点：会尽量保留 URL 结构字符
- 适合：完整页面链接、回调地址、第三方跳转 URL

### `参数值` 模式

当前模式更接近 `encodeURIComponent` / `decodeURIComponent`，适合处理单个参数值。

- 优点：编码更彻底，适合嵌套在 query 中
- 适合：`redirect_uri`、单个 `token` 值、路径片段、状态参数

## 功能说明

### 完整 URL 编码与解码

你可以直接输入完整 URL，例如：

```text
https://example.com/callback?redirect_uri=https://foo.com/done&name=张三
```

工具支持：

- 整段 URL 编码
- 整段 URL 解码
- 输出标准化 URL
- 拆解 `protocol`、`host`、`pathname`、`search`、`hash`

### Query String 解析

你可以输入不带域名的参数串，例如：

```text
a=1&a=2&redirect_uri=https%3A%2F%2Fdemo.com%2Fdone&empty=
```

页面会保留：

- 重复 key
- 空值参数
- 原始顺序

并输出：

- 参数列表
- 解码后的可读结果
- JSON 结构
- 重组后的 Query String

### `+` 号转空格

当输入内容来自 `application/x-www-form-urlencoded` 表单提交时，`+` 往往表示空格。

首版提供“`+` 号转空格”开关，适合处理如下内容：

```text
name=zhang+san&city=bei+jing
```

## 使用说明

1. 在左侧选择输入模式
2. 选择处理方式：编码、解码或解析
3. 粘贴完整 URL、参数值或 Query String
4. 如目标内容来自表单提交，可按需开启“`+` 号转空格”
5. 点击执行
6. 在右侧查看主结果、URL 结构、Query 参数和重组结果
7. 你可以按需复制任一输出

## 适用场景

### 回调地址排查

当你在联调 OAuth、SSO、支付回调或开放平台跳转时，常常会遇到：

- `redirect_uri` 是否被多编码了一层
- Query 参数是否完整
- 某个参数值里是否嵌套了完整链接

这个工具适合快速拆开检查。

### Query 参数检查

当你需要确认一个 URL 里到底有哪些参数、参数顺序是否正确、是否存在重复 key 或空值参数时，Query 解析模式会很有帮助。

### 参数值编码

当你需要把完整链接塞进某个 query value，例如：

```text
redirect_uri=https%3A%2F%2Ffoo.com%2Fdone
```

参数值模式比整段 URL 模式更适合这种场景。

## 安全说明

本工具仅在当前浏览器页面内存中处理 URL、参数值和解析结果。

1. 不会将输入内容上传到服务器
2. 不会自动写入本地存储
3. 不会保存历史记录
4. 刷新或关闭页面后，当前内容会被清空
5. 如果你主动执行复制操作，后续数据将由浏览器和操作系统接管

## 限制说明

- `完整 URL` 解析当前仅支持带协议的绝对地址
- `参数值` 模式仅支持编码和解码，不支持结构解析
- 首版不处理批量 URL
- 首版不主动联网检查域名或发起请求
- 如果输入包含不完整的 `%XX` 片段，解码会失败并提示检查编码内容

## 常见问题

### 为什么完整 URL 和参数值两种模式的结果不一样

因为它们对应的是不同编码规则：

- `完整 URL` 更接近 `encodeURI`
- `参数值` 更接近 `encodeURIComponent`

前者更适合整段链接，后者更适合单个参数值。

### 为什么 `+` 会变成空格

这通常发生在表单提交内容或某些旧接口参数里。如果你的目标内容本来就需要保留 `+`，可以关闭“`+` 号转空格”后再试一次。

### 为什么重复参数没有被合并

因为真实 URL 调试里，重复 key 很常见，例如：

```text
a=1&a=2
```

首版工具会按原始顺序完整保留这些参数，避免排查时丢失信息。

## 代码示例

### Node.js 中编码单个参数值

```ts
const redirectUri = "https://foo.com/done?a=1&b=2";

console.log(encodeURIComponent(redirectUri));
```

### Node.js 中解析完整 URL

```ts
const url = new URL(
  "https://example.com/callback?name=%E5%BC%A0%E4%B8%89&token=abc",
);

console.log(url.pathname);
console.log(url.searchParams.get("name"));
```

## 相关工具

- 如果你需要整理 Query 参数里的 JSON 字符串，可以继续使用[JSON 在线格式化工具](/json-formatting)。
- 如果你的 URL 参数里包含 `JWT` 或 `token`，可以继续使用[JWT 在线解析与验签工具](/jwt-debugger)。
- 如果你需要做签名或验签联调，也可以继续使用[哈希与 HMAC 在线生成工具](/hash-generator)。
