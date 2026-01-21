export interface PathDuration {
  id?: number;
  path: string;
  duration: number; // in milliseconds
  timestamp: number;
  visitorId: string;
}

export interface PageBlock {
  id: number | string;
  blockName: string;
  blockSummary: string;
  blockDom: string;
}

export interface BlockDuration {
  id?: number;
  blockId: number | string;
  path: string;
  duration: number; // in milliseconds
  timestamp: number;
  visitorId: string;
}

export interface TrackerConfig {
  apiEndpoint: string;
  apiKey: string;
}
