"use client";

import { useContext } from "react";

import { DataConverterContext } from "../context";

export function useDataConverterContext() {
  const context = useContext(DataConverterContext);

  if (!context) {
    throw new Error(
      "useDataConverterContext must be used within DataConverterProvider",
    );
  }

  return context;
}
