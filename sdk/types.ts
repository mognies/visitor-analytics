export interface PathDuration {
  id?: number;
  path: string;
  duration: number; // in milliseconds
  timestamp: number;
  visitorId: string;
}

export interface ImmedioConfig {
  apiEndpoint: string;
  apiKey: string;
  flushInterval?: number; // in milliseconds
}
