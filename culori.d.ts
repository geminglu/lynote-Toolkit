declare module "culori" {
  export type CuloriColor = {
    mode?: string;
    r?: number;
    g?: number;
    b?: number;
    alpha?: number;
    h?: number;
    s?: number;
    l?: number;
    w?: number;
    c?: number;
    a?: number;
  };

  export function parse(input: string): CuloriColor | undefined;
  export function clampRgb(
    color: CuloriColor | undefined,
  ): CuloriColor | undefined;
  export function formatHex8(
    color: CuloriColor | undefined,
  ): string | undefined;
  export function converter(
    mode: string,
  ): (
    color: CuloriColor | string | undefined | null,
  ) => CuloriColor | undefined;
}
