"use client";

import { createContext, type FC, type PropsWithChildren } from "react";

import type { HashGeneratorContextValue } from "./hooks/useHashGenerator";
import useHashGenerator from "./hooks/useHashGenerator";

export const HashGeneratorContext =
  createContext<HashGeneratorContextValue | null>(null);

export const HashGeneratorProvider: FC<PropsWithChildren> = ({ children }) => {
  const value = useHashGenerator();

  return (
    <HashGeneratorContext.Provider value={value}>
      {children}
    </HashGeneratorContext.Provider>
  );
};
