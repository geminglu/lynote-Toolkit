import HomeToolCatalog from "@/components/home-tool-catalog";
import { TOOL_ROUTE_CONFIGS } from "@/lib/seo";

export default function ToolListPage() {
  return (
    <div className="mx-auto flex w-full max-w-7xl px-4 py-6 md:px-6 md:py-8">
      <HomeToolCatalog items={TOOL_ROUTE_CONFIGS} />
    </div>
  );
}
