import JsonLd from "@/components/JsonLd";
import { ModeToggle } from "@/components/ModeToggle";
import {
  createPageMetadata,
  createWebsiteJsonLd,
  TOOL_ROUTE_CONFIGS,
} from "@/lib/seo";
import { ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = createPageMetadata({
  absoluteTitle: "Lynote Toolkit 开发者在线工具箱",
  description:
    "提供数据转换与代码生成、JSON 格式化、Base64 / Base64URL 编解码、URL 编解码与参数解析、二维码生成与解析、颜色转换、JWT 解析验签、密钥生成、哈希/HMAC、RSA 联调等浏览器本地在线工具，适合开发调试和接口联调。",
  pathname: "/",
  keywords: [
    "开发者在线工具箱",
    "数据转换工具",
    "JSON 在线格式化",
    "Base64 在线编解码",
    "URL 在线编码",
    "二维码生成器",
    "CSS 颜色转换",
    "JWT 在线解析",
    "RSA 在线工具",
    "SHA256 在线计算",
    "密钥在线生成",
  ],
});

const SCENES = [
  "接口联调时快速格式化和校验 JSON 请求体",
  "把 JSON、YAML、XML 互转，并生成 TypeScript、Zod、Java、Go、C 模型草稿",
  "对文本、Base64、Base64URL、Data URL 和文件内容做浏览器本地转换与字节检查",
  "对回调地址、redirect_uri 和 Query String 做 URL 编码、解码与参数排查",
  "生成文本、网址、Wi-Fi 和短信二维码，并对图片中的二维码做本地解析",
  "在 RGBA、HSL、HWB、Lab、LCH、OKLCH 之间同步转换颜色",
  "在浏览器本地解析 JWT，并检查 exp、nbf、iat 和签名状态",
  "生成 JWT Secret、AES-256、RSA Key Pair 等测试密钥",
  "计算 SHA-256、MD5、HMAC 等摘要用于完整性校验",
  "在浏览器本地完成 RSA 加解密、签名和验签",
];

const TRUST_POINTS = [
  {
    title: "浏览器本地处理",
    description: "密钥、JWT、摘要原文和调试数据默认不离开当前浏览器环境。",
  },
  {
    title: "首页直接进入工具",
    description:
      "所有卡片和入口都接现有路由配置，不会出现设计页和真实工具脱节。",
  },
  {
    title: "亮暗主题同步适配",
    description:
      "首页会跟随系统主题，也可以手动切换，落地页观感与工具页保持一致。",
  },
];

export default function Home() {
  return (
    <>
      <JsonLd data={createWebsiteJsonLd()} />

      <main className="relative isolate bg-background">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.08)_1px,transparent_1px)] mask-[radial-gradient(circle_at_top,black,transparent_78%)] bg-size-[32px_32px] opacity-50 dark:bg-[linear-gradient(to_right,rgba(71,85,105,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(71,85,105,0.12)_1px,transparent_1px)]" />
          <div className="absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.18),transparent_58%)] dark:bg-[radial-gradient(circle_at_top,rgba(173,198,255,0.16),transparent_58%)]" />
          <div className="absolute top-28 left-[12%] h-56 w-56 animate-pulse rounded-full bg-sky-500/10 blur-3xl dark:bg-sky-300/10" />
          <div className="absolute top-40 right-[8%] h-72 w-72 animate-pulse rounded-full bg-violet-500/10 blur-3xl dark:bg-indigo-200/10" />
        </div>

        <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-6 md:px-6 md:py-8">
          <header className="sticky top-0 z-20 rounded-full border border-border/60 bg-background/70 px-4 py-3 shadow-sm backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium">Lynote Toolkit</p>
                  <p className="text-xs text-muted-foreground">
                    Browser-local dev tools
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden rounded-full border border-border/60 px-3 py-1 text-xs text-muted-foreground md:block">
                  共 {TOOL_ROUTE_CONFIGS.length} 个已上线工具
                </div>
                <ModeToggle />
              </div>
            </div>
          </header>

          <section className="grid gap-8 pt-4 md:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)] md:items-center md:pt-10">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm text-primary">
                <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-current" />
                浏览器本地处理，适合开发调试和安全验证
              </div>

              <div className="space-y-4">
                <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-balance md:text-6xl">
                  把开发者工具列表做成一页更顺手的亮暗双主题入口
                </h1>
                <p className="max-w-3xl text-base leading-8 text-muted-foreground md:text-lg">
                  Lynote Toolkit 提供数据转换与代码生成、JSON 格式化、Base64 /
                  Base64URL 编解码、URL 参数排查、二维码生成与解析、颜色转换、
                  JWT 验签、密钥生成、哈希/HMAC 以及 RSA 联调等浏览器本地工具，
                  适合接口调试、登录态排错、Webhook
                  验签、扫码分享和测试密钥生成。
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/30"
                  href="/tool-list"
                >
                  查看全部工具
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  className="inline-flex items-center gap-2 rounded-xl border border-border bg-background/80 px-5 py-3 text-sm font-medium text-foreground transition hover:-translate-y-0.5 hover:border-primary/30 hover:bg-muted/40"
                  href="https://github.com/lynote/toolkit"
                  target="_blank"
                >
                  GitHub
                </Link>
              </div>

              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                {[
                  "亮暗主题自动同步",
                  "工具卡片 hover 聚焦动画",
                  "按分类快速筛选",
                ].map((item) => (
                  <span
                    className="rounded-full border border-border/60 bg-background/80 px-3 py-1"
                    key={item}
                  >
                    {item}
                  </span>
                ))}
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-border/60 bg-card/80 p-4 shadow-sm backdrop-blur transition hover:-translate-y-1">
                  <div className="text-2xl font-semibold">
                    {TOOL_ROUTE_CONFIGS.length}
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    已上线工具
                  </div>
                </div>
                <div className="rounded-2xl border border-border/60 bg-card/80 p-4 shadow-sm backdrop-blur transition hover:-translate-y-1">
                  <div className="text-2xl font-semibold">{SCENES.length}+</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    调试场景覆盖
                  </div>
                </div>
                <div className="rounded-2xl border border-border/60 bg-card/80 p-4 shadow-sm backdrop-blur transition hover:-translate-y-1">
                  <div className="text-2xl font-semibold">100%</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    浏览器本地处理
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            {TRUST_POINTS.map((item) => (
              <div
                className="rounded-3xl border border-border/60 bg-card/80 p-6 shadow-sm transition hover:-translate-y-1 hover:border-primary/20"
                key={item.title}
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-semibold tracking-tight">
                  {item.title}
                </h2>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                  {item.description}
                </p>
              </div>
            ))}
          </section>

          <section className="space-y-5" id="all-tools">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-primary">All Tools</p>
                <h2 className="text-3xl font-semibold tracking-tight">
                  按真实路由配置生成，并支持交互筛选的工具入口
                </h2>
                <p className="max-w-3xl text-sm leading-7 text-muted-foreground md:text-base">
                  工具卡片直接读取 `TOOL_ROUTE_CONFIGS`，并补了分类筛选、hover
                  聚焦光效和更明确的标签层级，后续新增工具时也不需要再单独维护展示数据。
                </p>
              </div>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]">
            <div className="rounded-[32px] border border-border/60 bg-card/85 p-6 md:p-8">
              <p className="text-sm font-medium text-primary">Common Cases</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight">
                首页保留了工具站最重要的使用上下文
              </h2>
              <ul className="mt-6 grid gap-3 text-sm text-muted-foreground md:grid-cols-2">
                {SCENES.map((scene) => (
                  <li
                    className="rounded-2xl border border-border/60 bg-background/80 px-4 py-4 leading-7 transition hover:-translate-y-0.5 hover:border-primary/20 hover:text-foreground"
                    key={scene}
                  >
                    {scene}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-[32px] border border-primary/20 bg-linear-to-br from-primary/10 via-background to-background p-6 md:p-8">
              <p className="text-sm font-medium text-primary">Design Notes</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight">
                这版不是机械还原，而是网页可用化适配
              </h2>
              <div className="mt-4 space-y-4 text-sm leading-7 text-muted-foreground">
                <p>
                  我保留了设计稿里的大背景光感、玻璃态头部、卡片化分区和亮暗双色气质，但把不稳定的
                  SVG
                  细节改成了更适合网页渲染的实现方式，并补了主题联动预览与工具列表交互。
                </p>
                <p>
                  两个原始 SVG
                  已经同步放到项目本地，方便你后面继续微调视觉资源或做二次切图。
                </p>
              </div>
              <div className="mt-6 rounded-2xl border border-border/60 bg-background/80 p-4 text-sm text-muted-foreground">
                本地设计资源：
                <div className="mt-2 font-mono text-xs text-foreground/80">
                  /public/home/landing-dark-source.svg
                </div>
                <div className="mt-1 font-mono text-xs text-foreground/80">
                  /public/home/landing-light-source.svg
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
