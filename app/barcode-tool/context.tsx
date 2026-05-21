"use client";

import { createContext, type FC, type PropsWithChildren } from "react";

import type { BarcodeToolContextValue } from "./hooks/useBarcodeTool";
import useBarcodeTool from "./hooks/useBarcodeTool";

export const BarcodeToolContext = createContext<BarcodeToolContextValue | null>(
  null,
);

export const BarcodeToolProvider: FC<PropsWithChildren> = ({ children }) => {
  const value = useBarcodeTool();

  return (
    <BarcodeToolContext.Provider value={value}>
      {children}
    </BarcodeToolContext.Provider>
  );
};
