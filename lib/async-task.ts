/**
 * 轻量的最新请求门控器。
 *
 * 浏览器 API 通常无法可靠取消已经开始的计算；代次校验让过期任务
 * 仍可自然结束，但不能把结果、错误或 loading 状态写回当前界面。
 */
export interface RequestVersion {
  start(): number;
  invalidate(): number;
  isCurrent(version: number): boolean;
}

export function createRequestVersion(): RequestVersion {
  let currentVersion = 0;

  return {
    start() {
      currentVersion += 1;
      return currentVersion;
    },
    invalidate() {
      currentVersion += 1;
      return currentVersion;
    },
    isCurrent(version) {
      return version === currentVersion;
    },
  };
}
