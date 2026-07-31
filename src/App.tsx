import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { VideoSelector } from './components/VideoSelector';
import { VideoHeader } from './components/VideoHeader';
import { SummaryDashboard } from './components/SummaryDashboard';
import { CommentChat } from './components/CommentChat';
import { CommentsExplorer } from './components/CommentsExplorer';
import { SettingsModal } from './components/SettingsModal';
import { ConnectChannelModal } from './components/ConnectChannelModal';
import { AuthModal } from './components/AuthModal';
import { PricingModal } from './components/PricingModal';
import { Zap, AlertCircle } from 'lucide-react';

import { PRESET_VIDEOS, PRESET_COMMENTS } from './data/presetVideos';
import { YouTubeVideo, CommentItem, CommentSummary, ChatMessage, AISettings, ChannelInfo, UserProfile } from './types';
import { clearFreePlanSession, isPaidPlan } from './utils/freePlan';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('yt_studio_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [currentView, setCurrentView] = useState<'landing' | 'dashboard' | 'analysis'>(() => {
    try {
      const savedUser = localStorage.getItem('yt_studio_user');
      if (savedUser) {
        const savedView = localStorage.getItem('yt_studio_view');
        if (savedView === 'dashboard' || savedView === 'analysis') {
          return savedView;
        }
        return 'dashboard';
      }
    } catch {
      // ignore
    }
    return 'landing';
  });

  const changeView = (view: 'landing' | 'dashboard' | 'analysis') => {
    setCurrentView(view);
    if (localStorage.getItem('yt_studio_user')) {
      localStorage.setItem('yt_studio_view', view);
    }
  };

  const startStripeCheckout = async (
    planId: string,
    billingCycle: 'pass' | 'monthly',
    userEmail?: string,
    checkoutTab?: Window | null
  ) => {
    const newTab = checkoutTab || window.open('about:blank', '_blank');

    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: `${planId}_${billingCycle}`,
          billingInterval: billingCycle,
          userEmail: userEmail || user?.email,
          redirectUrl: window.location.href
        })
      });

      const data = await response.json();
      if (!response.ok || !data.url) {
        throw new Error(data.error || 'Failed to create Stripe checkout session.');
      }

      if (newTab && !newTab.closed) {
        newTab.location.href = data.url;
      } else {
        const opened = window.open(data.url, '_blank');
        if (!opened) window.location.href = data.url;
      }
    } catch (err: any) {
      if (newTab && !newTab.closed) newTab.close();
      setPaymentNotification({
        type: 'info',
        text: err?.message || 'Unable to start checkout. Please try again.'
      });
    }
  };

  const handleRequireLoginForCheckout = (planId: string, billingCycle: 'pass' | 'monthly') => {
    setPendingCheckout({ planId, billingCycle });
    setIsPricingModalOpen(false);
    setIsAuthModalOpen(true);
  };

  const handleLoginSuccess = async (loggedInUser: UserProfile) => {
    setUser(loggedInUser);
    localStorage.setItem('yt_studio_user', JSON.stringify(loggedInUser));
    localStorage.setItem('yt_studio_view', 'dashboard');
    setCurrentView('dashboard');

    if (pendingCheckout) {
      const { planId, billingCycle } = pendingCheckout;
      setPendingCheckout(null);
      setIsPricingModalOpen(false);
      await startStripeCheckout(planId, billingCycle, loggedInUser.email);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('yt_studio_user');
    localStorage.removeItem('yt_studio_view');
    localStorage.removeItem('yt_studio_selected_video');
    localStorage.removeItem('yt_studio_comments');
    localStorage.removeItem('yt_studio_summary');
    localStorage.removeItem('yt_studio_chat_messages');
    localStorage.removeItem('yt_studio_channel');
    setUser(null);
    setSelectedVideo(null);
    setComments([]);
    setSummary(null);
    setChatMessages([]);
    setChannel(null);
    setCurrentView('landing');
  };

  const handlePlanUpgrade = (planName: string, successText?: string) => {
    const upgradedUser: UserProfile = user
      ? { ...user, plan: planName }
      : {
          id: `u_${Date.now()}`,
          name: 'Creator Pro User',
          email: 'creator@example.com',
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          plan: planName
        };

    setUser(upgradedUser);
    localStorage.setItem('yt_studio_user', JSON.stringify(upgradedUser));
    clearFreePlanSession(upgradedUser.id);
    setFreeSessionStart(null);
    setIsPricingModalOpen(false);
    setPaymentNotification({
      type: 'success',
      text: successText || `🎉 Welcome to ${planName}! Your subscription is active.`
    });
  };

  const [presetVideos, setPresetVideos] = useState<YouTubeVideo[]>(() => {
    try {
      const saved = localStorage.getItem('yt_studio_preset_videos');
      return saved ? JSON.parse(saved) : PRESET_VIDEOS;
    } catch {
      return PRESET_VIDEOS;
    }
  });

  const [selectedVideo, setSelectedVideo] = useState<YouTubeVideo | null>(() => {
    try {
      const saved = localStorage.getItem('yt_studio_selected_video');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [comments, setComments] = useState<CommentItem[]>(() => {
    try {
      const saved = localStorage.getItem('yt_studio_comments');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [summary, setSummary] = useState<CommentSummary | null>(() => {
    try {
      const saved = localStorage.getItem('yt_studio_summary');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('yt_studio_chat_messages');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [channel, setChannel] = useState<ChannelInfo | null>(() => {
    try {
      const saved = localStorage.getItem('yt_studio_channel');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Sync state changes to localStorage
  useEffect(() => {
    if (selectedVideo) {
      localStorage.setItem('yt_studio_selected_video', JSON.stringify(selectedVideo));
    } else {
      localStorage.removeItem('yt_studio_selected_video');
    }
  }, [selectedVideo]);

  useEffect(() => {
    if (comments.length > 0) {
      localStorage.setItem('yt_studio_comments', JSON.stringify(comments));
    } else {
      localStorage.removeItem('yt_studio_comments');
    }
  }, [comments]);

  useEffect(() => {
    if (summary) {
      localStorage.setItem('yt_studio_summary', JSON.stringify(summary));
    } else {
      localStorage.removeItem('yt_studio_summary');
    }
  }, [summary]);

  useEffect(() => {
    if (chatMessages.length > 0) {
      localStorage.setItem('yt_studio_chat_messages', JSON.stringify(chatMessages));
    } else {
      localStorage.removeItem('yt_studio_chat_messages');
    }
  }, [chatMessages]);

  useEffect(() => {
    if (channel) {
      localStorage.setItem('yt_studio_channel', JSON.stringify(channel));
    } else {
      localStorage.removeItem('yt_studio_channel');
    }
  }, [channel]);

  useEffect(() => {
    if (presetVideos && presetVideos.length > 0) {
      localStorage.setItem('yt_studio_preset_videos', JSON.stringify(presetVideos));
    }
  }, [presetVideos]);
  
  const [activeTab, setActiveTab] = useState<'chat' | 'comments'>('chat');
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [isSendingChat, setIsSendingChat] = useState(false);

  const [settings, setSettings] = useState<AISettings>(() => {
    try {
      const saved = localStorage.getItem('yt_studio_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...parsed,
          provider: parsed.provider || 'openrouter',
          openrouterModel: parsed.openrouterModel || 'meta-llama/llama-3.1-8b-instruct'
        };
      }
    } catch {
      // ignore
    }
    return {
      provider: 'openrouter',
      ollamaUrl: 'http://localhost:11434',
      ollamaModel: 'llama3.2',
      openrouterApiKey: '',
      openrouterModel: 'meta-llama/llama-3.1-8b-instruct',
      youtubeApiKey: '',
      useSampleDataFallback: true
    };
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isChannelModalOpen, setIsChannelModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [pendingCheckout, setPendingCheckout] = useState<{ planId: string; billingCycle: 'pass' | 'monthly' } | null>(null);
  const [paymentNotification, setPaymentNotification] = useState<{ type: 'success' | 'info'; text: string } | null>(null);
  const [engineUsed, setEngineUsed] = useState<string>('Gemini 3.6 Flash');


  const isProUser = isPaidPlan(user?.plan);
  const isFreePlanExpired = false;

  // Handle Stripe Payment Redirect Callbacks
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get('payment');
    const planParam = params.get('plan') || 'pro';
    const sessionId = params.get('session_id');

    if (paymentStatus === 'success') {
      const planName = planParam === 'agency' ? 'Studio Agency' : 'Creator Pro';
      handlePlanUpgrade(planName, sessionId
        ? `🎉 Stripe Payment Confirmed! Your plan is now upgraded to ${planName}.`
        : `🎉 Welcome to ${planName}! Your subscription is active.`);

      if (sessionId) {
        fetch(`/api/stripe/verify-session?sessionId=${sessionId}`)
          .then((res) => res.json())
          .then((data) => {
            if (data.verified) {
              setPaymentNotification({
                type: 'success',
                text: `🎉 Stripe Payment Confirmed! Your plan is now upgraded to ${planName}.`
              });
            }
          })
          .catch(() => {
            setPaymentNotification({
              type: 'success',
              text: `🎉 Welcome to ${planName}! Your subscription is active.`
            });
          });
      }

      // Clean search parameters from URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (paymentStatus === 'cancelled') {
      setPaymentNotification({
        type: 'info',
        text: 'Checkout was cancelled. You can upgrade to Pro anytime!'
      });
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Automatically fetch channel videos when user logs in, channel connects, or API key is updated
  const loadChannelVideos = async () => {
    try {
      const res = await fetch('/api/youtube/channel-videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken: user?.accessToken,
          apiKey: settings.youtubeApiKey,
          channelId: channel?.id
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.channel) {
          setChannel(data.channel);
        }
        if (data.videos && data.videos.length > 0) {
          setPresetVideos(data.videos);
        }
      }
    } catch (err) {
      console.error('Failed to load channel videos:', err);
    }
  };

  useEffect(() => {
    if (channel?.connected || user?.accessToken || settings.youtubeApiKey) {
      loadChannelVideos();
    }
  }, [channel?.connected, user?.accessToken, settings.youtubeApiKey]);

  // Handle Video Selection
  const handleSelectVideo = async (video: YouTubeVideo) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    // Allow selecting videos even if free trial expired; AI features will be gated later.
    setSelectedVideo(video);
    changeView('analysis');
    setIsLoadingVideo(true);
    setSummary(null);
    setChatMessages([]);

    try {
      // 1. Fetch Comments
      let fetchedComments: CommentItem[] = [];
      const res = await fetch('/api/youtube/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId: video.id,
          apiKey: settings.youtubeApiKey
        })
      });

      if (res.ok) {
        const data = await res.json();
        fetchedComments = data.comments || [];
      }

      // If no comments returned from backend, use preset comments if available
      if (fetchedComments.length === 0 && PRESET_COMMENTS[video.id]) {
        fetchedComments = PRESET_COMMENTS[video.id];
      }

      setComments(fetchedComments);

      // 2. Automatically generate AI Summary (only if trial not expired)
      if (fetchedComments.length > 0) {
        if (!isFreePlanExpired) {
          await generateSummaryForVideo(video, fetchedComments);
        } else {
          // Provide a graceful message in the summary slot indicating limited access
          setSummary({
            videoId: video.id,
            videoTitle: video.title,
            totalAnalyzedComments: fetchedComments.length,
            sentimentBreakdown: { positive: 0, neutral: 0, negative: 0 },
            keyThemes: [],
            topPraises: [],
            topComplaints: [],
            viewerQuestions: [],
            featureRequests: [],
            toxicComments: [],
            overallVerdict: 'Free trial expired. Upgrade to Creator Pro to generate AI summaries.',
            summaryMarkdown: '',
            generatedAt: Date.now()
          });
        }
      }
    } catch (err) {
      console.error('Error fetching comments/summary:', err);
      if (PRESET_COMMENTS[video.id]) {
        const fallback = PRESET_COMMENTS[video.id];
        setComments(fallback);
        await generateSummaryForVideo(video, fallback);
      }
    } finally {
      setIsLoadingVideo(false);
    }
  };

  // Helper to trigger AI Summary
  const generateSummaryForVideo = async (video: YouTubeVideo, commentList: CommentItem[]) => {
    // Guard: if free trial expired, do not call AI; show placeholder instead
    if (isFreePlanExpired) {
      setSummary({
        videoId: video.id,
        videoTitle: video.title,
        totalAnalyzedComments: commentList.length,
        sentimentBreakdown: { positive: 0, neutral: 0, negative: 0 },
        keyThemes: [],
        topPraises: [],
        topComplaints: [],
        viewerQuestions: [],
        featureRequests: [],
        toxicComments: [],
        overallVerdict: 'Free trial expired. Upgrade to Creator Pro to generate AI summaries.',
        summaryMarkdown: '',
        generatedAt: Date.now()
      });
      return;
    }

    setIsGeneratingSummary(true);

    // If user chose Ollama, try direct browser fetch first (connects to user's local machine Ollama)
    if (settings.provider === 'ollama') {
      try {
        const cleanUrl = (settings.ollamaUrl || 'http://localhost:11434').replace(/\/$/, '');
        const commentTexts = commentList.slice(0, 30).map((c: any, i: number) => `[Comment #${i+1} by ${c.authorName} (${c.likeCount} likes)]: ${c.text}`).join('\n');
        const prompt = `You are a world-class YouTube Audience Intelligence Analyst.
Analyze the following YouTube comments for "${video.title}":
${commentTexts}

Return ONLY valid JSON matching this exact structure:
{
  "sentimentBreakdown": { "positive": 70, "neutral": 20, "negative": 10 },
  "overallVerdict": "Concise summary of audience reaction.",
  "keyThemes": [{ "theme": "Theme title", "description": "Brief description" }],
  "topPraises": ["Praise 1", "Praise 2"],
  "topComplaints": ["Complaint 1"],
  "viewerQuestions": ["Question 1"],
  "featureRequests": ["Feature request 1"]
}`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        const directRes = await fetch(`${cleanUrl}/api/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: settings.ollamaModel || 'llama3.2',
            prompt,
            format: 'json',
            stream: false
          }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (directRes.ok) {
          const data = await directRes.json();
          let parsed = {};
          try {
            const raw = data.response || '{}';
            const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
            parsed = JSON.parse(cleaned);
          } catch (pErr) {
            console.warn('Failed to parse direct browser Ollama JSON:', pErr);
          }
          if (Object.keys(parsed).length > 0) {
            setSummary({
              ...parsed,
              videoId: video.id,
              videoTitle: video.title,
              totalAnalyzedComments: commentList.length,
              generatedAt: Date.now()
            });
            setEngineUsed(`Ollama (${settings.ollamaModel || 'llama3.2'}) [Local Machine]`);
            return;
          }
        }
      } catch (directErr) {
        console.info('Direct browser Ollama call unavailable, using server AI engine:', directErr);
      }
    }

    try {
      const res = await fetch('/api/ai/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoTitle: video.title,
          comments: commentList,
          settings
        })
      });

      const resText = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(resText);
      } catch {
        data = { error: resText.startsWith('<') ? 'Server returned an HTML error response.' : resText };
      }

      if (res.ok && data.summary) {
        setSummary({
          ...data.summary,
          videoId: video.id,
          videoTitle: video.title,
          totalAnalyzedComments: commentList.length,
          generatedAt: Date.now()
        });
        setEngineUsed(data.engine || 'Gemini 3.6 Flash');
      } else {
        alert(`AI Generation Error (${settings.provider.toUpperCase()}): ${data.error || 'Failed to generate summary.'}`);
      }
    } catch (err: any) {
      console.error('Failed to generate summary:', err);
      alert(`AI Engine Error (${settings.provider.toUpperCase()}): ${err.message || 'Connection failed.'}`);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  // Handle Fetch Video by URL
  const handleFetchByUrl = async (urlOrId: string) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    // Allow fetching video info for expired free users; AI actions remain gated.
    setIsLoadingVideo(true);
    try {
      const res = await fetch('/api/youtube/video-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoUrlOrId: urlOrId,
          apiKey: settings.youtubeApiKey
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.video) {
          const newVid: YouTubeVideo = data.video;
          setPresetVideos((prev) => [newVid, ...prev.filter((v) => v.id !== newVid.id)]);
          await handleSelectVideo(newVid);
        }
      }
    } catch (err) {
      console.error('Error fetching video by URL:', err);
    } finally {
      setIsLoadingVideo(false);
    }
  };

  // Handle Q&A Chat Send
  const handleSendChatMessage = async (question: string) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    if (isFreePlanExpired) {
      setIsPricingModalOpen(true);
      const assistantMsg: ChatMessage = {
        id: `a_${Date.now()}`,
        role: 'assistant',
        content: `🚨 **2-Hour Free Plan Limit Expired**\n\nYour 2-hour free plan session has expired. To continue asking questions and analyzing YouTube comment data with AI, please upgrade to the **Creator Pro** plan!`,
        timestamp: Date.now()
      };
      setChatMessages((prev) => [...prev, assistantMsg]);
      return;
    }
    const userMsg: ChatMessage = {
      id: `u_${Date.now()}`,
      role: 'user',
      content: question,
      timestamp: Date.now()
    };

    const updatedMessages = [...chatMessages, userMsg];
    setChatMessages(updatedMessages);
    setIsSendingChat(true);

    // If video has no comments at all
    if (!comments || comments.length === 0) {
      const assistantMsg: ChatMessage = {
        id: `a_${Date.now()}`,
        role: 'assistant',
        content: `ℹ️ **No Comments Found for This Video**\n\nThis video currently has 0 comments indexed. As a result, there are no viewer questions, feedback, praises, or complaints available to analyze.\n\nPlease select another video with active comments!`,
        timestamp: Date.now()
      };
      setChatMessages((prev) => [...prev, assistantMsg]);
      setIsSendingChat(false);
      return;
    }

    // If user chose Ollama, try direct browser call to local machine Ollama
    if (settings.provider === 'ollama') {
      try {
        const cleanUrl = (settings.ollamaUrl || 'http://localhost:11434').replace(/\/$/, '');
        const contextStr = comments.slice(0, 20).map((c: any) => `[${c.authorName}]: ${c.text}`).join('\n');
        const prompt = `You are YouTube Comment Chat AI for video "${selectedVideo?.title}".
CRITICAL: If the question is a simple greeting or chit-chat (e.g. "hi", "hello", "hey"), reply concisely in 1-2 friendly sentences. DO NOT generate a summary or analysis report.
Comments:
${contextStr}
Question: ${question}`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        const directRes = await fetch(`${cleanUrl}/api/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: settings.ollamaModel || 'llama3.2',
            prompt,
            stream: false
          }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (directRes.ok) {
          const data = await directRes.json();
          const assistantMsg: ChatMessage = {
            id: `a_${Date.now()}`,
            role: 'assistant',
            content: data.response || 'No response from local Ollama model.',
            timestamp: Date.now()
          };
          setChatMessages((prev) => [...prev, assistantMsg]);
          setIsSendingChat(false);
          return;
        }
      } catch (directErr) {
        console.info('Direct browser Ollama chat call failed, using backend engine:', directErr);
      }
    }

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoTitle: selectedVideo?.title,
          question,
          comments,
          history: updatedMessages,
          settings
        })
      });

      const resText = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(resText);
      } catch {
        data = { error: resText.startsWith('<') ? 'Server returned an HTML error response.' : resText };
      }

      if (res.ok && data.reply) {
        const assistantMsg: ChatMessage = {
          id: `a_${Date.now()}`,
          role: 'assistant',
          content: data.reply,
          timestamp: Date.now(),
          retrievedComments: data.retrievedComments
        };
        setChatMessages((prev) => [...prev, assistantMsg]);
      } else {
        const assistantMsg: ChatMessage = {
          id: `a_${Date.now()}`,
          role: 'assistant',
          content: `⚠️ **AI Engine Error (${settings.provider.toUpperCase()})**: ${data.error || 'Unable to connect to AI provider.'}`,
          timestamp: Date.now()
        };
        setChatMessages((prev) => [...prev, assistantMsg]);
      }
    } catch (err: any) {
      console.error('Error sending chat message:', err);
      if (settings.provider === 'ollama') {
        const assistantMsg: ChatMessage = {
          id: `a_${Date.now()}`,
          role: 'assistant',
          content: `⚠️ **Ollama Error**: Ollama is closed or unreachable at \`${settings.ollamaUrl || 'http://localhost:11434'}\`. Please make sure Ollama is running on your machine.`,
          timestamp: Date.now()
        };
        setChatMessages((prev) => [...prev, assistantMsg]);
      }
    } finally {
      setIsSendingChat(false);
    }
  };

  // Clear chat messages
  const handleClearChat = () => {
    setChatMessages([]);
    localStorage.removeItem('yt_studio_chat_messages');
  };

  // Reset entire analysis session & return to dashboard
  const handleResetSession = () => {
    setSelectedVideo(null);
    setComments([]);
    setSummary(null);
    setChatMessages([]);
    localStorage.removeItem('yt_studio_selected_video');
    localStorage.removeItem('yt_studio_comments');
    localStorage.removeItem('yt_studio_summary');
    localStorage.removeItem('yt_studio_chat_messages');
    localStorage.setItem('yt_studio_view', 'dashboard');
    setCurrentView('dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-red-500 selection:text-white">
      
      {/* Navigation Bar */}
      <Navbar
        settings={settings}
        channel={channel}
        user={user}
        currentView={currentView}
        isFreePlanExpired={isFreePlanExpired}
        onNavigate={(view) => {
          if (isFreePlanExpired) {
            setIsPricingModalOpen(true);
            return;
          }
          if (view !== 'landing' && !user) {
            setIsAuthModalOpen(true);
            return;
          }
          if (view === 'dashboard' && !selectedVideo && presetVideos.length > 0) {
            changeView('dashboard');
          } else {
            changeView(view);
          }
        }}
        onOpenSettings={() => {
          if (isFreePlanExpired) {
            setIsPricingModalOpen(true);
            return;
          }
          setIsSettingsOpen(true);
        }}
        onOpenConnectChannel={() => {
          if (isFreePlanExpired) {
            setIsPricingModalOpen(true);
            return;
          }
          setIsChannelModalOpen(true);
        }}
        onOpenLogin={() => setIsAuthModalOpen(true)}
        onOpenPricing={() => setIsPricingModalOpen(true)}
        onLogout={handleLogout}
        hasActiveSummary={!!summary}
        onExportReport={() => {
          if (activeTab !== 'summary') setActiveTab('summary');
        }}
        onResetSession={handleResetSession}
      />

      {/* Expiration Notice Global Top Banner */}
      {isFreePlanExpired && (
        <div className="bg-amber-500/20 border-b border-amber-500/40 text-amber-200 text-xs py-3 px-4 sm:px-8 flex items-center justify-between gap-3 shadow-md z-30">
          <div className="flex items-center gap-2 font-bold">
            <span className="text-amber-300">🚨 Free Trial Expired:</span>
            <span className="font-normal text-slate-200">Your 2-hour free trial has ended. Upgrade to continue using the full AI experience.</span>
          </div>
          <button
            onClick={() => setIsPricingModalOpen(true)}
            className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs shrink-0 transition-all shadow-xl shadow-amber-500/25 flex items-center gap-1 hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>Upgrade Now ⚡</span>
          </button>
        </div>
      )}

      {/* Payment Redirect Notification Banner */}
      {paymentNotification && (
        <div className={`p-3.5 text-xs sm:text-sm font-semibold flex items-center justify-between px-6 transition-all ${
          paymentNotification.type === 'success'
            ? 'bg-emerald-500/15 text-emerald-300 border-b border-emerald-500/30'
            : 'bg-slate-900 text-slate-300 border-b border-slate-800'
        }`}>
          <div className="flex items-center gap-2">
            <span>{paymentNotification.text}</span>
          </div>
          <button
            onClick={() => setPaymentNotification(null)}
            className="ml-4 px-2 py-0.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors text-xs font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 pt-16">
        
        {/* VIEW 1: Landing Page */}
        {currentView === 'landing' && (
          <LandingPage
            onGetStarted={() => {
              if (!user) {
                setIsAuthModalOpen(true);
                return;
              }
              if (channel?.connected) {
                changeView('dashboard');
              } else {
                setIsChannelModalOpen(true);
              }
            }}
            onOpenLogin={() => setIsAuthModalOpen(true)}
            onTryDemoVideo={() => {
              if (!user) {
                setIsAuthModalOpen(true);
                return;
              }
              if (presetVideos.length > 0) {
                handleSelectVideo(presetVideos[0]);
              }
            }}
            onFetchByUrl={(url) => {
              if (!user) {
                setIsAuthModalOpen(true);
                return;
              }
              handleFetchByUrl(url);
            }}
          />
        )}

        {/* VIEW 2: Dashboard (Video Selector & Channel Overview) */}
        {currentView === 'dashboard' && (
          <VideoSelector
            presetVideos={presetVideos}
            onSelectVideo={handleSelectVideo}
            onFetchByUrl={handleFetchByUrl}
            isLoading={isLoadingVideo}
            channel={channel}
            onOpenConnectChannel={() => setIsChannelModalOpen(true)}
          />
        )}

        {/* VIEW 3: Active Video Analysis Workspace */}
        {currentView === 'analysis' && (
          selectedVideo ? (
            <div className="space-y-6">
              
              {/* Active Video Header & Tab Switcher */}
              <VideoHeader
                video={selectedVideo}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                onBackToSelector={() => changeView('dashboard')}
                onRefreshComments={() => handleSelectVideo(selectedVideo)}
                onResetSession={handleResetSession}
                isRefreshing={isLoadingVideo || isGeneratingSummary}
                commentCountText={comments.length}
              />

              {/* Content Views */}
              {activeTab === 'chat' && (
                <CommentChat
                  videoTitle={selectedVideo.title}
                  comments={comments}
                  messages={chatMessages}
                  onSendMessage={handleSendChatMessage}
                  onClearChat={handleClearChat}
                  isLoading={isSendingChat}
                  settings={settings}
                  isFreePlanExpired={isFreePlanExpired}
                  onOpenPricing={() => setIsPricingModalOpen(true)}
                />
              )}

              {activeTab === 'comments' && (
                <CommentsExplorer comments={comments} />
              )}

            </div>
          ) : (
            <VideoSelector
              presetVideos={presetVideos}
              onSelectVideo={handleSelectVideo}
              onFetchByUrl={handleFetchByUrl}
              isLoading={isLoadingVideo}
              channel={channel}
              onOpenConnectChannel={() => setIsChannelModalOpen(true)}
            />
          )
        )}

      </main>

      {/* Modals */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={(newSettings) => {
          setSettings(newSettings);
          localStorage.setItem('yt_studio_settings', JSON.stringify(newSettings));
        }}
      />

      <ConnectChannelModal
        isOpen={isChannelModalOpen}
        onClose={() => setIsChannelModalOpen(false)}
        channel={channel}
        user={user}
        youtubeApiKey={settings.youtubeApiKey}
        onUpdateApiKey={(key) => {
          setSettings((prev) => {
            const updated = { ...prev, youtubeApiKey: key };
            localStorage.setItem('yt_studio_settings', JSON.stringify(updated));
            return updated;
          });
        }}
        onLoginSuccess={handleLoginSuccess}
        onConnectChannel={(connectedChannel, videos) => {
          setChannel(connectedChannel);
          if (videos && videos.length > 0) {
            setPresetVideos(videos);
          }
          changeView('dashboard');
        }}
        onDisconnectChannel={() => setChannel(null)}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      <PricingModal
        isOpen={isPricingModalOpen}
        onClose={() => setIsPricingModalOpen(false)}
        userEmail={user?.email}
        isExpired={isFreePlanExpired}
        onUpgradePlan={handlePlanUpgrade}
        onRequireLogin={handleRequireLoginForCheckout}
        onCheckout={(planId, billingCycle) => startStripeCheckout(planId, billingCycle)}
      />

      {/* Persistent Full-Screen Lockout Screen when Free Plan 2-Hour Limit Expires */}
      {isFreePlanExpired && !isPricingModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-2xl flex flex-col items-center justify-center p-4 sm:p-6 text-center animate-fadeIn">
          <div className="max-w-lg w-full bg-slate-900 border-2 border-amber-500/60 rounded-3xl p-6 sm:p-10 shadow-2xl shadow-amber-500/20 space-y-6">
            <div className="w-16 h-16 rounded-3xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center mx-auto animate-bounce">
              <Zap className="w-8 h-8 fill-current text-amber-400" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                Free Trial Ended
              </h2>
              <p className="text-slate-300 text-sm leading-relaxed">
                Your 2-hour free trial has ended. Upgrade to <strong className="text-amber-300">Creator Pro</strong> to keep analyzing comments, chatting with AI, and unlocking advanced insights.
              </p>
            </div>


            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 text-left space-y-2">
              <div className="font-bold flex items-center gap-1.5 text-amber-300">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Creator Pro Features:</span>
              </div>
              <ul className="space-y-1 text-slate-300 list-disc list-inside">
                <li>Unlimited AI comment analysis session access</li>
                <li>Analyze up to 1,000 comments per video</li>
                <li>Unlimited AI Comment Chat queries & insights</li>
                <li>Connect unlimited custom YouTube channels</li>
              </ul>
            </div>

            <button
              onClick={() => setIsPricingModalOpen(true)}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-base transition-all shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Zap className="w-5 h-5 fill-current" />
              <span>Upgrade to Creator Pro ⚡</span>
            </button>
          </div>
        </div>
      )}

      {/* Simple Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} Zencut Studio • YouTube Comment Intelligence Powered by AI</p>
      </footer>

    </div>
  );
}
