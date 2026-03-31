import JsonLd from "@/components/JsonLd";
import { readContentMarkdownFile } from "@/lib/markdown";
import {
  createSoftwareApplicationJsonLd,
  createToolMetadata,
  getToolRouteConfig,
} from "@/lib/seo";
import JwtDebuggerWorkspaceClient from "./workspace-client";

const routeConfig = getToolRouteConfig("/jwt-debugger");

export const metadata = createToolMetadata(routeConfig);

export default async function JwtDebuggerPage() {
  const markdownContent = await readContentMarkdownFile(routeConfig.readmePath);

  return (
    <>
      <JsonLd data={createSoftwareApplicationJsonLd(routeConfig)} />
      <JwtDebuggerWorkspaceClient markdownContent={markdownContent} />
    </>
  );
}
