import type { NextConfig } from "next";

const githubPagesBasePath =
  process.env.GITHUB_ACTIONS === "true" ? "/lynote-Toolkit" : undefined;

const nextConfig: NextConfig = {
  output: "export",
  basePath: githubPagesBasePath,
  transpilePackages: ["lynote-ui"],
};

export default nextConfig;
