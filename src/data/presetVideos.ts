import { YouTubeVideo, CommentItem } from '../types';

export const PRESET_VIDEOS: YouTubeVideo[] = [
  {
    id: 'dQw4w9WgXcQ',
    title: 'Building a Full-Stack AI SaaS in 24 Hours with React & Gemini',
    description: 'Watch me build a production-ready AI application from scratch using modern web tools and Gemini 3.6 API!',
    channelTitle: 'TechCraft Studio',
    channelId: 'UC_tech_craft',
    thumbnailUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80',
    viewCount: 485200,
    likeCount: 32400,
    commentCount: 1840,
    publishedAt: '2026-06-12T14:00:00Z',
    duration: '18:42',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
  },
  {
    id: 'L_LUpnjgPso',
    title: 'M3 Max MacBook Pro Review After 6 Months: Worth the Upgrade?',
    description: 'An honest long-term review of the M3 Max chip for software engineers, video editors, and heavy workflows.',
    channelTitle: 'Hardware Pulse',
    channelId: 'UC_hardware_pulse',
    thumbnailUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80',
    viewCount: 1250000,
    likeCount: 89000,
    commentCount: 4200,
    publishedAt: '2026-05-20T10:30:00Z',
    duration: '14:15',
    url: 'https://www.youtube.com/watch?v=L_LUpnjgPso'
  },
  {
    id: 'fJ9rUzIMcZQ',
    title: 'Ultimate 15-Minute Morning Yoga Flow for Energy & Focus',
    description: 'Gentle, invigorating morning movement designed to wake up your spine and focus your mind for the day ahead.',
    channelTitle: 'Mindful Daily',
    channelId: 'UC_mindful_daily',
    thumbnailUrl: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=800&auto=format&fit=crop&q=80',
    viewCount: 320000,
    likeCount: 24500,
    commentCount: 950,
    publishedAt: '2026-07-01T08:00:00Z',
    duration: '15:00',
    url: 'https://www.youtube.com/watch?v=fJ9rUzIMcZQ'
  }
];

export const PRESET_COMMENTS: Record<string, CommentItem[]> = {
  'dQw4w9WgXcQ': [
    {
      id: 'c101',
      authorName: 'AlexDev99',
      authorProfileImage: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
      text: 'The explanation at 08:45 regarding state management and API routes was crystal clear! Best video on Gemini API so far.',
      likeCount: 412,
      publishedAt: '2026-06-12T15:20:00Z',
      sentiment: 'positive',
      tags: ['Praise', 'Explanation', 'Gemini']
    },
    {
      id: 'c102',
      authorName: 'SarahCode',
      authorProfileImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
      text: 'Audio background music was a bit too loud around the 12-minute mark, made it hard to hear the code walkthrough.',
      likeCount: 189,
      publishedAt: '2026-06-12T16:10:00Z',
      sentiment: 'negative',
      tags: ['Complaint', 'Audio Quality']
    },
    {
      id: 'c103',
      authorName: 'Marcus_V',
      authorProfileImage: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=80',
      text: 'Can you please do a follow-up video showing how to handle authentication and user sessions with Supabase or Firebase?',
      likeCount: 305,
      publishedAt: '2026-06-12T17:45:00Z',
      sentiment: 'neutral',
      tags: ['Feature Request', 'Follow-up']
    },
    {
      id: 'c104',
      authorName: 'PixelCoder',
      authorProfileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
      text: 'Does this setup support local models like Ollama, or is it tied strictly to cloud endpoints?',
      likeCount: 94,
      publishedAt: '2026-06-12T18:02:00Z',
      sentiment: 'neutral',
      tags: ['Question', 'Ollama', 'Local Models']
    },
    {
      id: 'c105',
      authorName: 'CryptoBro99',
      authorProfileImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
      text: 'BUY CRYPTO NOW CHEAP Investment BOT TELEGRAM @crypto_scam_x99 FAST MONEY',
      likeCount: 0,
      publishedAt: '2026-06-12T19:30:00Z',
      sentiment: 'negative',
      tags: ['Spam', 'Toxic/Bot']
    },
    {
      id: 'c106',
      authorName: 'Elena_R',
      authorProfileImage: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&auto=format&fit=crop&q=80',
      text: 'Loved the pacing! No fluff, straight to implementation. Please share the GitHub repo link!',
      likeCount: 152,
      publishedAt: '2026-06-12T20:15:00Z',
      sentiment: 'positive',
      tags: ['Praise', 'Repository']
    },
    {
      id: 'c107',
      authorName: 'DavidK',
      authorProfileImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80',
      text: 'I ran into an error on step 3 with CORS when making serverless requests. Any tips on how to resolve that?',
      likeCount: 45,
      publishedAt: '2026-06-13T01:10:00Z',
      sentiment: 'neutral',
      tags: ['Question', 'Debugging', 'CORS']
    },
    {
      id: 'c108',
      authorName: 'Maya_Design',
      authorProfileImage: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80',
      text: 'The UI components you picked are super clean and accessible. Great job on the typography pairings!',
      likeCount: 98,
      publishedAt: '2026-06-13T04:20:00Z',
      sentiment: 'positive',
      tags: ['Praise', 'UI/UX']
    }
  ]
};
