import { readContentMarkdownFile } from "@/lib/markdown";

import KeyGeneratorWorkspaceClient from "./workspace-client";

export default async function KeyGeneratorPage() {
  const markdownContent = await readContentMarkdownFile(
    "/app/keyGenerator/README.md",
  );

  return <KeyGeneratorWorkspaceClient markdownContent={markdownContent} />;
}
