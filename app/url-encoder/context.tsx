"use client";

import { createContext, type FC, type PropsWithChildren } from "react";

import type { UrlToolContextValue } from "./hooks/useUrlTool";
import useUrlTool from "./hooks/useUrlTool";

export const UrlToolContext = createContext<UrlToolContextValue | null>(null);

export const UrlToolProvider: FC<PropsWithChildren> = ({ children }) => {
  const value = useUrlTool();

  return (
    <UrlToolContext.Provider value={value}>{children}</UrlToolContext.Provider>
  );
};
