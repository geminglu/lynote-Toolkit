import JsonLd from "@/components/JsonLd";
import { readContentMarkdownFile } from "@/lib/markdown";
import {
  createSoftwareApplicationJsonLd,
  createToolMetadata,
  getToolRouteConfig,
} from "@/lib/seo";

import BarcodeToolWorkspaceClient from "./workspace-client";

const routeConfig = getToolRouteConfig("/barcode-tool");

export const metadata = createToolMetadata(routeConfig);

export default async function BarcodeToolPage() {
  const markdownContent = await readContentMarkdownFile(routeConfig.readmePath);

  return (
    <>
      <JsonLd data={createSoftwareApplicationJsonLd(routeConfig)} />
      <BarcodeToolWorkspaceClient markdownContent={markdownContent} />
    </>
  );
}
