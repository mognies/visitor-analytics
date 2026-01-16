import type { TrackerConfig, PathDuration } from "./types";
import {
  deleteDurations,
  getUnsentDurations,
  savePathDuration,
} from "./storage";
import { getCurrentPath, getVisitorId } from "./utils";
import { ApiClient } from "./api-client";

export class AnalyticsTracker {
  private config: Required<TrackerConfig>;
  private apiClient: ApiClient;
  private visitorId: string;
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private currentPath: string | null = null;
  private pathStartTime: number | null = null;
  private isInitialized = false;

  constructor(config: TrackerConfig) {
    this.config = {
      flushInterval: 30000, // 30 seconds
      ...config,
    };

    this.apiClient = new ApiClient(this.config.apiEndpoint, this.config.apiKey);
    this.visitorId = getVisitorId();
  }

  async init(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    this.setupTracking();
    this.startFlushTimer();
    this.isInitialized = true;
  }

  private setupTracking(): void {
    // Start tracking current path
    this.startPathTracking();

    // Track page visibility changes
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        this.endPathTracking();
        this.flush();
      } else {
        // Resume tracking when page becomes visible again
        this.startPathTracking();
      }
    });

    // Track before unload
    window.addEventListener("beforeunload", () => {
      this.endPathTracking();
      this.flush();
    });

    // Track popstate (browser back/forward)
    window.addEventListener("popstate", () => {
      this.endPathTracking();
      this.startPathTracking();
    });
  }

  private startPathTracking(): void {
    const currentPath = getCurrentPath();

    // If path changed, end previous tracking
    if (this.currentPath && this.currentPath !== currentPath) {
      this.endPathTracking();
    }

    // Start new tracking only if not already tracking this path
    if (!this.currentPath || this.currentPath !== currentPath) {
      this.currentPath = currentPath;
      this.pathStartTime = Date.now();
    }
  }

  private async endPathTracking(): Promise<void> {
    if (this.currentPath && this.pathStartTime) {
      const duration = Date.now() - this.pathStartTime;

      // Only save if duration is at least 1 second
      if (duration >= 1000) {
        const pathDuration: PathDuration = {
          path: this.currentPath,
          duration,
          timestamp: this.pathStartTime, // Use start time as timestamp
          visitorId: this.visitorId,
        };

        await savePathDuration(pathDuration);
      }

      this.currentPath = null;
      this.pathStartTime = null;
    }
  }

  async flush(): Promise<void> {
    const durations = await getUnsentDurations(100);

    if (durations.length === 0) {
      return;
    }

    const success = await this.apiClient.sendPathDurations(durations);

    if (success && durations.length > 0) {
      const ids = durations
        .map((d) => d.id)
        .filter((id): id is number => id !== undefined);
      await deleteDurations(ids);
    }
  }

  private startFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(async () => {
      // Just flush stored data, don't interrupt current tracking
      await this.flush();
    }, this.config.flushInterval);
  }

  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    this.endPathTracking();
    this.flush();
    this.isInitialized = false;
  }
}
