import JsonLd from "@/components/JsonLd";
import { readContentMarkdownFile } from "@/lib/markdown";
import {
  createSoftwareApplicationJsonLd,
  createToolMetadata,
  getToolRouteConfig,
} from "@/lib/seo";
import HashGeneratorWorkspaceClient from "./workspace-client";

const routeConfig = getToolRouteConfig("/hash-generator");

export const metadata = createToolMetadata(routeConfig);

export default async function HashGeneratorPage() {
  const markdownContent = await readContentMarkdownFile(routeConfig.readmePath);

  return (
    <>
      <JsonLd data={createSoftwareApplicationJsonLd(routeConfig)} />
      <HashGeneratorWorkspaceClient markdownContent={markdownContent} />
    </>
  );
}
