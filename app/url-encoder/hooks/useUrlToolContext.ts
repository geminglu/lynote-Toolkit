"use client";

import { useContext } from "react";

import { UrlToolContext } from "../context";

export function useUrlToolContext() {
  const context = useContext(UrlToolContext);

  if (!context) {
    throw new Error("useUrlToolContext must be used within UrlToolProvider");
  }

  return context;
}
