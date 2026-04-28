"use client";

import { createContext, type FC, type PropsWithChildren } from "react";

import type { QrCodeToolContextValue } from "./hooks/useQrCodeTool";
import useQrCodeTool from "./hooks/useQrCodeTool";

export const QrCodeToolContext = createContext<QrCodeToolContextValue | null>(
  null,
);

export const QrCodeToolProvider: FC<PropsWithChildren> = ({ children }) => {
  const value = useQrCodeTool();

  return (
    <QrCodeToolContext.Provider value={value}>
      {children}
    </QrCodeToolContext.Provider>
  );
};
