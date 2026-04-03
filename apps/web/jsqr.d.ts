declare module "jsqr" {
  type InversionMode =
    | "attemptBoth"
    | "dontInvert"
    | "onlyInvert"
    | "invertFirst";

  interface JsQrOptions {
    inversionAttempts?: InversionMode;
  }

  interface JsQrCode {
    binaryData: Uint8ClampedArray;
    data: string;
    chunks: unknown[];
    version: number;
    location: Record<string, { x: number; y: number }>;
  }

  export default function jsQR(
    imageData: Uint8ClampedArray,
    width: number,
    height: number,
    options?: JsQrOptions,
  ): JsQrCode | null;
}
