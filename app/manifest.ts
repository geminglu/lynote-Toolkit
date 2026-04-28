import { withBasePath } from "@/lib/seo";
import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Lynote Toolkit",
    short_name: "Lynote Toolkit",
    description:
      "提供 JSON 格式化、密钥生成、哈希/HMAC、RSA 联调等浏览器本地在线工具。",
    start_url: withBasePath("/"),
    display: "standalone",
    background_color: "#0f172a",
    theme_color: "#0f172a",
    icons: [
      {
        src: withBasePath("/icon.svg"),
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
