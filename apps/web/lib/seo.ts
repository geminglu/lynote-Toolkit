import type { Metadata } from "next";

export const SITE_NAME = "Lynote Toolkit";
export const SITE_TITLE = "Lynote Toolkit 开发者在线工具箱";
export const SITE_DESCRIPTION =
  "面向开发者的浏览器本地工具站，提供数据转换、JSON 格式化、Base64 / Base64URL 编解码、URL 编解码与参数解析、二维码生成与解析、颜色转换、JWT 解析验签、密钥生成、哈希/HMAC、RSA 联调等在线工具。";
export const SITE_BASE_PATH =
  process.env.GITHUB_ACTIONS === "true" ? "/lynote-Toolkit" : "";
export const SITE_ORIGIN =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "http://localhost:3000";

/**
 * 工具分类类型。
 */
export type ToolCategory = "编码转换" | "颜色设计" | "数据处理" | "安全加密";

/**
 * 工具卡片图标标识。
 */
export type ToolIconKey =
  | "binary"
  | "color"
  | "data"
  | "hash"
  | "json"
  | "jwt"
  | "key"
  | "link"
  | "qr"
  | "rsa";

/**
 * 工具路由与展示配置。
 */
export type ToolRouteConfig = {
  route: string;
  readmePath: string;
  title: string;
  shortTitle: string;
  description: string;
  keywords: string[];
  category: string;
  chip: string;
  iconKey: string;
};

export const TOOL_ROUTE_CONFIGS: ToolRouteConfig[] = [
  {
    route: "/data-converter",
    readmePath: "/app/data-converter/README.md",
    title: "数据转换与代码生成工具",
    shortTitle: "数据转换工具",
    description:
      "支持 JSON、YAML、XML 互转，并生成 TypeScript、Zod、Java、Go、C 模型代码，适合接口联调、配置迁移和数据结构整理。",
    keywords: [
      "JSON YAML XML 转换",
      "TypeScript 类型生成",
      "Zod 在线生成",
      "Java Go C 模型生成",
      "数据格式转换工具",
    ],
    category: "数据处理",
    chip: "模型生成",
    iconKey: "data",
  },
  {
    route: "/base64-tool",
    readmePath: "/app/base64-tool/README.md",
    title: "Base64 / Base64URL 编解码工具",
    shortTitle: "Base64 编解码",
    description:
      "支持文本、Base64、Base64URL、JWT 片段、Data URL 与文件内容的浏览器本地转换、逐行处理和字节预览。",
    keywords: [
      "Base64 编码",
      "Base64 解码",
      "Base64URL",
      "Data URL",
      "JWT Base64URL 解码",
      "文件转 Base64",
    ],
    category: "编码转换",
    chip: "文本与文件",
    iconKey: "binary",
  },
  {
    route: "/json-formatting",
    readmePath: "/app/json-formatting/README.md",
    title: "JSON 在线格式化工具",
    shortTitle: "JSON 格式化",
    description:
      "支持 JSON 校验、格式化、压缩、转义和 key 排序，适合接口调试、配置排查和日志处理。",
    keywords: [
      "JSON 格式化",
      "JSON 在线校验",
      "JSON 压缩",
      "JSON 转义",
      "JSON key 排序",
    ],
    category: "数据处理",
    chip: "高频调试",
    iconKey: "json",
  },
  {
    route: "/color-converter",
    readmePath: "/app/color-converter/README.md",
    title: "CSS 颜色转换工具",
    shortTitle: "颜色转换工具",
    description:
      "支持 HEXA、RGBA、HSLA、HWB、Lab、LCH 和 OKLCH 在线转换与联动调色，适合主题调试和设计协作。",
    keywords: [
      "CSS 颜色转换",
      "RGBA 转 OKLCH",
      "Lab 在线转换",
      "LCH 在线转换",
      "HSL 在线调色",
    ],
    category: "颜色设计",
    chip: "主题调色",
    iconKey: "color",
  },
  {
    route: "/url-encoder",
    readmePath: "/app/url-encoder/README.md",
    title: "URL 编码与解析工具",
    shortTitle: "URL 编解码",
    description:
      "支持完整 URL、参数值和 Query String 的编码、解码与结构解析，适合回调地址排查和跳转参数检查。",
    keywords: [
      "URL 编码",
      "URL 解码",
      "URL Encode",
      "URL Decode",
      "Query 参数解析",
      "encodeURIComponent",
    ],
    category: "编码转换",
    chip: "回调排查",
    iconKey: "link",
  },
  {
    route: "/qr-code-tool",
    readmePath: "/app/qr-code-tool/README.md",
    title: "二维码在线生成与解析工具",
    shortTitle: "二维码工具",
    description:
      "支持文本、网址、Wi-Fi、电话、短信和邮箱二维码的浏览器本地生成、Logo 美化、透明背景导出与图片解析。",
    keywords: [
      "二维码生成器",
      "二维码解析",
      "WiFi 二维码生成",
      "URL 转二维码",
      "透明背景二维码",
      "带 Logo 二维码",
    ],
    category: "数据处理",
    chip: "扫码分享",
    iconKey: "qr",
  },
  {
    route: "/key-generator",
    readmePath: "/app/key-generator/README.md",
    title: "密钥在线生成工具",
    shortTitle: "密钥生成工具",
    description:
      "支持 API Key、JWT Secret、AES-256、HMAC-SHA256 和 RSA Key Pair 的浏览器本地生成。",
    keywords: [
      "密钥生成工具",
      "JWT Secret 生成",
      "API Key 生成",
      "AES Key 生成",
      "RSA Key Pair 生成",
    ],
    category: "安全加密",
    chip: "测试密钥",
    iconKey: "key",
  },
  {
    route: "/jwt-debugger",
    readmePath: "/app/jwt-debugger/README.md",
    title: "JWT 在线解析与验签工具",
    shortTitle: "JWT 调试工具",
    description:
      "支持 JWT Header / Payload 解析、exp / nbf / iat 校验，以及基于 Secret、PEM Public Key 或 JWK 的本地验签。",
    keywords: [
      "JWT 解析",
      "JWT 验签",
      "JWT Decoder",
      "JWT Verify",
      "HS256",
      "RS256",
    ],
    category: "安全加密",
    chip: "鉴权排障",
    iconKey: "jwt",
  },
  {
    route: "/hash-generator",
    readmePath: "/app/hash-generator/README.md",
    title: "哈希与 HMAC 在线生成工具",
    shortTitle: "哈希生成工具",
    description:
      "支持 SHA-256、SHA-384、SHA-512、MD5、SHA-1 与 HMAC 在线计算，适合文件校验、Webhook 验签和接口联调。",
    keywords: [
      "SHA256 在线生成",
      "HMAC 在线计算",
      "MD5 工具",
      "Hash 生成器",
      "Webhook 验签",
    ],
    category: "安全加密",
    chip: "摘要/HMAC",
    iconKey: "hash",
  },
  {
    route: "/rsa-tool",
    readmePath: "/app/rsa-tool/README.md",
    title: "RSA 在线工具箱",
    shortTitle: "RSA 工具箱",
    description:
      "支持 RSA-OAEP 加密解密、RSASSA / RSA-PSS 签名验签与密钥检查，适合前后端联调和接入测试。",
    keywords: [
      "RSA 在线加密",
      "RSA 在线解密",
      "RSA 验签工具",
      "RSA 签名工具",
      "RSA 密钥检查",
    ],
    category: "安全加密",
    chip: "签名验签",
    iconKey: "rsa",
  },
];

export function getToolRouteConfig(route: string) {
  const config = TOOL_ROUTE_CONFIGS.find((item) => item.route === route);

  if (!config) {
    throw new Error(`Unknown tool route config: ${route}`);
  }

  return config;
}

export function withBasePath(pathname: string) {
  if (!SITE_BASE_PATH) {
    return pathname;
  }

  if (pathname === "/") {
    return SITE_BASE_PATH;
  }

  return `${SITE_BASE_PATH}${pathname}`;
}

export function absoluteUrl(pathname: string) {
  return new URL(withBasePath(pathname), `${SITE_ORIGIN}/`).toString();
}

type CreatePageMetadataOptions = {
  title?: string;
  absoluteTitle?: string;
  description: string;
  pathname: string;
  keywords?: string[];
  robots?: Metadata["robots"];
};

export function createPageMetadata({
  title,
  absoluteTitle,
  description,
  pathname,
  keywords = [],
  robots,
}: CreatePageMetadataOptions): Metadata {
  const resolvedTitle = absoluteTitle ? { absolute: absoluteTitle } : title;

  return {
    title: resolvedTitle,
    description,
    keywords,
    alternates: {
      canonical: pathname,
    },
    openGraph: {
      title: absoluteTitle ?? title ?? SITE_TITLE,
      description,
      url: pathname,
      siteName: SITE_NAME,
      locale: "zh_CN",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: absoluteTitle ?? title ?? SITE_TITLE,
      description,
    },
    robots,
  };
}

export function createToolMetadata(config: ToolRouteConfig) {
  return createPageMetadata({
    title: config.title,
    description: config.description,
    pathname: config.route,
    keywords: config.keywords,
  });
}

export function createWebsiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: absoluteUrl("/"),
    description: SITE_DESCRIPTION,
    inLanguage: "zh-CN",
  };
}

export function createSoftwareApplicationJsonLd(config: ToolRouteConfig) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: config.title,
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Web",
    isAccessibleForFree: true,
    url: absoluteUrl(config.route),
    description: config.description,
    inLanguage: "zh-CN",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };
}
