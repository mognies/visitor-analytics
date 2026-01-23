import { AnalyticsTracker } from "./tracker";
import type { PathDuration, TrackerConfig } from "./types";

export { AnalyticsTracker };
export type { TrackerConfig, PathDuration };

// Global instance for easy access
let globalTracker: AnalyticsTracker | null = null;

export async function init(config: TrackerConfig): Promise<void> {
  if (globalTracker) {
    console.warn("Analytics tracker already initialized");
    return;
  }

  globalTracker = new AnalyticsTracker(config);
  await globalTracker.init();
}

export async function flush(): Promise<void> {
  if (!globalTracker) {
    console.error("Immedio tracker not initialized. Call init() first.");
    return;
  }
  await globalTracker.flush();
}

export function destroy(): void {
  if (globalTracker) {
    globalTracker.destroy();
    globalTracker = null;
  }
}
