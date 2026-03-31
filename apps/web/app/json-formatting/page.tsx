import JsonLd from "@/components/JsonLd";
import { readContentMarkdownFile } from "@/lib/markdown";
import {
  createSoftwareApplicationJsonLd,
  createToolMetadata,
  getToolRouteConfig,
} from "@/lib/seo";
import JsonFormattingWorkspaceClient from "./workspace-client";

const routeConfig = getToolRouteConfig("/json-formatting");

export const metadata = createToolMetadata(routeConfig);

export default async function JsonFormattingPage() {
  const markdownContent = await readContentMarkdownFile(routeConfig.readmePath);

  return (
    <>
      <JsonLd data={createSoftwareApplicationJsonLd(routeConfig)} />
      <JsonFormattingWorkspaceClient markdownContent={markdownContent} />
    </>
  );
}
