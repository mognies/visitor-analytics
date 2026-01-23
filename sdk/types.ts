export interface PathDuration {
  id?: number;
  path: string;
  duration: number; // in milliseconds
  timestamp: number;
  visitorId: string;
  pageVisitId: string;
}

export interface TrackerConfig {
  apiEndpoint: string;
  apiKey: string;
}
