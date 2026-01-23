import type { PathDuration, TrackerConfig } from "./types";
import { deleteDurations, getUnsentDurations, savePathDuration } from "./storage";
import { getCurrentPath, getVisitorId } from "./utils";
import { ApiClient } from "./api-client";

type DurationSender = (pathDuration: PathDuration | null) => void;

export class AnalyticsTracker {
  private config: TrackerConfig;
  private apiClient: ApiClient;
  private visitorId: string;
  private currentPath: string | null = null;
  private pathStartTime: number | null = null;
  private currentPageVisitId: string | null = null;
  private isInitialized = false;
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
    sender(pathDuration);
  }

  private sendViaBeacon(pathDuration: PathDuration | null): void {
    if (pathDuration) {
      this.apiClient.sendBeaconPathDurations([pathDuration]);
    }
  }

  private saveToStorage(pathDuration: PathDuration | null): void {
    if (pathDuration) {
      void savePathDuration(pathDuration);
    }
  }

  private startPathTracking(): void {
    const currentPath = getCurrentPath();

    if (this.currentPath && this.currentPath !== currentPath) {
      this.endPathTracking();
    }

    if (!this.currentPath || this.currentPath !== currentPath) {
      this.currentPath = currentPath;
      this.pathStartTime = Date.now();
      this.currentPageVisitId = this.generatePageVisitId();
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
    const durations = await getUnsentDurations(100);

    if (durations.length === 0) {
      return;
    }

    const pathSuccess = await this.apiClient.sendPathDurations(durations);

    if (pathSuccess && durations.length > 0) {
      const ids = durations.map((d) => d.id).filter((id): id is number => id !== undefined);
      await deleteDurations(ids);
    }
  }

  destroy(): void {
    if (this.visibilityChangeHandler) {
      document.removeEventListener("visibilitychange", this.visibilityChangeHandler);
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
    // Note: Not calling flush() here as it's async and unreliable during unload
    // Queued data will be sent on next page load via normal flush() calls
    this.isInitialized = false;
  }
}
