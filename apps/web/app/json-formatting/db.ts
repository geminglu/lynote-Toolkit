import Dexie, { type Table } from "dexie";

import type { JsonHistoryRecord } from "./type";

class JsonFormattingDatabase extends Dexie {
  history!: Table<JsonHistoryRecord, string>;

  constructor() {
    super("json-formatting-workspace");

    this.version(1).stores({
      history: "&id, updatedAt, createdAt",
    });
  }
}

export const jsonFormattingDb = new JsonFormattingDatabase();
