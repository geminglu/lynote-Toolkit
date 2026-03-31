这个工具用于在当前浏览器页面中即时计算文本或单文件的 `Hash` / `HMAC` 结果，适合做内容校验、文件完整性比对、Webhook 验签、接口联调和开发测试。

## 计算模式

1. `Hash`
2. `HMAC`

### 输入类型

1. `文本`
2. `单文件`

### Hash 算法

1. `SHA-256`
2. `SHA-384`
3. `SHA-512`
4. `MD5`
5. `SHA-1`

### HMAC 算法

1. `HMAC-SHA256`
2. `HMAC-SHA384`
3. `HMAC-SHA512`
4. `HMAC-MD5`
5. `HMAC-SHA1`

其中：

- `SHA-256`、`SHA-384`、`SHA-512` 与对应的 `HMAC-SHA*` 适合作为默认推荐算法。
- `MD5`、`SHA-1`、`HMAC-MD5`、`HMAC-SHA1` 主要用于兼容旧系统或既有流程，不建议继续用于新的安全敏感场景。

### 输出格式

1. `Hex`
2. `Base64`
3. `Base64URL`

## Hash 和 HMAC 的区别

### `Hash`

`Hash` 只基于输入内容本身生成摘要，适合做：

- 文件完整性校验
- 内容指纹
- 构建产物比对
- 后端返回摘要的验证

### `HMAC`

`HMAC` 会把输入内容和 `Secret` 一起参与计算，更适合做：

- Webhook 签名
- API 请求签名
- 回调验签
- 消息认证码校验

当前工具中的 `HMAC Secret` 按 `UTF-8` 文本处理，空格和换行也会参与计算。

## 功能说明

### 多算法同时生成

你可以一次选择多种算法，工具会基于同一份输入内容同时生成多组结果，方便直接对比不同系统所需的摘要或签名格式。

### 校验模式

你可以额外输入一段“原哈希值”或“原 HMAC 值”作为校验目标。生成结果后，页面会按当前输出格式逐项进行比对，并标记：

- `校验一致`
- `校验不一致`

### 文件元信息

文件模式下，页面会展示：

- 文件名
- 文件大小
- MIME 类型
- 最后修改时间

## 适用场景

### `SHA-256`

最常见、兼容性最好，适合大多数现代文件校验、内容指纹和服务间摘要校验。

### `SHA-384`

摘要长度比 `SHA-256` 更长，适合对摘要长度有更高要求的场景。

### `SHA-512`

输出更长，适合偏保守的校验策略或与现有系统保持一致。

### `MD5`

常见于旧系统文件校验、镜像校验值、软件下载页摘要展示等兼容场景。

### `SHA-1`

常见于老旧工具链、版本库历史流程或遗留系统对接，不建议作为新的安全策略基础。

### `HMAC-SHA256`

常见于 Webhook 签名、开放平台回调验签、请求体签名等场景。

### `HMAC-SHA384`

适用于目标系统明确要求更长 HMAC 输出的场景。

### `HMAC-SHA512`

适合偏保守的签名策略或既有系统规范要求。

### `HMAC-MD5`

多见于老旧系统或历史兼容协议，不建议作为新的签名方案基础。

### `HMAC-SHA1`

多见于遗留 API、旧版 SDK 或历史验签链路，不建议作为新的签名方案基础。

## 编码格式区别

### `Hex`

- 优点：可读性强，最常见，适合人工比对。
- 缺点：体积较大。
- 适合：日志、接口文档、后端配置、命令行输出。

### `Base64`

- 优点：长度更短，传输紧凑。
- 缺点：包含 `+`、`/`、`=`，在 URL 中不够友好。
- 适合：配置文件、接口字段、二进制摘要传输。

### `Base64URL`

- 优点：对 URL 和文件名更友好。
- 缺点：部分系统只接受标准 `Base64`。
- 适合：URL 参数、JWT 相关场景、浏览器端短文本传输。

## 代码示例

### Node.js 中计算文本的 `SHA-256`

```ts
import { createHash } from "node:crypto";

const content = "hello world";

const hash = createHash("sha256").update(content, "utf8").digest("hex");

console.log(hash);
```

### Node.js 中计算文件的 `SHA-512`

```ts
import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";

const stream = createReadStream("./example.zip");
const hash = createHash("sha512");

stream.on("data", (chunk) => {
  hash.update(chunk);
});

stream.on("end", () => {
  console.log(hash.digest("base64"));
});
```

### Node.js 中计算 `HMAC-SHA256`

```ts
import { createHmac } from "node:crypto";

const secret = "demo-secret";
const payload = '{"event":"ping"}';

const signature = createHmac("sha256", secret)
  .update(payload, "utf8")
  .digest("hex");

console.log(signature);
```

### Node.js 中计算 `HMAC-MD5`

```ts
import { createHmac } from "node:crypto";

const signature = createHmac("md5", "legacy-secret")
  .update("demo", "utf8")
  .digest("base64");

console.log(signature);
```

### 浏览器中通过 `Web Crypto API` 计算 `SHA-256`

```ts
const content = "hello world";
const bytes = new TextEncoder().encode(content);
const digest = await crypto.subtle.digest("SHA-256", bytes);

const hex = Array.from(new Uint8Array(digest), (value) =>
  value.toString(16).padStart(2, "0"),
).join("");

console.log(hex);
```

### `OpenSSL` 计算文件 `SHA-384`

```bash
openssl dgst -sha384 ./example.zip
```

### `OpenSSL` 计算 `HMAC-SHA1`

```bash
openssl dgst -sha1 -hmac "legacy-secret" ./example.txt
```

## 使用说明

1. 在左侧选择 `Hash` 或 `HMAC` 模式。
2. 选择输入类型、算法和输出格式。
3. 文本模式下输入需要计算的内容；文件模式下选择或拖拽一个文件。
4. 如果是 `HMAC` 模式，请输入 `Secret`。
5. 如需校验，在“校验模式”中输入原结果。
6. 点击“生成”后，右侧展示每种算法的结果和比对状态。
7. 你可以按需复制或下载任一结果。
8. 点击“恢复默认配置”会回到初始页面设置。

## 安全说明

本工具仅在当前浏览器页面内存中处理输入内容、`Secret` 和计算结果。

1. 不会将文本内容、文件内容、`Secret` 或生成结果上传到服务器。
2. 不会自动写入本地存储，也不会保存历史记录。
3. 页面刷新或关闭后，当前输入、`Secret` 与结果都会被清空。
4. 如果你主动执行复制或下载，数据将由浏览器和操作系统接管。

## 限制说明

- 当前仅支持 `单文件` 输入，不支持批量文件或文件夹。
- 文件大小上限为 `512 MB`。
- 当前 `HMAC Secret` 仅支持按 `UTF-8` 文本输入。
- 校验模式会按当前输出格式进行比对，请确保输入的原值与当前格式一致。
- `MD5`、`SHA-1`、`HMAC-MD5`、`HMAC-SHA1` 仅建议用于兼容场景，不建议用于新的安全敏感需求。

## 常见问题

### `Hash` 和 `HMAC` 应该怎么选

- 如果你只是想确认内容有没有变化，优先用 `Hash`
- 如果你还需要验证“这段内容是不是由持有 Secret 的一方生成”，优先用 `HMAC`

### 为什么相同文本在不同系统里结果不一致

通常要优先检查以下几项：

- 输入文本是否完全一致
- 编码是否都是 `UTF-8`
- 输出格式是否一致，例如 `Hex` 和 `Base64`
- `HMAC Secret` 是否包含额外空格、换行或不可见字符

### 文件哈希适合用在哪些场景

文件哈希常见于下载包校验、构建产物核对、镜像摘要比对和离线文件完整性验证。

## 相关工具

- 如果你需要生成 `HMAC Secret`、`AES` 或 `RSA` 密钥，可以继续使用[密钥在线生成工具](/key-generator)。
- 如果你需要做公私钥加解密、签名和验签，可以继续使用[RSA 在线工具箱](/rsa-tool)。
- 如果你需要处理签名前的请求体或回调 JSON，可以继续使用[JSON 在线格式化工具](/json-formatting)。
