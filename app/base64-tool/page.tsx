import JsonLd from "@/components/JsonLd";
import { readContentMarkdownFile } from "@/lib/markdown";
import {
  createSoftwareApplicationJsonLd,
  createToolMetadata,
  getToolRouteConfig,
} from "@/lib/seo";

import Base64ToolWorkspaceClient from "./workspace-client";

const routeConfig = getToolRouteConfig("/base64-tool");

export const metadata = createToolMetadata(routeConfig);

export default async function Base64ToolPage() {
  const markdownContent = await readContentMarkdownFile(routeConfig.readmePath);

  return (
    <>
      <JsonLd data={createSoftwareApplicationJsonLd(routeConfig)} />
      <Base64ToolWorkspaceClient markdownContent={markdownContent} />
    </>
  );
}
