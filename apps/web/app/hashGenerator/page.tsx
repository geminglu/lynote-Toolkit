import { readContentMarkdownFile } from "@/lib/markdown";

import HashGeneratorWorkspaceClient from "./workspace-client";

export default async function HashGeneratorPage() {
  const markdownContent = await readContentMarkdownFile(
    "/app/hashGenerator/README.md",
  );

  return <HashGeneratorWorkspaceClient markdownContent={markdownContent} />;
}
