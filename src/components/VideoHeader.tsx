import React from 'react';
import { ArrowLeft, ExternalLink, Eye, ThumbsUp, MessageSquare, BarChart3, MessageCircle, ListFilter } from 'lucide-react';
import { motion } from 'motion/react';
import { YouTubeVideo } from '../types';

interface VideoHeaderProps {
  video: YouTubeVideo;
  activeTab: 'chat' | 'comments';
  onTabChange: (tab: 'chat' | 'comments') => void;
  onBackToSelector: () => void;
  onRefreshComments: () => void;
  onResetSession?: () => void;
  isRefreshing: boolean;
  commentCountText?: number;
}

export const VideoHeader: React.FC<VideoHeaderProps> = ({
  video,
  activeTab,
  onTabChange,
  onBackToSelector,
  onRefreshComments,
  onResetSession,
  isRefreshing,
  commentCountText
}) => {
  return (
    <div className="bg-slate-950 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <button
            onClick={onBackToSelector}
            className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/80 px-4 py-2 text-sm font-semibold text-slate-200 hover:border-red-500 hover:text-white hover:bg-slate-900 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Select Different Video</span>
          </button>

          </div>

        <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
          <div className="space-y-6 md:order-1 md:col-start-1">
            <div className="overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-950 shadow-2xl shadow-black/20">
              <div className="bg-slate-900">
                <img
                  src={video.thumbnailUrl}
                  alt={video.title}
                  className="w-full object-cover"
                  style={{ aspectRatio: '16 / 9' }}
                />
              </div>
              <div className="p-6 space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full bg-red-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-red-300 shadow-sm shadow-red-500/10">
                  <span>{video.channelTitle}</span>
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
                    {video.title}
                  </h1>
                  <p className="mt-2 text-sm text-slate-400">A clean and polished preview of the selected clip, now with better spacing and no overlapping cards.</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-3xl bg-slate-900/90 p-4 border border-slate-800">
                    <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Views</div>
                    <div className="mt-3 text-lg font-semibold text-white">{video.viewCount.toLocaleString()}</div>
                  </div>
                  <div className="rounded-3xl bg-slate-900/90 p-4 border border-slate-800">
                    <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Likes</div>
                    <div className="mt-3 text-lg font-semibold text-white">{video.likeCount.toLocaleString()}</div>
                  </div>
                  <div className="rounded-3xl bg-slate-900/90 p-4 border border-slate-800">
                    <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Analyzed</div>
                    <div className="mt-3 text-lg font-semibold text-red-400">{(commentCountText ?? video.commentCount).toLocaleString()} comments</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6 md:order-2 md:col-start-2">
            <div className="rounded-[2rem] border border-slate-800 bg-slate-950/95 p-6 shadow-xl shadow-black/10 backdrop-blur-xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Video Details</p>
                  <h2 className="mt-3 text-lg font-bold text-white">Quick insights</h2>
                  <p className="mt-2 text-sm text-slate-400">
                    A polished view for your selected clip, with metrics and actions always accessible.
                  </p>
                </div>
                <a
                  href={video.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-300 hover:bg-red-500/15 transition"
                >
                  <span>Watch</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>

              <div className="mt-6 grid gap-3 text-sm text-slate-300">
                <div className="rounded-2xl bg-slate-900/70 p-4 border border-slate-800">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-white">Channel</span>
                    <span className="text-xs uppercase tracking-[0.2em] text-slate-500">Source</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-300">{video.channelTitle}</p>
                </div>
                <div className="rounded-2xl bg-slate-900/70 p-4 border border-slate-800">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-white">Comments analyzed</span>
                    <span className="text-xs uppercase tracking-[0.2em] text-slate-500">Snapshot</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-300">{(commentCountText ?? video.commentCount).toLocaleString()} comments processed for analysis.</p>
                </div>
                <div className="rounded-2xl bg-slate-900/70 p-4 border border-slate-800">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-white">Engagement</span>
                    <span className="text-xs uppercase tracking-[0.2em] text-slate-500">Lifetime</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-300">{video.viewCount.toLocaleString()} views and {video.likeCount.toLocaleString()} likes on this video.</p>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-800 bg-slate-950/95 p-6 shadow-xl shadow-black/10 backdrop-blur-xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Workspace Actions</p>
                  <h3 className="mt-2 text-lg font-bold text-white">Next steps</h3>
                </div>
                <div className="inline-flex items-center gap-2 text-xs text-slate-400">
                  <span className="rounded-full bg-slate-800 px-2 py-1">{activeTab === 'chat' ? 'Chat' : 'Comments'}</span>
                </div>
              </div>

              <div className="mt-5 space-y-3 text-sm text-slate-300">
                <p className="rounded-2xl bg-slate-900/70 p-4 border border-slate-800">
                  Use the tabs below to switch between AI-powered comment chat and full comment list review.
                </p>
                <p className="rounded-2xl bg-slate-900/70 p-4 border border-slate-800">
                  Refresh comments anytime for the latest audience sentiment and keep the analysis in sync with your chosen video.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 border-b border-slate-800 pt-2 relative">
          {[
            { id: 'chat', label: 'Chat with Comments', Icon: MessageCircle },
            { id: 'comments', label: 'All Comments', Icon: ListFilter },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id as 'chat' | 'comments')}
                className={`relative flex items-center gap-2 px-5 py-3 font-semibold text-sm transition-colors rounded-t-2xl ${
                  isActive
                    ? 'text-red-400 font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTabBackground"
                    className="absolute inset-0 bg-red-500/5 rounded-t-2xl"
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  />
                )}
                <tab.Icon className="w-4 h-4 relative z-10" />
                <span className="relative z-10">{tab.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.6)] z-20"
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  />
                )}
              </button>
            );
          })}
        </div>

      </div>
    </div>
  );
};
