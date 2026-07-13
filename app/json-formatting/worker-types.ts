import type { JsonTransformResult } from "./utils";

export interface JsonFormattingWorkerRequest {
  requestId: number;
  value: string;
}

export interface JsonFormattingWorkerResponse extends JsonFormattingWorkerRequest {
  result: JsonTransformResult;
}
