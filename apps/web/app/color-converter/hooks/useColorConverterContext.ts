"use client";

import { useContext } from "react";

import { ColorConverterContext } from "../context";

export function useColorConverterContext() {
  const context = useContext(ColorConverterContext);

  if (!context) {
    throw new Error(
      "useColorConverterContext must be used within ColorConverterProvider",
    );
  }

  return context;
}
