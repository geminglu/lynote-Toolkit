这个工具用于在当前浏览器页面中解析和校验常见 `JWT` Token，适合登录态排查、接口联调、开放平台接入和签名验证调试。

## 核心能力

1. `JWT` 三段式结构解析
2. `Header / Payload / Signature` 拆分展示
3. `exp / nbf / iat` 时间类 claim 校验
4. 基于 `Secret`、`PEM Public Key` 或 `JWK` 的签名验证

### 支持的签名算法

1. `HS256`
2. `HS384`
3. `HS512`
4. `RS256`
5. `RS384`
6. `RS512`

### 支持的验签材料

1. `Secret`
2. `PEM Public Key`
3. `RSA JWK`

## JWT 的三个部分

一个典型的 `JWT` 通常由以下三段组成：

1. `Header`
2. `Payload`
3. `Signature`

它们之间用 `.` 分隔，常见形式如下：

```text
header.payload.signature
```

### `Header`

用于声明 token 的元信息，常见字段包括：

- `alg`：签名算法，例如 `HS256`、`RS256`
- `typ`：通常是 `JWT`
- `kid`：密钥标识，常见于多公钥场景

### `Payload`

用于承载业务字段和标准 claim，常见字段包括：

- `iss`：签发方
- `sub`：主题
- `aud`：受众
- `exp`：过期时间
- `nbf`：生效时间
- `iat`：签发时间
- `jti`：唯一标识

### `Signature`

用于验证当前 token 是否被篡改，以及它是否来自持有正确密钥的一方。

## HS 和 RS 的区别

### `HS256 / HS384 / HS512`

- 使用共享 `Secret`
- 签发方和验签方使用同一份密钥
- 更适合单体应用、内部系统或受控服务体系

### `RS256 / RS384 / RS512`

- 使用 `RSA` 非对称密钥
- 私钥签名，公钥验签
- 更适合多方协作、第三方接入和开放平台

## 功能说明

### 结构解析

输入 token 后，工具会自动：

- 清洗首尾空格和换行
- 拆分 `Header / Payload / Signature`
- 对前两段执行 `Base64URL` 解码
- 将 `Header` 和 `Payload` 格式化为 JSON 展示

### 时间类 claim 校验

工具会对以下字段做状态判断：

- `exp`：是否已过期
- `nbf`：是否尚未生效
- `iat`：是否晚于当前本地时间

同时会展示：

- 原始时间戳
- 本地可读时间
- 剩余秒数或超时秒数

### 签名验证

当你开启“验签”后，工具会读取 `Header.alg`，并根据当前算法自动选择验证方式：

- `HS*`：需要输入 `Secret`
- `RS*`：需要输入 `PEM Public Key` 或 `RSA JWK`

如果输入的材料类型和算法不匹配，页面会直接给出排错提示。

## 使用说明

1. 在左侧粘贴需要调试的 `JWT Token`
2. 如需处理时钟偏移，可设置“时间容差（秒）”
3. 如果要验证签名，打开“启用验签”
4. 选择 `Secret`、`PEM Public Key` 或 `JWK`
5. 粘贴对应的验签内容
6. 点击“解析 JWT”或“解析并验签”
7. 在右侧查看结构概览、关键字段、时间 claim 和验签结果
8. 如有需要，可以分别复制 `Header JSON`、`Payload JSON`、`Signature` 或验签输入串

## 安全说明

本工具仅在当前浏览器页面内存中处理 token、payload、secret 和公钥内容。

1. 不会将输入内容上传到服务器
2. 不会自动写入本地存储
3. 不会保存历史记录
4. 刷新或关闭页面后，当前内容会被清空
5. 如果你主动执行复制操作，后续数据将由浏览器和操作系统接管

## 限制说明

- 当前仅支持 `JWT`，不支持 `JWE`
- 当前仅支持 `HS256 / HS384 / HS512 / RS256 / RS384 / RS512`
- 当前不支持 `JWKS URL` 在线拉取
- 当前不支持根据 `kid` 自动联网匹配公钥
- 时间类 claim 默认按秒级 Unix 时间戳解释
- 当前工具主要面向开发调试，不建议直接替代生产密钥管理流程

## 常见问题

### 为什么 token 能解析，但验签失败

常见原因包括：

- `Header.alg` 与你实际使用的算法不一致
- 当前 token 内容在传输过程中被改动过
- 你输入的 `Secret` 或公钥不是签发方真实使用的那一份
- `RS` 系列 token 误用了 `Secret`
- `HS` 系列 token 误用了 `PEM` 或 `JWK`

### 为什么 token 明明刚拿到，却提示未生效或已过期

通常需要优先检查以下几项：

- 当前机器时间是否准确
- 签发方服务器是否存在时钟偏移
- `exp / nbf / iat` 是否真的是秒级时间戳
- 是否需要设置少量 `clockTolerance`

### `alg = none` 是什么意思

这通常表示当前 token 没有签名保护。开发测试时偶尔会遇到，但在需要安全保证的真实场景中应非常谨慎。

## 代码示例

### Node.js 中解析 `JWT Payload`

```ts
const token = "header.payload.signature";
const [, payload] = token.split(".");

const json = Buffer.from(payload, "base64url").toString("utf8");

console.log(JSON.parse(json));
```

### Node.js 中验证 `HS256`

```ts
import { createHmac, timingSafeEqual } from "node:crypto";

const secret = "demo-secret";
const token = "header.payload.signature";
const [header, payload, signature] = token.split(".");
const signingInput = `${header}.${payload}`;

const expected = createHmac("sha256", secret)
  .update(signingInput, "utf8")
  .digest("base64url");

console.log(timingSafeEqual(Buffer.from(signature), Buffer.from(expected)));
```

## 相关工具

- 如果你需要生成 `JWT Secret`，可以继续使用[密钥在线生成工具](/key-generator)。
- 如果你需要检查 `PEM` 或 `JWK` 的 RSA 公钥内容，可以继续使用[RSA 在线工具箱](/rsa-tool)。
- 如果你需要整理 payload 中的嵌套 JSON 字段，可以继续使用[JSON 在线格式化工具](/json-formatting)。
