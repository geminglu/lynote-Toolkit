"use client";

import { createContext, type FC, type PropsWithChildren } from "react";

import type { DataConverterContextValue } from "./hooks/useDataConverter";
import useDataConverter from "./hooks/useDataConverter";

export const DataConverterContext =
  createContext<DataConverterContextValue | null>(null);

export const DataConverterProvider: FC<PropsWithChildren> = ({ children }) => {
  const value = useDataConverter();

  return (
    <DataConverterContext.Provider value={value}>
      {children}
    </DataConverterContext.Provider>
  );
};
