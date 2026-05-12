import type { NextConfig } from "next";

const siteBasePath = process.env.NEXT_PUBLIC_SITE_BASE_PATH || "";

const nextConfig: NextConfig = {
  output: "export",
  basePath: siteBasePath || undefined,
  env: {
    NEXT_PUBLIC_SITE_BASE_PATH: siteBasePath,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  },
  transpilePackages: ["lynote-ui"],
};

export default nextConfig;
