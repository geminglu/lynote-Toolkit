import type { NextConfig } from "next";

const siteBasePath =
  process.env.NEXT_PUBLIC_SITE_BASE_PATH ||
  (process.env.GITHUB_ACTIONS === "true" ? "/lynote-Toolkit" : "");

const nextConfig: NextConfig = {
  output: "export",
  basePath: siteBasePath || undefined,
  env: {
    NEXT_PUBLIC_SITE_BASE_PATH: siteBasePath,
  },
  transpilePackages: ["lynote-ui"],
};

export default nextConfig;
