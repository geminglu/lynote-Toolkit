"use client";

import { createContext, type FC, type PropsWithChildren } from "react";

import type { RsaToolContextValue } from "./hooks/useRsaTool";
import useRsaTool from "./hooks/useRsaTool";

export const RsaToolContext = createContext<RsaToolContextValue | null>(null);

export const RsaToolProvider: FC<PropsWithChildren> = ({ children }) => {
  const value = useRsaTool();

  return (
    <RsaToolContext.Provider value={value}>{children}</RsaToolContext.Provider>
  );
};
