import { readContentMarkdownFile } from "@/lib/markdown";
import JsonFormattingWorkspaceClient from "./workspace-client";

export default async function JsonFormattingPage() {
  const markdownContent = await readContentMarkdownFile(
    "/app/jsonFormatting/README.md",
  );

  return <JsonFormattingWorkspaceClient markdownContent={markdownContent} />;
}
