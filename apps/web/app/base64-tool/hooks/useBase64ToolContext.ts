"use client";

import { useContext } from "react";

import { Base64ToolContext } from "../context";

export function useBase64ToolContext() {
  const context = useContext(Base64ToolContext);

  if (!context) {
    throw new Error(
      "useBase64ToolContext must be used within Base64ToolProvider",
    );
  }

  return context;
}
