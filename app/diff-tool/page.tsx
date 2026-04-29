import JsonLd from "@/components/JsonLd";
import { readContentMarkdownFile } from "@/lib/markdown";
import {
  createSoftwareApplicationJsonLd,
  createToolMetadata,
  getToolRouteConfig,
} from "@/lib/seo";

import DiffToolWorkspaceClient from "./workspace-client";

/**
 * 文本对比工具的路由配置。
 *
 * SEO metadata、JSON-LD 和 README 路径都从统一路由配置读取，避免页面标题、
 * 首页卡片和文档内容出现不一致。
 */
const routeConfig = getToolRouteConfig("/diff-tool");

export const metadata = createToolMetadata(routeConfig);

/**
 * 文本对比工具服务端页面。
 *
 * 该组件保持轻量：只负责读取 Markdown 文档、注入结构化数据，并把交互区域交给
 * 客户端组件渲染。
 */
export default async function DiffToolPage() {
  const markdownContent = await readContentMarkdownFile(routeConfig.readmePath);

  return (
    <>
      <JsonLd data={createSoftwareApplicationJsonLd(routeConfig)} />
      <DiffToolWorkspaceClient markdownContent={markdownContent} />
    </>
  );
}
