"use client";

import { useContext } from "react";

import { RsaToolContext } from "../context";

/**
 * 读取 RSA 工具上下文
 */
export function useRsaToolContext() {
  const context = useContext(RsaToolContext);

  if (!context) {
    throw new Error("useRsaToolContext must be used within RsaToolProvider");
  }

  return context;
}
