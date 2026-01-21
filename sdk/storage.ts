import type { PathDuration, BlockDuration } from "./types";

const DB_NAME = "VisitorAnalytics";
const DB_VERSION = 2;
const PATH_STORE = "pathDurations";
const BLOCK_STORE = "blockDurations";

let dbPromise: Promise<IDBDatabase> | null = null;

function openDatabase(): Promise<IDBDatabase> {
  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create pathDurations store
      if (!db.objectStoreNames.contains(PATH_STORE)) {
        const pathStore = db.createObjectStore(PATH_STORE, {
          keyPath: "id",
          autoIncrement: true,
        });
        pathStore.createIndex("path", "path", { unique: false });
        pathStore.createIndex("timestamp", "timestamp", { unique: false });
        pathStore.createIndex("visitorId", "visitorId", { unique: false });
      }

      // Create blockDurations store
      if (!db.objectStoreNames.contains(BLOCK_STORE)) {
        const blockStore = db.createObjectStore(BLOCK_STORE, {
          keyPath: "id",
          autoIncrement: true,
        });
        blockStore.createIndex("blockId", "blockId", { unique: false });
        blockStore.createIndex("path", "path", { unique: false });
        blockStore.createIndex("timestamp", "timestamp", { unique: false });
        blockStore.createIndex("visitorId", "visitorId", { unique: false });
      }
    };
  });

  return dbPromise;
}

export async function savePathDuration(
  duration: PathDuration,
): Promise<number> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([PATH_STORE], "readwrite");
    const store = transaction.objectStore(PATH_STORE);
    const request = store.add(duration);

    request.onsuccess = () => resolve(request.result as number);
    request.onerror = () => reject(request.error);
  });
}

export async function getUnsentDurations(limit = 100): Promise<PathDuration[]> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([PATH_STORE], "readonly");
    const store = transaction.objectStore(PATH_STORE);
    const request = store.getAll(undefined, limit);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function deleteDurations(ids: number[]): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([PATH_STORE], "readwrite");
    const store = transaction.objectStore(PATH_STORE);

    let completed = 0;
    let hasError = false;

    for (const id of ids) {
      const request = store.delete(id);
      request.onsuccess = () => {
        completed++;
        if (completed === ids.length && !hasError) {
          resolve();
        }
      };
      request.onerror = () => {
        hasError = true;
        reject(request.error);
      };
    }

    if (ids.length === 0) {
      resolve();
    }
  });
}

export async function saveBlockDuration(
  duration: BlockDuration,
): Promise<number> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([BLOCK_STORE], "readwrite");
    const store = transaction.objectStore(BLOCK_STORE);
    const request = store.add(duration);

    request.onsuccess = () => resolve(request.result as number);
    request.onerror = () => reject(request.error);
  });
}

export async function getUnsentBlockDurations(
  limit = 100,
): Promise<BlockDuration[]> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([BLOCK_STORE], "readonly");
    const store = transaction.objectStore(BLOCK_STORE);
    const request = store.getAll(undefined, limit);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function deleteBlockDurations(ids: number[]): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([BLOCK_STORE], "readwrite");
    const store = transaction.objectStore(BLOCK_STORE);

    let completed = 0;
    let hasError = false;

    for (const id of ids) {
      const request = store.delete(id);
      request.onsuccess = () => {
        completed++;
        if (completed === ids.length && !hasError) {
          resolve();
        }
      };
      request.onerror = () => {
        hasError = true;
        reject(request.error);
      };
    }

    if (ids.length === 0) {
      resolve();
    }
  });
}
