export type EditorSide = "left" | "right";

export interface JsonHistoryRecord {
  id: string;
  title: string;
  leftValue: string;
  rightValue: string;
  createdAt: number;
  updatedAt: number;
}
