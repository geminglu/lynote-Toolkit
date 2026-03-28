"use client";

import { cn } from "@/lib/utils";
import { SidebarProvider, SidebarTrigger } from "lynote-ui/sidebar";
import type { FC, ReactNode } from "react";
import WorkspaceSidebar from "./WorkspaceSidebar";

export type WorkspaceLayoutProps = {
  children: ReactNode;
  sidebar?: ReactNode;
  header?: {
    title?: string;
    description?: string;
    icon?: ReactNode;
  };
  footer?: ReactNode;
  className?: string;
  mainClassName?: string;
  contentClassName?: string;
  headerClassName?: string;
  footerClassName?: string;
};

const WorkspaceLayout: FC<WorkspaceLayoutProps> = ({
  children,
  sidebar,
  header,
  footer,
  className,
  mainClassName,
  contentClassName,
  headerClassName,
  footerClassName,
}) => {
  return (
    <SidebarProvider className={cn("", className)}>
      {sidebar && <WorkspaceSidebar>{sidebar}</WorkspaceSidebar>}

      <main
        className={cn(
          "flex min-w-0 flex-1 flex-col overflow-y-auto",
          mainClassName,
        )}
      >
        <header
          className={cn(
            "flex items-center gap-3 px-4 py-4 md:px-6",
            headerClassName,
          )}
        >
          {sidebar && <SidebarTrigger variant="outline" />}

          {header && (
            <div className="min-w-0">
              <h1 className="text-lg font-semibold md:text-2xl">
                {header.title}
              </h1>
              <p className="text-muted-foreground text-sm">
                {header.description}
              </p>
            </div>
          )}
        </header>

        <div
          className={cn(
            "flex h-full min-h-0 flex-1 flex-col gap-4 p-4 md:p-6",
            contentClassName,
          )}
        >
          {children}
        </div>

        {footer && (
          <footer className={cn("px-4 py-4 md:px-6", footerClassName)}>
            {footer}
          </footer>
        )}
      </main>
    </SidebarProvider>
  );
};

export default WorkspaceLayout;
