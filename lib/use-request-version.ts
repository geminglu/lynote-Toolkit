"use client";

import { useEffect, useState } from "react";

import { createRequestVersion } from "@/lib/async-task";

/**
 * 为客户端组件持有请求代次，并在卸载时统一使未完成任务失效。
 */
export function useRequestVersion() {
  const [requestVersion] = useState(createRequestVersion);

  useEffect(
    () => () => {
      requestVersion.invalidate();
    },
    [requestVersion],
  );

  return requestVersion;
}
