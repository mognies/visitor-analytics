import type {
  BlockDuration,
  PageBlock,
  PathDuration,
  TrackerConfig,
} from "./types";
import {
  deleteBlockDurations,
  deleteDurations,
  getUnsentBlockDurations,
  getUnsentDurations,
  saveBlockDuration,
  savePathDuration,
} from "./storage";
import { getCurrentPath, getVisitorId } from "./utils";
import { ApiClient } from "./api-client";

interface BlockState {
  blockId: PageBlock["id"];
  visibleCount: number;
  visibleStart: number | null;
  path: string;
  pageVisitId: string;
}

type DurationSender = (
  pathDuration: PathDuration | null,
  blockDurations: BlockDuration[],
) => void;

export class AnalyticsTracker {
  private config: TrackerConfig;
  private apiClient: ApiClient;
  private visitorId: string;
  private currentPath: string | null = null;
  private pathStartTime: number | null = null;
  private currentPageVisitId: string | null = null;
  private isInitialized = false;
  private blockObserver: IntersectionObserver | null = null;
  private blockElements = new Map<string, Element[]>();
  private blockStates = new Map<string, BlockState>();
  private elementToBlockKey = new WeakMap<Element, string>();
  private lastBlockFetchPath: string | null = null;
  private visibilityChangeHandler: (() => void) | null = null;
  private beforeUnloadHandler: (() => void) | null = null;
  private popStateHandler: (() => void) | null = null;

  constructor(config: TrackerConfig) {
    this.config = config;
    this.apiClient = new ApiClient(this.config.apiEndpoint, this.config.apiKey);
    this.visitorId = getVisitorId();
  }

  private generatePageVisitId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  async init(): Promise<void> {
    if (this.isInitialized) {
      return;
    }
    await this.setupTracking();
    this.isInitialized = true;
  }

  private async setupTracking(): Promise<void> {
    await this.refreshPageBlocksForPath(getCurrentPath());
    this.startPathTracking();

    this.visibilityChangeHandler = () => {
      if (document.visibilityState === "hidden") {
        this.endTrackingAndSend(this.sendViaBeacon.bind(this));
      } else {
        this.startPathTracking();
      }
    };
    document.addEventListener("visibilitychange", this.visibilityChangeHandler);

    // Note: Only sendBeacon APIs work reliably here - async flush() would be killed by browser
    this.beforeUnloadHandler = () => {
      this.endTrackingAndSend(this.sendViaBeacon.bind(this));
    };
    window.addEventListener("beforeunload", this.beforeUnloadHandler);

    this.popStateHandler = () => {
      this.endTrackingAndSend(this.saveToStorage.bind(this));
      this.startPathTracking();
    };
    window.addEventListener("popstate", this.popStateHandler);
  }

  private endTrackingAndSend(sender: DurationSender): void {
    const pathDuration = this.endPathTracking();
    const blockDurations = this.endBlockTracking();
    sender(pathDuration, blockDurations);
  }

  private sendViaBeacon(
    pathDuration: PathDuration | null,
    blockDurations: BlockDuration[],
  ): void {
    if (pathDuration) {
      this.apiClient.sendBeaconPathDurations([pathDuration]);
    }

    if (blockDurations.length > 0) {
      this.apiClient.sendBeaconBlockDurations(blockDurations);
    }
  }

  private saveToStorage(
    pathDuration: PathDuration | null,
    blockDurations: BlockDuration[],
  ): void {
    if (pathDuration) {
      void savePathDuration(pathDuration);
    }
    if (blockDurations.length > 0) {
      void Promise.all(blockDurations.map((d) => saveBlockDuration(d)));
    }
  }

  private startPathTracking(): void {
    const currentPath = getCurrentPath();

    if (this.currentPath && this.currentPath !== currentPath) {
      this.endPathTracking();
      this.endBlockTracking();
    }

    if (!this.currentPath || this.currentPath !== currentPath) {
      this.currentPath = currentPath;
      this.pathStartTime = Date.now();
      this.currentPageVisitId = this.generatePageVisitId();
      void this.refreshPageBlocksForPath(currentPath);
    }
  }

  private endPathTracking(): PathDuration | null {
    if (!this.currentPath || !this.pathStartTime || !this.currentPageVisitId) {
      return null;
    }

    const duration = Date.now() - this.pathStartTime;
    const path = this.currentPath;
    const startTime = this.pathStartTime;
    const pageVisitId = this.currentPageVisitId;

    this.currentPath = null;
    this.pathStartTime = null;
    this.currentPageVisitId = null;

    if (duration < 1000) {
      return null;
    }

    const pathDuration: PathDuration = {
      path,
      duration,
      timestamp: startTime,
      visitorId: this.visitorId,
      pageVisitId,
    };

    // Note: Don't save here - let the caller decide whether to save to storage or send via beacon
    return pathDuration;
  }

  async flush(): Promise<void> {
    const [durations, blockDurations] = await Promise.all([
      getUnsentDurations(100),
      getUnsentBlockDurations(100),
    ]);

    if (durations.length === 0 && blockDurations.length === 0) {
      return;
    }

    const pathSuccess =
      durations.length === 0
        ? true
        : await this.apiClient.sendPathDurations(durations);
    const blockSuccess =
      blockDurations.length === 0
        ? true
        : await this.apiClient.sendBlockDurations(blockDurations);

    if (pathSuccess && durations.length > 0) {
      const ids = durations
        .map((d) => d.id)
        .filter((id): id is number => id !== undefined);
      await deleteDurations(ids);
    }

    if (blockSuccess && blockDurations.length > 0) {
      const ids = blockDurations
        .map((d) => d.id)
        .filter((id): id is number => id !== undefined);
      await deleteBlockDurations(ids);
    }
  }

  destroy(): void {
    if (this.visibilityChangeHandler) {
      document.removeEventListener(
        "visibilitychange",
        this.visibilityChangeHandler,
      );
      this.visibilityChangeHandler = null;
    }
    if (this.beforeUnloadHandler) {
      window.removeEventListener("beforeunload", this.beforeUnloadHandler);
      this.beforeUnloadHandler = null;
    }
    if (this.popStateHandler) {
      window.removeEventListener("popstate", this.popStateHandler);
      this.popStateHandler = null;
    }

    this.endPathTracking();
    this.endBlockTracking();
    // Note: Not calling flush() here as it's async and unreliable during unload
    // Queued data will be sent on next page load via normal flush() calls
    this.isInitialized = false;
  }

  private async refreshPageBlocksForPath(path: string): Promise<void> {
    this.lastBlockFetchPath = path;
    const requestPath = path;

    const blocks = await this.apiClient.fetchPageBlocks(path);

    // Ignore stale responses - only apply blocks if this is still the latest request
    // This prevents race conditions when navigation changes rapidly
    if (this.lastBlockFetchPath !== requestPath) {
      return;
    }

    this.endBlockTracking();
    if (blocks.length > 0) {
      this.startBlockTracking(blocks);
    }
  }

  private startBlockTracking(pageBlocks: PageBlock[]): void {
    if (
      pageBlocks.length === 0 ||
      typeof IntersectionObserver === "undefined"
    ) {
      return;
    }

    this.endBlockTracking();

    const threshold = 0.1;
    this.blockObserver = new IntersectionObserver(
      (entries) => this.handleBlockIntersect(entries),
      { threshold },
    );

    const currentPath = this.currentPath ?? getCurrentPath();
    const pageVisitId = this.currentPageVisitId ?? this.generatePageVisitId();

    for (const block of pageBlocks) {
      const blockKey = String(block.id);
      const elements = this.resolveBlockElements(block.blockDom);

      if (elements.length === 0) {
        continue;
      }

      this.blockElements.set(blockKey, elements);
      this.blockStates.set(blockKey, {
        blockId: block.id,
        visibleCount: 0,
        visibleStart: null,
        path: currentPath,
        pageVisitId,
      });

      for (const element of elements) {
        this.elementToBlockKey.set(element, blockKey);
        this.blockObserver.observe(element);
      }
    }
  }

  private endBlockTracking(): BlockDuration[] {
    const durations: BlockDuration[] = [];

    if (this.blockObserver) {
      this.blockObserver.disconnect();
      this.blockObserver = null;
    }

    const now = Date.now();
    // Only persist blocks that have an active viewing session (visibleStart is set)
    // This prevents double-counting when a block already had its duration persisted
    // when it became invisible via handleBlockIntersect
    for (const state of this.blockStates.values()) {
      if (state.visibleStart !== null) {
        const duration = this.persistBlockDuration(state, now);
        if (duration) {
          durations.push(duration);
        }
      }
    }

    this.blockStates.clear();
    this.blockElements.clear();
    this.elementToBlockKey = new WeakMap<Element, string>();

    return durations;
  }

  private handleBlockIntersect(entries: IntersectionObserverEntry[]): void {
    for (const entry of entries) {
      const blockKey = this.elementToBlockKey.get(entry.target);
      if (!blockKey) {
        continue;
      }

      const state = this.blockStates.get(blockKey);
      if (!state) {
        continue;
      }

      if (entry.isIntersecting) {
        state.visibleCount += 1;
        if (state.visibleCount === 1) {
          state.visibleStart = Date.now();
        }
      } else if (state.visibleCount > 0) {
        state.visibleCount -= 1;
        if (state.visibleCount === 0) {
          this.persistBlockDuration(state, Date.now());
        }
      }
    }
  }

  private persistBlockDuration(
    state: BlockState,
    now: number,
  ): BlockDuration | null {
    const startTime = state.visibleStart;
    state.visibleStart = null;

    if (!startTime) {
      return null;
    }

    const duration = now - startTime;
    if (duration < 1000) {
      return null;
    }

    const blockDuration: BlockDuration = {
      blockId: state.blockId,
      path: state.path,
      duration,
      timestamp: startTime,
      visitorId: this.visitorId,
      pageVisitId: state.pageVisitId,
    };

    // Note: Don't save here - let the caller decide whether to save to storage or send via beacon
    return blockDuration;
  }

  private resolveBlockElements(blockDom: string): Element[] {
    const normalized = blockDom.trim();
    if (!normalized) {
      return [];
    }

    if (normalized.startsWith("#") || normalized.startsWith(".")) {
      return Array.from(document.querySelectorAll(normalized));
    }

    const byId = document.getElementById(normalized);
    if (byId) {
      return [byId];
    }

    const selector = `.${this.escapeSelector(normalized)}`;
    return Array.from(document.querySelectorAll(selector));
  }

  private escapeSelector(value: string): string {
    if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
      return CSS.escape(value);
    }

    return value.replace(/([ !"#$%&'()*+,./:;<=>?@[\\\]^`{|}~])/g, "\\$1");
  }
}
