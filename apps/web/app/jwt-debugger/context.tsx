"use client";

import { createContext, type FC, type PropsWithChildren } from "react";

import type { JwtDebuggerContextValue } from "./hooks/useJwtDebugger";
import useJwtDebugger from "./hooks/useJwtDebugger";

export const JwtDebuggerContext = createContext<JwtDebuggerContextValue | null>(
  null,
);

export const JwtDebuggerProvider: FC<PropsWithChildren> = ({ children }) => {
  const value = useJwtDebugger();

  return (
    <JwtDebuggerContext.Provider value={value}>
      {children}
    </JwtDebuggerContext.Provider>
  );
};
