"use client";

import { createContext, type FC, type PropsWithChildren } from "react";

import useCronTool, { type CronToolContextValue } from "./hooks/useCronTool";

export const CronToolContext = createContext<CronToolContextValue | null>(null);

export const CronToolProvider: FC<PropsWithChildren> = ({ children }) => {
  const value = useCronTool();

  return (
    <CronToolContext.Provider value={value}>
      {children}
    </CronToolContext.Provider>
  );
};
