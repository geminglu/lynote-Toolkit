import type { NextConfig } from "next";

const siteBasePath = process.env.NEXT_PUBLIC_SITE_BASE_PATH || "";

const nextConfig: NextConfig = {
  output: "export",
  basePath: siteBasePath || undefined,
  allowedDevOrigins: ["127.0.0.1"],
  env: {
    NEXT_PUBLIC_SITE_BASE_PATH: siteBasePath,
    NEXT_PUBLIC_SITE_URL:
      process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  },
  transpilePackages: ["lynote-ui"],
};

export default nextConfig;
