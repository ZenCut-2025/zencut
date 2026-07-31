import React, { useState, useMemo } from 'react';
import { Search, ThumbsUp, Bookmark, BookmarkCheck, Copy, Check, Filter, MessageSquare, ShieldAlert } from 'lucide-react';
import { CommentItem } from '../types';

interface CommentsExplorerProps {
  comments: CommentItem[];
}

export const CommentsExplorer: React.FC<CommentsExplorerProps> = ({ comments }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sentimentFilter, setSentimentFilter] = useState<'all' | 'positive' | 'neutral' | 'negative' | 'toxic'>('all');
  const [sortBy, setSortBy] = useState<'likes' | 'newest'>('likes');
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const toggleBookmark = (id: string) => {
    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredComments = useMemo(() => {
    return comments
      .filter((c) => {
        const matchesSearch =
          c.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.authorName.toLowerCase().includes(searchTerm.toLowerCase());

        if (!matchesSearch) return false;

        if (sentimentFilter === 'all') return true;
        if (sentimentFilter === 'toxic') {
          return c.text.toLowerCase().includes('bot') || c.text.toLowerCase().includes('crypto') || c.text.toLowerCase().includes('telegram') || c.sentiment === 'negative';
        }
        return c.sentiment === sentimentFilter;
      })
      .sort((a, b) => {
        if (sortBy === 'likes') return b.likeCount - a.likeCount;
        return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
      });
  }, [comments, searchTerm, sentimentFilter, sortBy]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      
      {/* Header & Controls Bar */}
      <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-red-400" />
              <span>All Fetched Comments ({comments.length})</span>
            </h2>
            <p className="text-xs text-slate-400">Search, filter, and save key audience comments</p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'likes' | 'newest')}
              className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-red-500"
            >
              <option value="likes">Most Liked</option>
              <option value="newest">Newest First</option>
            </select>
          </div>
        </div>

        {/* Search & Sentiment Filters */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search comments by keyword or author..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(['all', 'positive', 'neutral', 'negative', 'toxic'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setSentimentFilter(filter)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${
                  sentimentFilter === filter
                    ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                    : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bookmarked Counter Header */}
      {bookmarkedIds.size > 0 && (
        <div className="px-4 py-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold flex items-center justify-between">
          <span>{bookmarkedIds.size} comments saved to your favorite insights list</span>
          <button
            onClick={() => setSentimentFilter('all')}
            className="text-indigo-400 underline hover:text-indigo-200"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Comments List Grid */}
      <div className="space-y-4">
        {filteredComments.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm bg-slate-900 rounded-3xl border border-slate-800">
            No comments found matching your filters.
          </div>
        ) : (
          filteredComments.map((comment) => {
            const isBookmarked = bookmarkedIds.has(comment.id);
            const isCopied = copiedId === comment.id;

            return (
              <div
                key={comment.id}
                className="bg-slate-900 rounded-2xl p-5 border border-slate-800 hover:border-slate-700 transition-all space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {comment.authorProfileImage ? (
                      <img
                        src={comment.authorProfileImage}
                        alt={comment.authorName}
                        className="w-8 h-8 rounded-full object-cover border border-slate-700"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 font-bold text-xs flex items-center justify-center">
                        {comment.authorName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <span className="font-bold text-white text-xs block">@{comment.authorName}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(comment.publishedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Sentiment Tag */}
                    {comment.sentiment && (
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          comment.sentiment === 'positive'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : comment.sentiment === 'negative'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {comment.sentiment}
                      </span>
                    )}

                    {/* Bookmark Button */}
                    <button
                      onClick={() => toggleBookmark(comment.id)}
                      className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
                      title="Save comment"
                    >
                      {isBookmarked ? (
                        <BookmarkCheck className="w-4 h-4 text-indigo-400" />
                      ) : (
                        <Bookmark className="w-4 h-4" />
                      )}
                    </button>

                    {/* Copy Text Button */}
                    <button
                      onClick={() => handleCopyText(comment.id, comment.text)}
                      className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
                      title="Copy comment text"
                    >
                      {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <p className="text-slate-200 text-xs sm:text-sm leading-relaxed">{comment.text}</p>

                <div className="flex items-center justify-between pt-2 text-[11px] text-slate-400 border-t border-slate-800/60">
                  <span className="flex items-center gap-1">
                    <ThumbsUp className="w-3.5 h-3.5 text-slate-500" />
                    {comment.likeCount} likes
                  </span>

                  {comment.tags && comment.tags.length > 0 && (
                    <div className="flex gap-1.5">
                      {comment.tags.map((tag, tIdx) => (
                        <span key={tIdx} className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
