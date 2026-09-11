import { describe, expect, it } from "vitest";

import { createRequestVersion } from "@/lib/async-task";

describe("createRequestVersion", () => {
  it("只允许最新启动的任务提交状态", () => {
    const requests = createRequestVersion();
    const first = requests.start();
    const second = requests.start();

    expect(requests.isCurrent(first)).toBe(false);
    expect(requests.isCurrent(second)).toBe(true);
  });

  it("配置变更后使执行中的任务失效", () => {
    const requests = createRequestVersion();
    const current = requests.start();

    requests.invalidate();

    expect(requests.isCurrent(current)).toBe(false);
  });
});
