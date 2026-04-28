import JsonLd from "@/components/JsonLd";
import { readContentMarkdownFile } from "@/lib/markdown";
import {
  createSoftwareApplicationJsonLd,
  createToolMetadata,
  getToolRouteConfig,
} from "@/lib/seo";

import QrCodeToolWorkspaceClient from "./workspace-client";

const routeConfig = getToolRouteConfig("/qr-code-tool");

export const metadata = createToolMetadata(routeConfig);

export default async function QrCodeToolPage() {
  const markdownContent = await readContentMarkdownFile(routeConfig.readmePath);

  return (
    <>
      <JsonLd data={createSoftwareApplicationJsonLd(routeConfig)} />
      <QrCodeToolWorkspaceClient markdownContent={markdownContent} />
    </>
  );
}
