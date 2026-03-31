"use client";

import { createContext, type FC, type PropsWithChildren } from "react";

import type { ColorConverterContextValue } from "./hooks/useColorConverter";
import useColorConverter from "./hooks/useColorConverter";

export const ColorConverterContext =
  createContext<ColorConverterContextValue | null>(null);

export const ColorConverterProvider: FC<PropsWithChildren> = ({ children }) => {
  const value = useColorConverter();

  return (
    <ColorConverterContext.Provider value={value}>
      {children}
    </ColorConverterContext.Provider>
  );
};
