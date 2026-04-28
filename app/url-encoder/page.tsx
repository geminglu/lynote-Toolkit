import JsonLd from "@/components/JsonLd";
import { readContentMarkdownFile } from "@/lib/markdown";
import {
  createSoftwareApplicationJsonLd,
  createToolMetadata,
  getToolRouteConfig,
} from "@/lib/seo";
import UrlToolWorkspaceClient from "./workspace-client";

const routeConfig = getToolRouteConfig("/url-encoder");

export const metadata = createToolMetadata(routeConfig);

export default async function UrlToolPage() {
  const markdownContent = await readContentMarkdownFile(routeConfig.readmePath);

  return (
    <>
      <JsonLd data={createSoftwareApplicationJsonLd(routeConfig)} />
      <UrlToolWorkspaceClient markdownContent={markdownContent} />
    </>
  );
}
