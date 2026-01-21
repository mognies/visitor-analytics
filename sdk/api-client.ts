import type { BlockDuration, PageBlock, PathDuration } from "./types";

export class ApiClient {
  private apiEndpoint: string;
  private apiKey: string;

  constructor(apiEndpoint: string, apiKey: string) {
    this.apiEndpoint = apiEndpoint;
    this.apiKey = apiKey;
  }

  async sendPathDurations(durations: PathDuration[]): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiEndpoint}/durations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({ durations }),
      });

      if (!response.ok) {
        console.error(
          `Failed to send path durations: ${response.status} ${response.statusText}`,
        );
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error sending path durations:", error);
      return false;
    }
  }

  sendBeaconPathDurations(durations: PathDuration[]): boolean {
    if (typeof navigator === "undefined" || !navigator.sendBeacon) {
      return false;
    }
    const payload = JSON.stringify({ durations, apiKey: this.apiKey });
    const blob = new Blob([payload], { type: "application/json" });
    return navigator.sendBeacon(`${this.apiEndpoint}/durations`, blob);
  }

  async sendBlockDurations(durations: BlockDuration[]): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiEndpoint}/block-durations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({ durations }),
      });

      if (!response.ok) {
        console.error(
          `Failed to send block durations: ${response.status} ${response.statusText}`,
        );
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error sending block durations:", error);
      return false;
    }
  }

  sendBeaconBlockDurations(durations: BlockDuration[]): boolean {
    if (typeof navigator === "undefined" || !navigator.sendBeacon) {
      return false;
    }
    const payload = JSON.stringify({ durations, apiKey: this.apiKey });
    const blob = new Blob([payload], { type: "application/json" });
    return navigator.sendBeacon(`${this.apiEndpoint}/block-durations`, blob);
  }

  async fetchPageBlocks(path: string): Promise<PageBlock[]> {
    const url = new URL(`${this.apiEndpoint.replace(/\/$/, "")}/page-blocks`);
    url.searchParams.set("path", path);

    try {
      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        console.error(
          `Failed to fetch page blocks: ${response.status} ${response.statusText}`,
        );
        return [];
      }

      const data = await response.json();
      if (!Array.isArray(data)) {
        return [];
      }

      return data as PageBlock[];
    } catch (error) {
      console.error("Error fetching page blocks:", error);
      return [];
    }
  }
}
