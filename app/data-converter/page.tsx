import JsonLd from "@/components/JsonLd";
import { readContentMarkdownFile } from "@/lib/markdown";
import {
  createSoftwareApplicationJsonLd,
  createToolMetadata,
  getToolRouteConfig,
} from "@/lib/seo";

import DataConverterWorkspaceClient from "./workspace-client";

const routeConfig = getToolRouteConfig("/data-converter");

export const metadata = createToolMetadata(routeConfig);

export default async function DataConverterPage() {
  const markdownContent = await readContentMarkdownFile(routeConfig.readmePath);

  return (
    <>
      <JsonLd data={createSoftwareApplicationJsonLd(routeConfig)} />
      <DataConverterWorkspaceClient markdownContent={markdownContent} />
    </>
  );
}
