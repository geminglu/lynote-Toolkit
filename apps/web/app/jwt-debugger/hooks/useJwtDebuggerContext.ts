"use client";

import { useContext } from "react";

import { JwtDebuggerContext } from "../context";

export function useJwtDebuggerContext() {
  const context = useContext(JwtDebuggerContext);

  if (!context) {
    throw new Error(
      "useJwtDebuggerContext must be used within JwtDebuggerProvider",
    );
  }

  return context;
}
