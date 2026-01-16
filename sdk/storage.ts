import Dexie, { type Table } from "dexie";
import type { PathDuration } from "./types";

class ImmedioDatabase extends Dexie {
  pathDurations!: Table<PathDuration>;

  constructor() {
    super("ImmedioAnalytics");
    this.version(1).stores({
      pathDurations: "++id, path, timestamp, visitorId",
    });
  }
}

export const db = new ImmedioDatabase();

export async function savePathDuration(
  duration: PathDuration,
): Promise<number> {
  return await db.pathDurations.add(duration);
}

export async function getUnsentDurations(limit = 100): Promise<PathDuration[]> {
  return await db.pathDurations.limit(limit).toArray();
}

export async function deleteDurations(ids: number[]): Promise<void> {
  await db.pathDurations.bulkDelete(ids);
}
