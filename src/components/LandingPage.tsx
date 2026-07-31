import React, { useState } from 'react';
import {
  Youtube,
  Sparkles,
  MessageCircle,
  BarChart3,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Zap,
  Play,
  Brain,
  MessageSquare,
  Users,
  Search,
  Lock,
  ThumbsUp,
  Cpu
} from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
  onOpenLogin: () => void;
  onTryDemoVideo: () => void;
  onFetchByUrl?: (url: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onGetStarted,
  onOpenLogin,
  onTryDemoVideo,
  onFetchByUrl
}) => {
  const [activeDemoTab, setActiveDemoTab] = useState<'summary' | 'chat'>('summary');
  const [heroInputUrl, setHeroInputUrl] = useState('');

  const handleHeroSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!heroInputUrl.trim()) {
      onTryDemoVideo();
      return;
    }
    if (onFetchByUrl) {
      onFetchByUrl(heroInputUrl.trim());
    } else {
      onGetStarted();
    }
  };

  return (
    <div className="space-y-20 pb-20">
      
      {/* 🌟 ULTRA PREMIUM HERO HEADER SECTION 🌟 */}
      <section className="relative pt-8 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center space-y-10 overflow-hidden">
        
        {/* Dynamic Glowing Ambient Radial Lights */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-gradient-to-tr from-red-600/20 via-rose-500/10 to-transparent rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-[350px] h-[350px] bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/2 right-1/4 w-[300px] h-[300px] bg-emerald-500/10 rounded-full blur-[110px] pointer-events-none" />

        {/* Main Display Title */}
        <div className="space-y-4 max-w-5xl mx-auto">
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.08]">
            Turn Thousands of <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-rose-400 to-amber-400">
              YouTube Comments
            </span> Into Instant Insights
          </h1>

          <p className="text-slate-300 text-base sm:text-xl max-w-3xl mx-auto leading-relaxed font-normal">
            Stop reading line-by-line. Connect your channel to extract viewer sentiment, top praise, complaints, and chat with comment data in seconds.
          </p>
        </div>

        {/* 🚀 Hero Instant URL Analyzer Input Box */}
        <div className="max-w-2xl mx-auto relative z-10 pt-2">
          <form onSubmit={handleHeroSubmit} className="p-2 rounded-2xl bg-slate-900/90 border border-slate-700/80 shadow-2xl backdrop-blur-xl flex flex-col sm:flex-row gap-2 focus-within:border-red-500/60 transition-all">
            <div className="flex-1 flex items-center gap-3 px-3 py-2">
              <Search className="w-5 h-5 text-red-400 shrink-0" />
              <input
                type="text"
                value={heroInputUrl}
                onChange={(e) => setHeroInputUrl(e.target.value)}
                placeholder="Paste any YouTube Video URL or Video ID..."
                className="w-full bg-transparent text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-600/30 whitespace-nowrap"
            >
              <span>Analyze Comments</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Preset Buttons under URL bar */}
          <div className="pt-3 flex items-center justify-center gap-3 text-xs text-slate-400">
            <span className="text-slate-500">Or try demo video:</span>
            <button
              onClick={onTryDemoVideo}
              className="text-red-400 font-semibold hover:underline flex items-center gap-1"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>React 19 & AI Studio Walkthrough</span>
            </button>
          </div>
        </div>

        {/* Primary CTA Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
          <button
            onClick={onGetStarted}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-500 hover:from-red-500 hover:to-rose-500 text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-3 transition-all shadow-xl shadow-red-600/30 group"
          >
            <Sparkles className="w-5 h-5 text-red-200" />
            <span>Get Started Free</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={onOpenLogin}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-200 font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all backdrop-blur-md"
          >
            <Users className="w-4 h-4 text-slate-400" />
            <span>Sign In to Dashboard</span>
          </button>
        </div>

        {/* Security & Feature Badges Bar */}
        <div className="pt-4 flex flex-wrap items-center justify-center gap-8 text-xs text-slate-400 font-medium border-t border-slate-800/80 max-w-4xl mx-auto">
          <span className="flex items-center gap-2 text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> 100% Safe Google OAuth
          </span>
          <span className="flex items-center gap-2 text-slate-300">

            <Zap className="w-4 h-4 text-amber-400" /> Real-Time Q&A Comment Chat
          </span>
        </div>

        {/* Floating Glassmorphic Hero UI Preview Dashboard Canvas */}
        <div className="pt-6 max-w-5xl mx-auto relative">
          
          <div className="p-1 sm:p-2 rounded-3xl bg-gradient-to-b from-slate-700/50 via-slate-800/20 to-slate-900/80 border border-slate-700/60 shadow-2xl backdrop-blur-xl">
            <div className="bg-slate-950/90 rounded-2xl p-4 sm:p-6 text-left space-y-6 overflow-hidden">
              
              {/* Fake App Window Controls */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
                  <span className="text-xs text-slate-500 pl-2 font-mono">youtube-comment-ai.studio/video/demo</span>
                </div>
                <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Live Analyzed (1,840 Comments)
                </span>
              </div>

              {/* Sample Video Card + Sentiment HUD */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
                
                {/* Left: Video Metadata */}
                <div className="lg:col-span-2 flex items-center gap-4">
                  <div className="relative shrink-0">
                    <img
                      src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=80"
                      alt="Sample Video"
                      className="w-28 h-20 sm:w-36 sm:h-24 rounded-xl object-cover border border-slate-700"
                    />
                    <div className="absolute inset-0 bg-black/30 rounded-xl flex items-center justify-center">
                      <Play className="w-8 h-8 text-white fill-white/80" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="px-2 py-0.5 rounded-md bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-bold">
                      Sample Analysis
                    </span>
                    <p className="text-xs text-slate-400">142,000 views • 1,840 Comments • Creator Studio Pro</p>
                  </div>
                </div>

                {/* Right: Sentiment Pill Bar */}
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-300">Audience Sentiment</span>
                    <span className="text-emerald-400">84% Positive</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden flex">
                    <div className="bg-emerald-500 h-full w-[84%]" title="Positive 84%" />
                    <div className="bg-slate-600 h-full w-[10%]" title="Neutral 10%" />
                    <div className="bg-rose-500 h-full w-[6%]" title="Negative 6%" />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                    <span className="text-emerald-400">84% Positive</span>
                    <span className="text-slate-400">10% Neutral</span>
                    <span className="text-rose-400">6% Complaints</span>
                  </div>
                </div>

              </div>

            </div>
          </div>

        </div>

      </section>

      {/* Product Workflow: 3 Simple Steps */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3">
          <span className="text-xs font-extrabold uppercase tracking-widest text-red-400">How It Works</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Three Steps to Deep Audience Clarity</h2>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">
            From raw YouTube comment threads to structured creator intelligence in seconds.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Step 1 */}
          <div className="bg-slate-900/90 rounded-3xl p-8 border border-slate-800 relative space-y-4 hover:border-red-500/40 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-400 font-bold text-lg flex items-center justify-center border border-red-500/20">
              01
            </div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Youtube className="w-5 h-5 text-red-500" />
              <span>Connect Channel</span>
            </h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              Sign in with Google OAuth to grant read-only YouTube permissions and instantly import your channel’s recent video uploads.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-slate-900/90 rounded-3xl p-8 border border-slate-800 relative space-y-4 hover:border-red-500/40 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 font-bold text-lg flex items-center justify-center border border-indigo-500/20">
              02
            </div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Play className="w-5 h-5 text-indigo-400" />
              <span>Pick Any Video</span>
            </h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              Select a video from your channel or paste any public YouTube URL. The system fetches all top comments and reply threads.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-slate-900/90 rounded-3xl p-8 border border-slate-800 relative space-y-4 hover:border-red-500/40 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 font-bold text-lg flex items-center justify-center border border-emerald-500/20">
              03
            </div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Brain className="w-5 h-5 text-emerald-400" />
              <span>Summary & Q&A Chat</span>
            </h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              Read structured AI summaries, positive/negative breakdowns, and chat directly with comments to answer complex questions.
            </p>
          </div>

        </div>
      </section>

      {/* Interactive Product Feature Showcase / Demo Mockup */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl p-6 sm:p-10 space-y-8 overflow-hidden">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 text-red-400 text-xs font-semibold mb-2">
                <span>Interactive Preview</span>
              </div>
              <h3 className="text-2xl font-bold text-white">Experience AI Comment Intelligence</h3>
            </div>

            {/* Toggle demo view */}
            <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 text-xs">
              <button
                onClick={() => setActiveDemoTab('summary')}
                className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                  activeDemoTab === 'summary'
                    ? 'bg-red-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                AI Summary & Insights
              </button>
              <button
                onClick={() => setActiveDemoTab('chat')}
                className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                  activeDemoTab === 'chat'
                    ? 'bg-red-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Chat with Comments
              </button>
            </div>
          </div>

          {activeDemoTab === 'summary' ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <span className="text-xs font-bold uppercase text-emerald-400">Positive Praise (84%)</span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  "Viewers heavily praised the state management explanation at 08:45 and loved the clean UI layout."
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <span className="text-xs font-bold uppercase text-rose-400">Common Complaint (12%)</span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  "Several comments mentioned the background music was too loud around the 12-minute mark."
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <span className="text-xs font-bold uppercase text-indigo-400">Top Requested Video</span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  "Audience requested a follow-up video showing user authentication and deployment options."
                </p>
              </div>
            </div>
          ) : (
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
              <div className="flex gap-3 items-start">
                <div className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold">User</div>
                <p className="text-xs text-slate-200 pt-1">"What are the top feature requests viewers asked for?"</p>
              </div>
              <div className="flex gap-3 items-start pt-2 border-t border-slate-800">
                <div className="px-3 py-1.5 rounded-xl bg-red-600 text-white text-xs font-bold shrink-0">AI Assistant</div>
                <div className="text-xs text-slate-300 leading-relaxed space-y-1">
                  <p>Based on analyzing 1,840 video comments, the top requested features are:</p>
                  <ul className="list-disc list-inside text-slate-400 pl-1 space-y-1">
                    <li>Authentication walkthrough (305 mentions)</li>
                    <li>Local model setup with Ollama (94 mentions)</li>
                    <li>Docker container deployment tutorial (42 mentions)</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          <div className="pt-4 text-center">
            <button
              onClick={onGetStarted}
              className="inline-flex items-center gap-2 text-red-400 hover:text-red-300 font-bold text-sm"
            >
              <span>Explore Your Own Channel Videos</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      </section>

      {/* Key Feature Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-extrabold text-white">Built for High-Growth Content Creators</h2>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">
            Stop scrolling manually through thousands of comments. Turn viewer feedback into actionable video ideas.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="p-3 rounded-2xl bg-red-500/10 text-red-400 w-fit">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-white text-base">Sentiment Ratios</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Instant breakdown of positive, neutral, and negative viewer sentiment across all comment threads.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 w-fit">
              <MessageCircle className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-white text-base">Grounded Q&A Chat</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Ask any question and receive accurate answers cited directly from real viewer comments.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 w-fit">
              <Sparkles className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-white text-base">Spam & Toxic Filtering</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Automatically flag crypto scams, bot links, and harmful comments for clean channel moderation.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 w-fit">
              <Cpu className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-white text-base">Ollama & Gemini Choice</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Use Gemini 3.6 Flash in the cloud or run 100% private local models with Ollama integration.
            </p>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="max-w-5xl mx-auto px-4">
        <div className="rounded-3xl bg-gradient-to-r from-red-950 via-slate-900 to-slate-900 p-8 sm:p-12 border border-red-500/30 text-center space-y-6 shadow-2xl">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Ready to Unlock Your Audience Intelligence?</h2>
          <p className="text-slate-300 text-sm max-w-xl mx-auto">
            Connect your YouTube channel in seconds or paste any video link to get your first AI comment summary now.
          </p>
          <button
            onClick={onGetStarted}
            className="px-8 py-4 rounded-2xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-bold text-base transition-all shadow-xl shadow-red-600/30"
          >
            Get Started Free
          </button>
        </div>
      </section>

    </div>
  );
};
