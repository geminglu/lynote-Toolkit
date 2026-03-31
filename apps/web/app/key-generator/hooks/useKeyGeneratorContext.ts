"use client";

import { useContext } from "react";

import { KeyGeneratorContext } from "../context";

export function useKeyGeneratorContext() {
  const context = useContext(KeyGeneratorContext);

  if (!context) {
    throw new Error(
      "useKeyGeneratorContext must be used within KeyGeneratorProvider",
    );
  }

  return context;
}
