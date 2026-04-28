"use client";

import { useContext } from "react";

import { QrCodeToolContext } from "../context";

export function useQrCodeToolContext() {
  const context = useContext(QrCodeToolContext);

  if (!context) {
    throw new Error(
      "useQrCodeToolContext must be used within QrCodeToolProvider",
    );
  }

  return context;
}
