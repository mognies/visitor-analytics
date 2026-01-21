import Dexie, { type Table } from "dexie";
import type { PathDuration, BlockDuration } from "./types";

class AnalyticsDatabase extends Dexie {
  pathDurations!: Table<PathDuration>;
  blockDurations!: Table<BlockDuration>;

  constructor() {
    super("VisitorAnalytics");
    this.version(1).stores({
      pathDurations: "++id, path, timestamp, visitorId",
    });
    this.version(2).stores({
      pathDurations: "++id, path, timestamp, visitorId",
      blockDurations: "++id, blockId, path, timestamp, visitorId",
    });
  }
}

export const db = new AnalyticsDatabase();

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

export async function saveBlockDuration(
  duration: BlockDuration,
): Promise<number> {
  return await db.blockDurations.add(duration);
}

export async function getUnsentBlockDurations(
  limit = 100,
): Promise<BlockDuration[]> {
  return await db.blockDurations.limit(limit).toArray();
}

export async function deleteBlockDurations(ids: number[]): Promise<void> {
  await db.blockDurations.bulkDelete(ids);
}
