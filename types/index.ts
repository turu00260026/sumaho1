export interface StandFmEpisode {
  id: string;
  title: string;
  description: string;
  audioUrl: string;
  publishedAt: string;
  channelId: string;
  channelTitle: string;
  thumbnail?: string;
}

export interface SummaryRecord {
  id: string;
  episodeUrl: string;
  title: string;
  channelTitle: string;
  publishedAt: string;
  thumbnail?: string;
  summary: string;
  savedAt: number;
  source: "listen" | "gemini";
}

export interface ChannelMapping {
  id: string;
  standfmChannelId: string;
  listenRssUrl: string;
  name: string;
  addedAt: number;
}

export interface SummarizeRequest {
  url: string;
  apiKey: string;
  listenRssUrl?: string;
  model?: string;
}

export interface SummarizeResponse {
  title: string;
  channelTitle: string;
  publishedAt: string;
  thumbnail?: string;
  summary: string;
  source: "listen" | "gemini";
}
