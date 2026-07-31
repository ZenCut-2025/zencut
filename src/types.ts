export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  channelTitle: string;
  channelId: string;
  thumbnailUrl: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  publishedAt: string;
  duration?: string;
  url: string;
}

export interface CommentItem {
  id: string;
  authorName: string;
  authorProfileImage?: string;
  text: string;
  likeCount: number;
  publishedAt: string;
  isReply?: boolean;
  replyCount?: number;
  sentiment?: 'positive' | 'neutral' | 'negative';
  tags?: string[];
}

export interface SentimentBreakdown {
  positive: number;
  neutral: number;
  negative: number;
}

export interface KeyTheme {
  theme: string;
  description: string;
  count: number;
  sampleComments: string[];
}

export interface ToxicComment {
  id: string;
  authorName: string;
  text: string;
  reason: string;
}

export interface CommentSummary {
  videoId: string;
  videoTitle: string;
  totalAnalyzedComments: number;
  sentimentBreakdown: SentimentBreakdown;
  keyThemes: KeyTheme[];
  topPraises: string[];
  topComplaints: string[];
  viewerQuestions: string[];
  featureRequests: string[];
  toxicComments: ToxicComment[];
  overallVerdict: string;
  summaryMarkdown: string;
  generatedAt: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  retrievedComments?: CommentItem[];
  sentimentTag?: string;
}

export interface AISettings {
  provider: 'gemini' | 'ollama' | 'openrouter' | 'auto';
  ollamaUrl: string;
  ollamaModel: string;
  openrouterApiKey?: string;
  openrouterModel?: string;
  youtubeApiKey: string;
  useSampleDataFallback: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  plan: 'Free' | 'Creator Pro' | 'Enterprise';
}

export interface ChannelInfo {
  id: string;
  title: string;
  description: string;
  customUrl: string;
  thumbnailUrl: string;
  subscriberCount: number;
  videoCount: number;
  connected: boolean;
}
