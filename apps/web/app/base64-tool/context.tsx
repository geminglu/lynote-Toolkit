"use client";

import { createContext, type FC, type PropsWithChildren } from "react";

import type { Base64ToolContextValue } from "./hooks/useBase64Tool";
import useBase64Tool from "./hooks/useBase64Tool";

export const Base64ToolContext = createContext<Base64ToolContextValue | null>(
  null,
);

export const Base64ToolProvider: FC<PropsWithChildren> = ({ children }) => {
  const value = useBase64Tool();

  return (
    <Base64ToolContext.Provider value={value}>
      {children}
    </Base64ToolContext.Provider>
  );
};
