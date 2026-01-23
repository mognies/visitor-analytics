import type { PathDuration } from "./types";

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
}
