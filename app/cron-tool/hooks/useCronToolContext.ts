"use client";

import { useContext } from "react";

import { CronToolContext } from "../context";

export function useCronToolContext() {
  const context = useContext(CronToolContext);

  if (!context) {
    throw new Error("useCronToolContext must be used within CronToolProvider");
  }

  return context;
}
