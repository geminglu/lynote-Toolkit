import type { Metadata } from "next";

export const SITE_NAME = "Lynote Toolkit";
export const SITE_TITLE = "Lynote Toolkit 开发者在线工具箱";
export const SITE_DESCRIPTION =
  "面向开发者的浏览器本地工具站，提供 JSON 格式化、密钥生成、哈希/HMAC、RSA 联调等在线工具。";
export const SITE_BASE_PATH =
  process.env.GITHUB_ACTIONS === "true" ? "/lynote-Toolkit" : "";
export const SITE_ORIGIN =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "http://localhost:3000";

export type ToolRouteConfig = {
  route: string;
  readmePath: string;
  title: string;
  shortTitle: string;
  description: string;
  keywords: string[];
};

export const TOOL_ROUTE_CONFIGS: ToolRouteConfig[] = [
  {
    route: "/json-formatting",
    readmePath: "/app/jsonFormatting/README.md",
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
  },
  {
    route: "/key-generator",
    readmePath: "/app/keyGenerator/README.md",
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
  },
  {
    route: "/hash-generator",
    readmePath: "/app/hashGenerator/README.md",
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
  },
  {
    route: "/rsa-tool",
    readmePath: "/app/rsaTool/README.md",
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
