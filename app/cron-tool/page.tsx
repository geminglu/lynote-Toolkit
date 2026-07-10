import JsonLd from "@/components/JsonLd";
import { readContentMarkdownFile } from "@/lib/markdown";
import {
  createSoftwareApplicationJsonLd,
  createToolMetadata,
  getToolRouteConfig,
} from "@/lib/seo";
import CronToolWorkspaceClient from "./workspace-client";

const routeConfig = getToolRouteConfig("/cron-tool");

export const metadata = createToolMetadata(routeConfig);

export default async function CronToolPage() {
  const markdownContent = await readContentMarkdownFile(routeConfig.readmePath);

  return (
    <>
      <JsonLd data={createSoftwareApplicationJsonLd(routeConfig)} />
      <CronToolWorkspaceClient markdownContent={markdownContent} />
    </>
  );
}
