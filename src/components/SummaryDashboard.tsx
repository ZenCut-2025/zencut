import React, { useState } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';
import {
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  HelpCircle,
  Lightbulb,
  ShieldAlert,
  Copy,
  Check,
  FileText,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  MessageSquareQuote
} from 'lucide-react';
import { CommentSummary } from '../types';

interface SummaryDashboardProps {
  summary: CommentSummary;
  onNavigateToChat: () => void;
  engineUsed?: string;
}

export const SummaryDashboard: React.FC<SummaryDashboardProps> = ({
  summary,
  onNavigateToChat,
  engineUsed
}) => {
  const [copied, setCopied] = useState(false);
  const [expandedTheme, setExpandedTheme] = useState<number | null>(0);

  const sentimentData = [
    { name: 'Positive', value: summary.sentimentBreakdown.positive, color: '#22c55e' },
    { name: 'Neutral', value: summary.sentimentBreakdown.neutral, color: '#94a3b8' },
    { name: 'Negative', value: summary.sentimentBreakdown.negative, color: '#ef4444' },
  ];

  const handleCopyMarkdown = () => {
    const content = `# YouTube Comment Summary Report
**Video Title:** ${summary.videoTitle}
**Total Analyzed Comments:** ${summary.totalAnalyzedComments}
**Sentiment:** ${summary.sentimentBreakdown.positive}% Positive | ${summary.sentimentBreakdown.neutral}% Neutral | ${summary.sentimentBreakdown.negative}% Negative

## Overall Audience Verdict
${summary.overallVerdict}

## Key Themes
${summary.keyThemes.map(t => `- **${t.theme}**: ${t.description}`).join('\n')}

## Top Praises
${summary.topPraises.map(p => `- ${p}`).join('\n')}

## Top Complaints
${summary.topComplaints.map(c => `- ${c}`).join('\n')}

## Viewer Questions
${summary.viewerQuestions.map(q => `- ${q}`).join('\n')}

## Feature & Content Requests
${summary.featureRequests.map(r => `- ${r}`).join('\n')}
`;
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Banner & Verdict */}
      <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-red-600 to-red-500 text-white shadow-lg shadow-red-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">AI Audience Executive Summary</h2>
              <p className="text-xs text-slate-400">
                Generated from {summary.totalAnalyzedComments} comments using{' '}
                <span className="text-emerald-400 font-semibold">{engineUsed || 'Gemini 3.6 Flash'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleCopyMarkdown}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
              <span>{copied ? 'Copied Report' : 'Copy Markdown'}</span>
            </button>
          </div>
        </div>

        {/* Executive Verdict Quote Box */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 relative overflow-hidden">
          <div className="absolute top-3 right-4 text-slate-800 pointer-events-none">
            <MessageSquareQuote className="w-16 h-16 opacity-30" />
          </div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-red-400 mb-2">Overall Audience Verdict</h3>
          <p className="text-slate-200 text-base sm:text-lg font-medium leading-relaxed relative z-10">
            "{summary.overallVerdict}"
          </p>
        </div>
      </div>

      {/* Grid: Sentiment Analytics & Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Sentiment Distribution Pie Chart */}
        <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>Sentiment Breakdown</span>
            </h3>
            <span className="text-xs text-slate-400">{summary.totalAnalyzedComments} comments</span>
          </div>

          <div className="h-48 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sentimentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {sentimentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc' }}
                  formatter={(val: number) => [`${val}%`, 'Audience Ratio']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-slate-800">
            <div className="bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
              <span className="text-xs text-emerald-400 font-medium block">Positive</span>
              <span className="text-lg font-bold text-emerald-300">{summary.sentimentBreakdown.positive}%</span>
            </div>
            <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
              <span className="text-xs text-slate-400 font-medium block">Neutral</span>
              <span className="text-lg font-bold text-slate-200">{summary.sentimentBreakdown.neutral}%</span>
            </div>
            <div className="bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20">
              <span className="text-xs text-rose-400 font-medium block">Negative</span>
              <span className="text-lg font-bold text-rose-300">{summary.sentimentBreakdown.negative}%</span>
            </div>
          </div>
        </div>

        {/* Top Praises Box */}
        <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-base">
            <div className="p-2 rounded-xl bg-emerald-500/10">
              <ThumbsUp className="w-5 h-5" />
            </div>
            <span>Top Praises & Highlights</span>
          </div>

          <ul className="space-y-3 text-sm text-slate-300">
            {summary.topPraises.slice(0, 4).map((praise, idx) => (
              <li key={idx} className="flex items-start gap-2.5 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                <span className="w-2 h-2 rounded-full bg-emerald-400 mt-2 shrink-0" />
                <span className="leading-snug">{praise}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Top Complaints Box */}
        <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 text-rose-400 font-bold text-base">
            <div className="p-2 rounded-xl bg-rose-500/10">
              <ThumbsDown className="w-5 h-5" />
            </div>
            <span>Common Complaints</span>
          </div>

          <ul className="space-y-3 text-sm text-slate-300">
            {summary.topComplaints.slice(0, 4).map((complaint, idx) => (
              <li key={idx} className="flex items-start gap-2.5 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                <span className="w-2 h-2 rounded-full bg-rose-400 mt-2 shrink-0" />
                <span className="leading-snug">{complaint}</span>
              </li>
            ))}
          </ul>
        </div>

      </div>

      {/* Key Themes Accordion Section */}
      <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <FileText className="w-5 h-5 text-red-400" />
          <span>Core Discussion Themes</span>
        </h3>

        <div className="space-y-3">
          {summary.keyThemes.map((theme, idx) => {
            const isExpanded = expandedTheme === idx;
            return (
              <div
                key={idx}
                className="bg-slate-950/70 rounded-2xl border border-slate-800 overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setExpandedTheme(isExpanded ? null : idx)}
                  className="w-full p-4 text-left flex items-center justify-between gap-4 hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-red-500/10 text-red-400 font-bold text-xs flex items-center justify-center border border-red-500/20 shrink-0">
                      #{idx + 1}
                    </span>
                    <div>
                      <h4 className="font-bold text-white text-sm sm:text-base">{theme.theme}</h4>
                      <p className="text-xs text-slate-400 line-clamp-1">{theme.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 rounded-full bg-slate-800 text-xs text-slate-300 font-medium">
                      ~{theme.count}% of comments
                    </span>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="p-4 pt-2 border-t border-slate-800/60 bg-slate-900/50 space-y-3 text-xs text-slate-300">
                    <p className="text-slate-300 leading-relaxed">{theme.description}</p>
                    
                    {theme.sampleComments && theme.sampleComments.length > 0 && (
                      <div className="space-y-2 pt-2">
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Sample Viewer Quotes:</span>
                        {theme.sampleComments.map((sample, sIdx) => (
                          <div key={sIdx} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 italic">
                            "{sample}"
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Feature Requests & Questions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Feature & Video Ideas */}
        <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-base">
            <div className="p-2 rounded-xl bg-indigo-500/10">
              <Lightbulb className="w-5 h-5" />
            </div>
            <span>Requested Topics & Features</span>
          </div>

          <ul className="space-y-2.5 text-xs sm:text-sm text-slate-300">
            {summary.featureRequests.map((req, idx) => (
              <li key={idx} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start gap-2.5">
                <span className="text-indigo-400 font-bold shrink-0">💡</span>
                <span>{req}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Viewer Questions */}
        <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-base">
            <div className="p-2 rounded-xl bg-amber-500/10">
              <HelpCircle className="w-5 h-5" />
            </div>
            <span>Top Viewer Questions</span>
          </div>

          <ul className="space-y-2.5 text-xs sm:text-sm text-slate-300">
            {summary.viewerQuestions.map((q, idx) => (
              <li key={idx} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start gap-2.5">
                <span className="text-amber-400 font-bold shrink-0">❓</span>
                <span>{q}</span>
              </li>
            ))}
          </ul>
        </div>

      </div>

      {/* Moderation / Toxic Comments Flag Drawer */}
      {summary.toxicComments && summary.toxicComments.length > 0 && (
        <div className="bg-slate-900 rounded-3xl p-6 border border-rose-900/50 space-y-4">
          <div className="flex items-center gap-2 text-rose-400 font-bold text-base">
            <div className="p-2 rounded-xl bg-rose-500/10">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <span>Flagged Spam / Toxic Comments ({summary.toxicComments.length})</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {summary.toxicComments.map((toxic, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/20 space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold text-rose-300">
                  <span>@{toxic.authorName}</span>
                  <span className="px-2 py-0.5 rounded bg-rose-500/20 text-[10px] text-rose-400 uppercase">{toxic.reason}</span>
                </div>
                <p className="text-xs text-slate-300 italic">"{toxic.text}"</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Prompt Chat CTA */}
      <div className="bg-gradient-to-r from-red-950/50 via-slate-900 to-slate-900 rounded-3xl p-8 border border-red-500/30 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-white">Have Specific Questions About These Comments?</h3>
          <p className="text-slate-300 text-sm">
            Launch the AI Comment Q&A chat to ask follow-up questions like "Find people complaining about the intro" or "Extract feature requests".
          </p>
        </div>
        <button
          onClick={onNavigateToChat}
          className="px-6 py-3.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm shrink-0 transition-all shadow-lg shadow-red-600/30"
        >
          Open Q&A Chat
        </button>
      </div>

    </div>
  );
};
