import { readContentMarkdownFile } from "@/lib/markdown";

import RsaToolWorkspaceClient from "./workspace-client";

export default async function RsaToolPage() {
  const markdownContent = await readContentMarkdownFile(
    "/app/rsaTool/README.md",
  );

  return <RsaToolWorkspaceClient markdownContent={markdownContent} />;
}
