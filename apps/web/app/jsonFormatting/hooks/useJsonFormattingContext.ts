import { useContext } from "react";

import { JsonFormattingContext } from "../context";

export function useJsonFormattingContext() {
  const context = useContext(JsonFormattingContext);

  if (!context) {
    throw new Error(
      "useJsonFormattingContext must be used within JsonFormattingProvider",
    );
  }

  return context;
}
