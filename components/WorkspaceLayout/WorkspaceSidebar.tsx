"use client";

import { Sidebar, SidebarContent } from "lynote-ui/sidebar";
import type { FC, ReactNode } from "react";

export type WorkspaceSidebarProps = {
  children: ReactNode;
};

const WorkspaceSidebar: FC<WorkspaceSidebarProps> = ({ children }) => {
  return (
    <Sidebar>
      <SidebarContent>{children}</SidebarContent>
    </Sidebar>
  );
};

export default WorkspaceSidebar;
