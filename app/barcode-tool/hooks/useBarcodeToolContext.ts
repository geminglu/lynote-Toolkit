"use client";

import { useContext } from "react";

import { BarcodeToolContext } from "../context";

export function useBarcodeToolContext() {
  const context = useContext(BarcodeToolContext);

  if (!context) {
    throw new Error(
      "useBarcodeToolContext must be used within BarcodeToolProvider",
    );
  }

  return context;
}
