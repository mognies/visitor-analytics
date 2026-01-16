import { ImmedioTracker } from "./tracker";
import type { ImmedioConfig, PathDuration } from "./types";

export { ImmedioTracker };
export type { ImmedioConfig, PathDuration };

// Global instance for easy access
let globalTracker: ImmedioTracker | null = null;

export async function init(config: ImmedioConfig): Promise<void> {
  if (globalTracker) {
    console.warn("Immedio tracker already initialized");
    return;
  }

  globalTracker = new ImmedioTracker(config);
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
