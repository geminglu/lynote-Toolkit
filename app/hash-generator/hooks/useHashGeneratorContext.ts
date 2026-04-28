"use client";

import { useContext } from "react";

import { HashGeneratorContext } from "../context";

export function useHashGeneratorContext() {
  const context = useContext(HashGeneratorContext);

  if (!context) {
    throw new Error(
      "useHashGeneratorContext must be used within HashGeneratorProvider",
    );
  }

  return context;
}
