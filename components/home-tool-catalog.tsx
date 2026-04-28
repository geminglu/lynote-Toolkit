"use client";

import { ToolRouteConfig } from "@/lib/seo";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Binary,
  FileJson,
  Fingerprint,
  KeyRound,
  Link2,
  LockKeyhole,
  Palette,
  QrCode,
  ShieldCheck,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

/**
 * 工具列表卡片的序列化数据。
 */
export type HomeCatalogItem = Pick<
  ToolRouteConfig,
  "category" | "chip" | "description" | "iconKey" | "route"
> & {
  title: string;
};

/**
 * 工具列表筛选区的入参。
 */
type HomeToolCatalogProps = {
  items: ToolRouteConfig[];
};

const ICON_MAP: Record<string, LucideIcon> = {
  binary: Binary,
  color: Palette,
  data: WandSparkles,
  hash: Fingerprint,
  json: FileJson,
  jwt: ShieldCheck,
  key: KeyRound,
  link: Link2,
  qr: QrCode,
  rsa: LockKeyhole,
};

export default function HomeToolCatalog({ items }: HomeToolCatalogProps) {
  const [activeCategory, setActiveCategory] = useState("全部");

  const categories = useMemo(
    () => ["全部", ...new Set(items.map((item) => item.category))],
    [items],
  );

  const visibleItems = useMemo(() => {
    if (activeCategory === "全部") {
      return items;
    }

    return items.filter((item) => item.category === activeCategory);
  }, [activeCategory, items]);

  const getCount = (category: string) => {
    if (category === "全部") {
      return items.length;
    }

    return items.filter((item) => item.category === category).length;
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLAnchorElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    event.currentTarget.style.setProperty("--card-x", `${x}px`);
    event.currentTarget.style.setProperty("--card-y", `${y}px`);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => {
          const active = category === activeCategory;

          return (
            <button
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition",
                active
                  ? "border-primary/30 bg-primary text-primary-foreground shadow-lg shadow-primary/15"
                  : "border-border/60 bg-background/80 text-muted-foreground hover:border-primary/20 hover:text-foreground",
              )}
              key={category}
              onClick={() => {
                setActiveCategory(category);
              }}
              type="button"
            >
              <span>{category}</span>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs",
                  active
                    ? "bg-primary-foreground/15 text-primary-foreground"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {getCount(category)}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card/70 px-4 py-3 text-sm text-muted-foreground backdrop-blur">
        <span>当前分组：{activeCategory}</span>
        <span>展示 {visibleItems.length} 个工具入口</span>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {visibleItems.map((item) => {
          const Icon = ICON_MAP[item.iconKey] ?? Sparkles;

          return (
            <Link
              className="group relative overflow-hidden rounded-[28px] border border-border/60 bg-card/90 p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5"
              href={item.route}
              rel="noopener noreferrer"
              target="_blank"
              key={item.route}
              onPointerMove={handlePointerMove}
            >
              <div
                className="pointer-events-none absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100"
                style={{
                  background:
                    "radial-gradient(220px circle at var(--card-x, 50%) var(--card-y, 50%), rgba(59, 130, 246, 0.16), transparent 72%)",
                }}
              />
              <div className="absolute inset-x-6 top-0 h-px bg-linear-to-r from-transparent via-primary/30 to-transparent opacity-0 transition group-hover:opacity-100" />

              <div className="relative flex items-start justify-between gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition duration-300 group-hover:scale-105 group-hover:bg-primary/15">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex flex-wrap justify-end gap-2">
                  <span className="rounded-full border border-border/60 px-3 py-1 text-xs text-muted-foreground">
                    {item.category}
                  </span>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                    {item.chip}
                  </span>
                </div>
              </div>

              <div className="relative mt-6 space-y-3">
                <h3 className="text-xl font-semibold tracking-tight">
                  {item.title}
                </h3>
                <p className="text-sm leading-7 text-muted-foreground">
                  {item.description}
                </p>
              </div>

              <div className="relative mt-5 flex items-center gap-2 text-sm font-medium text-primary">
                进入工具
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
