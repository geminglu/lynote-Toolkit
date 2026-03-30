import JsonLd from "@/components/JsonLd";
import { readContentMarkdownFile } from "@/lib/markdown";
import {
  createSoftwareApplicationJsonLd,
  createToolMetadata,
  getToolRouteConfig,
} from "@/lib/seo";
import RsaToolWorkspaceClient from "../rsaTool/workspace-client";

const routeConfig = getToolRouteConfig("/rsa-tool");

export const metadata = createToolMetadata(routeConfig);

export default async function RsaToolPage() {
  const markdownContent = await readContentMarkdownFile(routeConfig.readmePath);

  return (
    <>
      <JsonLd data={createSoftwareApplicationJsonLd(routeConfig)} />
      <RsaToolWorkspaceClient markdownContent={markdownContent} />
    </>
  );
}
