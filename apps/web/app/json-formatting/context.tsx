import { createContext, type FC, type PropsWithChildren } from "react";
import useJsonFormatting from "./hooks/useJsonFormatting";

import type { JsonFormattingContextValue } from "./hooks/useJsonFormatting";

export const JsonFormattingContext =
  createContext<JsonFormattingContextValue | null>(null);

export const JsonFormattingProvider: FC<PropsWithChildren> = ({ children }) => {
  const value = useJsonFormatting();

  return (
    <JsonFormattingContext.Provider value={value}>
      {children}
    </JsonFormattingContext.Provider>
  );
};
