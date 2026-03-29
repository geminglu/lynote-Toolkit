"use client";

import { createContext, type FC, type PropsWithChildren } from "react";

import type { KeyGeneratorContextValue } from "./hooks/useKeyGenerator";
import useKeyGenerator from "./hooks/useKeyGenerator";

export const KeyGeneratorContext =
  createContext<KeyGeneratorContextValue | null>(null);

export const KeyGeneratorProvider: FC<PropsWithChildren> = ({ children }) => {
  const value = useKeyGenerator();

  return (
    <KeyGeneratorContext.Provider value={value}>
      {children}
    </KeyGeneratorContext.Provider>
  );
};
