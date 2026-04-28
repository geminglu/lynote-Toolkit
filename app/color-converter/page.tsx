import JsonLd from "@/components/JsonLd";
import { readContentMarkdownFile } from "@/lib/markdown";
import {
  createSoftwareApplicationJsonLd,
  createToolMetadata,
  getToolRouteConfig,
} from "@/lib/seo";

import ColorConverterWorkspaceClient from "./workspace-client";

const routeConfig = getToolRouteConfig("/color-converter");

export const metadata = createToolMetadata(routeConfig);

export default async function ColorConverterPage() {
  const markdownContent = await readContentMarkdownFile(routeConfig.readmePath);

  return (
    <>
      <JsonLd data={createSoftwareApplicationJsonLd(routeConfig)} />
      <ColorConverterWorkspaceClient markdownContent={markdownContent} />
    </>
  );
}
