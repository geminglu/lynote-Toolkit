import { Badge } from "lynote-ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "lynote-ui/card";
import Link from "next/link";

const TOOL_ENTRIES = [
  {
    href: "/jsonFormatting",
    title: "JSON 格式化",
    description: "校验、格式化、压缩、转义和排序 JSON 内容。",
    badge: "已上线",
  },
  {
    href: "/keyGenerator",
    title: "密钥生成工具",
    description:
      "在浏览器本地生成 API Key、JWT Secret、AES-256、HMAC-SHA256 与 RSA Key Pair。",
    badge: "新工具",
  },
  {
    href: "/hashGenerator",
    title: "哈希生成工具",
    description:
      "在浏览器本地为文本和单文件生成 Hash 或 HMAC，支持 SHA-2、MD5 与 SHA-1 兼容算法。",
    badge: "新工具",
  },
  {
    href: "/rsaTool",
    title: "RSA 工具箱",
    description:
      "在浏览器本地完成 RSA 加密、解密、签名、验签与密钥检查，适合联调和接入测试。",
    badge: "新工具",
  },
];

export default async function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-4 py-10 md:px-6">
      <section className="space-y-3">
        <Badge variant="outline">Toolbox</Badge>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            开发者工具集合
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
            当前提供 JSON 格式化、密钥生成、哈希/HMAC 与 RSA
            工具四类能力，均以浏览器本地交互为主，适合日常开发和联调场景。
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {TOOL_ENTRIES.map((entry) => (
          <Link href={entry.href} key={entry.href} target="_blank">
            <Card className="h-full transition-colors hover:bg-muted/40">
              <CardHeader>
                <CardTitle>{entry.title}</CardTitle>
                <CardAction>
                  <Badge variant="secondary">{entry.badge}</Badge>
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
    </main>
  );
}
