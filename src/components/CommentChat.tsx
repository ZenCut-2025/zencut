import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, MessageSquareQuote, RefreshCcw, ThumbsUp, Trash2, Copy, Check, MessageSquare, HelpCircle, AlertCircle, Heart, Zap, ArrowDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ChatMessage, CommentItem, AISettings } from '../types';

interface CommentChatProps {
  videoTitle: string;
  comments: CommentItem[];
  messages: ChatMessage[];
  onSendMessage: (question: string) => void;
  onClearChat?: () => void;
  isLoading: boolean;
  settings: AISettings;
  isFreePlanExpired?: boolean;
  onOpenPricing?: () => void;
}

export const CommentChat: React.FC<CommentChatProps> = ({
  videoTitle,
  comments,
  messages,
  onSendMessage,
  onClearChat,
  isLoading,
  settings,
  isFreePlanExpired = false,
  onOpenPricing
}) => {
  const [inputQuestion, setInputQuestion] = useState('');
  const [expandedCitation, setExpandedCitation] = useState<string | null>(null);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [showScrollBottomBtn, setShowScrollBottomBtn] = useState(false);
  
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const SUGGESTED_PROMPTS = [
    { label: "Top Complaints", icon: AlertCircle, text: "What are the most common viewer complaints or criticisms?" },
    { label: "Sentiment & Pacing", icon: Heart, text: "How do viewers feel about the video intro, pacing, and length?" },
    { label: "Feature Requests", icon: Zap, text: "What features, topics, or video ideas are viewers asking for?" },
    { label: "Viewer Questions", icon: HelpCircle, text: "Find common unanswered questions asked in the comments." },
    { label: "Technical Feedback", icon: MessageSquare, text: "What is the overall community feedback about the code or technical content?" },
  ];

  const scrollToBottom = (smooth = false) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'end' });
  };

  // Handle scroll detection inside the chat box
  const handleChatScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    // If user has scrolled up more than 120px from bottom, show scroll bottom button
    const isUp = scrollHeight - scrollTop - clientHeight > 120;
    setShowScrollBottomBtn(isUp);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputQuestion.trim() && !isLoading) {
      onSendMessage(inputQuestion.trim());
      setInputQuestion('');
    }
  };

  const handleChipClick = (q: string) => {
    if (!isLoading) {
      onSendMessage(q);
    }
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(id);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  const currentEngineLabel = settings.provider === 'ollama'
    ? `Ollama (${settings.ollamaModel || 'llama3.2'})`
    : settings.provider === 'openrouter' || (settings.openrouterApiKey && settings.openrouterApiKey.trim())
      ? `OpenRouter (${settings.openrouterModel || 'Llama 3.1 8B'})`
      : 'Gemini 3.6 Flash';

  // Basic formatter for assistant text (handles bold and bullet points cleanly)
  const renderFormattedContent = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      if (!line.trim()) return <div key={idx} className="h-2" />;
      
      // Simple inline bolding helper
      const parts = line.split(/(\*\*.*?\*\*)/g);
      const formattedParts = parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={pIdx} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
        }
        return part;
      });

      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        return (
          <div key={idx} className="flex items-start gap-2 my-1 pl-1">
            <span className="text-red-400 font-bold shrink-0">•</span>
            <span className="text-slate-200">{formattedParts.slice(0)}</span>
          </div>
        );
      }

      return (
        <p key={idx} className="my-1 text-slate-200 leading-relaxed">
          {formattedParts}
        </p>
      );
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      
      {/* Top Banner Status Bar */}
      <div className="flex items-center justify-between bg-slate-900/90 p-4 rounded-2xl border border-slate-800 text-xs text-slate-300 backdrop-blur-md flex-wrap gap-3 shadow-lg">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <span className="font-semibold text-white block">Comment Analysis Chat AI</span>
            {comments.length === 0 ? (
              <span className="text-[11px] text-amber-400 font-medium flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                This video has 0 indexed comments
              </span>
            ) : (
              <span className="text-[11px] text-slate-400">Indexed {comments.length} verified comments from video</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px]">Engine: <strong className="text-emerald-400 font-medium">{currentEngineLabel}</strong></span>
          </div>

          {messages.length > 0 && onClearChat && (
            <button
              onClick={onClearChat}
              title="Delete all chat messages"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-semibold transition-all hover:scale-105 active:scale-95"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Chat</span>
            </button>
          )}
        </div>
      </div>

      {/* Suggested Prompt Chips */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-red-400" />
            Suggested Quick Questions
          </span>
          <span className="text-[11px] text-slate-500">Click any prompt to inquire</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {SUGGESTED_PROMPTS.map((prompt, idx) => {
            const Icon = prompt.icon;
            return (
              <button
                key={idx}
                onClick={() => handleChipClick(prompt.text)}
                disabled={isLoading}
                className="group flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-red-500/40 text-xs font-medium transition-all shadow-sm hover:shadow-red-500/5 disabled:opacity-50 text-left cursor-pointer"
              >
                <Icon className="w-3.5 h-3.5 text-red-400 group-hover:scale-110 transition-transform" />
                <span>{prompt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Chat Conversation Container */}
      <div className="relative group">
        <div
          ref={chatContainerRef}
          onScroll={handleChatScroll}
          className="bg-slate-900/80 rounded-3xl border border-slate-800/80 p-6 h-[480px] sm:h-[540px] overflow-y-auto space-y-6 shadow-2xl backdrop-blur-sm custom-scrollbar relative flex flex-col overscroll-contain"
        >
          {messages.length === 0 ? (
            <div className="my-auto py-12 flex flex-col items-center justify-center text-center space-y-4 text-slate-400">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-red-600/20 to-slate-800 border border-red-500/20 flex items-center justify-center text-red-400 shadow-xl">
                <Bot className="w-8 h-8" />
              </div>
              <div className="space-y-1 max-w-md">
                <h3 className="font-bold text-white text-lg">
                  {comments.length === 0 ? 'No Comments Available For This Video' : 'Ask Anything About The Video Comments'}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {comments.length === 0
                    ? 'This video currently has 0 comments. If you ask a question, the AI will inform you that no comments exist to analyze.'
                    : 'Type your question or pick a quick prompt above. Answers are generated instantly based directly on real audience reactions.'}
                </p>
              </div>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex gap-3.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-red-600 to-red-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-red-600/20">
                      <Bot className="w-5 h-5" />
                    </div>
                  )}

                  <div className={`space-y-2.5 max-w-2xl ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    
                    {/* Message Card */}
                    <div
                      className={`relative group p-4 rounded-2xl text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-r from-red-600 to-red-500 text-white rounded-tr-sm shadow-lg shadow-red-600/10'
                          : 'bg-slate-950 text-slate-200 border border-slate-800/80 rounded-tl-sm shadow-md'
                      }`}
                    >
                      <div className="pr-6">
                        {msg.role === 'user' ? (
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        ) : (
                          renderFormattedContent(msg.content)
                        )}
                      </div>

                      {/* Copy Button */}
                      <button
                        onClick={() => handleCopyText(msg.id, msg.content)}
                        title="Copy response"
                        className={`absolute top-2.5 right-2.5 p-1.5 rounded-lg text-slate-400 hover:text-white transition-opacity ${
                          msg.role === 'user' ? 'hover:bg-red-700/50' : 'hover:bg-slate-800'
                        }`}
                      >
                        {copiedMsgId === msg.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
                        )}
                      </button>
                    </div>

                    {/* Sourced Comments Citation Accordion */}
                    {msg.role === 'assistant' && msg.retrievedComments && msg.retrievedComments.length > 0 && (
                      <div className="space-y-2">
                        <button
                          onClick={() => setExpandedCitation(expandedCitation === msg.id ? null : msg.id)}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800/80 text-[11px] font-semibold text-slate-300 border border-slate-800 transition-all cursor-pointer"
                        >
                          <MessageSquareQuote className="w-3.5 h-3.5 text-red-400" />
                          <span>Grounding evidence ({msg.retrievedComments.length} comments)</span>
                        </button>

                        <AnimatePresence>
                          {expandedCitation === msg.id && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-2 max-w-xl overflow-hidden"
                            >
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                                Verified Audience Quotes:
                              </span>
                              <div className="space-y-2 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
                                {msg.retrievedComments.map((c, idx) => (
                                  <div key={idx} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80 text-xs text-slate-300 space-y-1">
                                    <div className="flex items-center justify-between text-[11px] font-semibold text-red-400">
                                      <span>@{c.authorName}</span>
                                      <span className="flex items-center gap-1 text-slate-400 text-[10px]">
                                        <ThumbsUp className="w-3 h-3 text-slate-500" /> {c.likeCount}
                                      </span>
                                    </div>
                                    <p className="italic text-slate-300 text-[11px] leading-relaxed">"{c.text}"</p>
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}

                  </div>

                  {msg.role === 'user' && (
                    <div className="w-9 h-9 rounded-2xl bg-slate-800 text-slate-300 flex items-center justify-center shrink-0 border border-slate-700/80">
                      <User className="w-5 h-5" />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          )}

          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-3 p-3 rounded-2xl bg-slate-950 border border-slate-800/80 text-slate-300 text-xs max-w-md"
            >
              <div className="w-7 h-7 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 shrink-0">
                <Bot className="w-4 h-4 animate-spin" />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-slate-300">Searching comments & generating response...</span>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Floating Scroll-To-Bottom Button */}
        <AnimatePresence>
          {showScrollBottomBtn && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 10 }}
              onClick={() => scrollToBottom(true)}
              className="absolute bottom-4 right-6 flex items-center gap-2 px-3.5 py-2 rounded-full bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-xl shadow-red-600/30 border border-red-400/30 backdrop-blur-md transition-all hover:scale-105 active:scale-95 z-20"
            >
              <ArrowDown className="w-3.5 h-3.5" />
              <span>Scroll to latest</span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Expiration Notice Bar */}
      {isFreePlanExpired && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/60 via-slate-900 to-amber-950/60 border border-amber-500/50 text-amber-200 text-xs flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0 border border-amber-500/30">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-amber-200 text-sm">2-Hour Free Plan Limit Reached</p>
              <p className="text-slate-300 text-xs">Your 2-hour free session has expired. Upgrade to Creator Pro to continue chatting with AI without limits.</p>
            </div>
          </div>
          {onOpenPricing && (
            <button
              type="button"
              onClick={onOpenPricing}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs shrink-0 transition-all shadow-xl shadow-amber-500/25 flex items-center gap-1.5 whitespace-nowrap hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Upgrade to Pro ⚡</span>
            </button>
          )}
        </div>
      )}

      {/* Chat Input Bar */}
      <form onSubmit={(e) => {
        if (isFreePlanExpired) {
          e.preventDefault();
          if (onOpenPricing) onOpenPricing();
          return;
        }
        handleSend(e);
      }} className="relative flex items-center gap-2">
        <input
          type="text"
          value={inputQuestion}
          onChange={(e) => setInputQuestion(e.target.value)}
          placeholder={isFreePlanExpired ? "2-Hour Free Limit Expired. Upgrade to Creator Pro to continue..." : "Ask a question about viewer feedback, complaints, or opinions..."}
          disabled={isLoading || isFreePlanExpired}
          className="w-full pl-5 pr-28 py-4 rounded-2xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-red-500/60 focus:ring-2 focus:ring-red-500/20 transition-all shadow-xl disabled:opacity-50"
        />
        
        <div className="absolute right-2 flex items-center gap-2">
          {inputQuestion.trim() && !isFreePlanExpired && (
            <button
              type="button"
              onClick={() => setInputQuestion('')}
              className="text-slate-500 hover:text-slate-300 text-xs px-2 py-1 rounded-md transition-colors"
            >
              Clear
            </button>
          )}

          <button
            type={isFreePlanExpired ? "button" : "submit"}
            onClick={() => {
              if (isFreePlanExpired && onOpenPricing) {
                onOpenPricing();
              }
            }}
            disabled={isLoading || (!inputQuestion.trim() && !isFreePlanExpired)}
            className={`px-5 py-2.5 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg ${
              isFreePlanExpired
                ? 'bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black shadow-amber-500/20 cursor-pointer'
                : 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 shadow-red-600/20 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]'
            }`}
          >
            {isFreePlanExpired ? (
              <span>Upgrade</span>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </>
            )}
          </button>
        </div>
      </form>

    </div>
  );
};

