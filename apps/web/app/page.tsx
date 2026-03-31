import JsonLd from "@/components/JsonLd";
import {
  createPageMetadata,
  createWebsiteJsonLd,
  TOOL_ROUTE_CONFIGS,
} from "@/lib/seo";
import { Badge } from "lynote-ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "lynote-ui/card";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = createPageMetadata({
  absoluteTitle: "Lynote Toolkit 开发者在线工具箱",
  description:
    "提供 JSON 格式化、URL 编解码与参数解析、颜色转换、JWT 解析验签、密钥生成、哈希/HMAC、RSA 联调等浏览器本地在线工具，适合开发调试和接口联调。",
  pathname: "/",
  keywords: [
    "开发者在线工具箱",
    "JSON 在线格式化",
    "URL 在线编码",
    "CSS 颜色转换",
    "JWT 在线解析",
    "RSA 在线工具",
    "SHA256 在线计算",
    "密钥在线生成",
  ],
});

const SCENES = [
  "接口联调时快速格式化和校验 JSON 请求体",
  "对回调地址、redirect_uri 和 Query String 做 URL 编码、解码与参数排查",
  "在 RGBA、HSL、HWB、Lab、LCH、OKLCH 之间同步转换颜色",
  "在浏览器本地解析 JWT，并检查 exp、nbf、iat 和签名状态",
  "生成 JWT Secret、AES-256、RSA Key Pair 等测试密钥",
  "计算 SHA-256、MD5、HMAC 等摘要用于完整性校验",
  "在浏览器本地完成 RSA 加解密、签名和验签",
];

export default function Home() {
  return (
    <>
      <JsonLd data={createWebsiteJsonLd()} />

      <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-8 px-4 py-10 md:px-6">
        <section className="space-y-3">
          <Badge variant="outline">Toolbox</Badge>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
              开发者在线工具箱
            </h1>
            <p className="max-w-3xl text-sm text-muted-foreground md:text-base">
              Lynote Toolkit 提供 JSON 在线格式化、URL
              编解码与参数解析、颜色转换、JWT 解析验签、密钥生成、哈希与 HMAC
              计算、RSA
              联调等浏览器本地工具，适合接口调试、登录态排查、回调地址排错、主题调色、Webhook
              验签和开发测试。
            </p>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          {TOOL_ROUTE_CONFIGS.map((entry) => (
            <Link href={entry.route} key={entry.route} target="_blank">
              <Card className="h-full transition-colors hover:bg-muted/40">
                <CardHeader>
                  <CardTitle>{entry.shortTitle}</CardTitle>
                  <CardAction>
                    <Badge variant="secondary">已上线</Badge>
                  </CardAction>
                  <CardDescription>{entry.description}</CardDescription>
                </CardHeader>
                <CardContent className="text-sm font-medium text-primary">
                  进入工具
                </CardContent>
              </Card>
            </Link>
          ))}
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold tracking-tight">
            常见使用场景
          </h2>
          <ul className="grid gap-3 text-sm text-muted-foreground md:grid-cols-2">
            {SCENES.map((scene) => (
              <li
                className="rounded-xl border bg-muted/20 px-4 py-3"
                key={scene}
              >
                {scene}
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold tracking-tight">
            为什么适合做开发调试
          </h2>
          <div className="space-y-3 text-sm leading-7 text-muted-foreground md:text-base">
            <p>
              这些页面以服务端输出正文和客户端交互组合的方式构建，既保留了工具操作体验，也能让搜索引擎直接抓取页面主题、说明文档和常见问题内容。
            </p>
            <p>
              所有核心工具都围绕浏览器本地处理展开，尤其适合不希望把密钥、摘要原文、调试
              JSON 或签名数据上传到第三方服务器的场景。
            </p>
          </div>
        </section>
      </main>
    </>
  );
}
