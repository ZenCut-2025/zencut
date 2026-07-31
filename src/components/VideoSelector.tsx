import React from 'react';
import { Play, Eye, ThumbsUp, MessageSquare, Zap } from 'lucide-react';
import { YouTubeVideo, ChannelInfo, UserProfile } from '../types';

interface VideoSelectorProps {
  presetVideos: YouTubeVideo[];
  onSelectVideo: (video: YouTubeVideo) => void;
  onFetchByUrl?: (urlOrId: string) => void;
  isLoading: boolean;
  channel: ChannelInfo | null;
  onOpenConnectChannel: () => void;
  user?: UserProfile | null;
  onOpenPricing?: () => void;
}

export const VideoSelector: React.FC<VideoSelectorProps> = ({
  presetVideos,
  onSelectVideo,
  isLoading,
  channel,
  onOpenConnectChannel,
  user,
  onOpenPricing
}) => {
  const isPro = user?.plan === 'Creator Pro' || user?.plan === 'Studio Agency';

  return (
    <div className="space-y-8 max-w-6xl mx-auto px-4 py-8">
      
      {!isPro && onOpenPricing && (
        <div className="p-4 sm:p-5 rounded-2xl border bg-slate-900/90 border-amber-500/30 backdrop-blur-md shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <span className="text-xs font-extrabold uppercase tracking-wider text-amber-400">
                Free Plan Active
              </span>
              <p className="text-xs text-slate-300">
                Your free plan is active. Upgrade to Creator Pro for unlimited analysis and AI chat.
              </p>
            </div>
          </div>

          <button
            onClick={onOpenPricing}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs shrink-0 transition-all shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Zap className="w-4 h-4 fill-current shrink-0" />
            <span>Upgrade to Creator Pro</span>
          </button>
        </div>
      )}

      {/* Hero Banner Section */}
      <div className="relative rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-red-950/40 p-8 sm:p-12 border border-slate-700/60 shadow-2xl overflow-hidden">
        
        {/* Glow effect */}
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Talk to Any <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-rose-300">YouTube Video's</span> Comments
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Select any video below to get an instant structured AI summary, sentiment breakdown, common complaints, and ask grounded Q&A questions.
          </p>
        </div>
      </div>

      {/* Video Selection Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Select a Video to Analyze</h2>
            <p className="text-xs text-slate-400">Pick from recent channel uploads or preset test cases</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {presetVideos.map((video) => (
            <div
              key={video.id}
              onClick={() => onSelectVideo(video)}
              className="group relative bg-slate-900 rounded-2xl border border-slate-800 hover:border-red-500/50 overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-red-500/10 flex flex-col"
            >
              {/* Thumbnail Container */}
              <div className="relative aspect-video w-full overflow-hidden bg-slate-950">
                <img
                  src={video.thumbnailUrl}
                  alt={video.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60" />
                
                {/* Duration Badge */}
                {video.duration && (
                  <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/80 text-white text-[10px] font-mono font-medium">
                    {video.duration}
                  </span>
                )}

                {/* Play Hover Overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                  <div className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg">
                    <Play className="w-6 h-6 fill-white ml-0.5" />
                  </div>
                </div>
              </div>

              {/* Video Info */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-red-400 block">{video.channelTitle}</span>
                  <h3 className="font-bold text-white text-sm line-clamp-2 group-hover:text-red-300 transition-colors leading-snug">
                    {video.title}
                  </h3>
                </div>

                {/* Video Metrics Footer */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5 text-slate-500" />
                      {video.viewCount.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="w-3.5 h-3.5 text-slate-500" />
                      {video.likeCount.toLocaleString()}
                    </span>
                  </div>

                  <span className="flex items-center gap-1 text-red-400 font-medium">
                    <MessageSquare className="w-3.5 h-3.5" />
                    {video.commentCount.toLocaleString()}
                  </span>
                </div>

              </div>

            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
