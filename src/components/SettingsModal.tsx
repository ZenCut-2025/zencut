import React, { useState } from 'react';
import { Settings, Key, CheckCircle2, XCircle, RefreshCw, Sparkles, Server, Globe, ExternalLink, Eye, EyeOff } from 'lucide-react';
import { AISettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AISettings;
  onUpdateSettings: (newSettings: AISettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings
}) => {
  const initialProvider = settings.openrouterApiKey?.trim() 
    ? (settings.provider === 'gemini' ? 'gemini' : 'openrouter') 
    : (settings.provider === 'ollama' ? 'openrouter' : (settings.provider || 'openrouter'));

  const [provider, setProvider] = useState<'gemini' | 'ollama' | 'openrouter' | 'auto'>(initialProvider);
  const [ollamaUrl, setOllamaUrl] = useState(settings.ollamaUrl || 'http://localhost:11434');
  const [ollamaModel, setOllamaModel] = useState(settings.ollamaModel || 'llama3.2');
  const [openrouterApiKey, setOpenrouterApiKey] = useState(settings.openrouterApiKey || '');
  const [openrouterModel, setOpenrouterModel] = useState(settings.openrouterModel || 'meta-llama/llama-3.1-8b-instruct');
  const [showOpenRouterKey, setShowOpenRouterKey] = useState(false);
  const [youtubeApiKey, setYoutubeApiKey] = useState(settings.youtubeApiKey || '');
  const [showGuide, setShowGuide] = useState(false);
  
  const [ollamaTesting, setOllamaTesting] = useState(false);
  const [ollamaStatus, setOllamaStatus] = useState<{ connected: boolean; message: string; models?: string[] } | null>(null);

  const handleTestOllama = async () => {
    setOllamaTesting(true);
    setOllamaStatus(null);
    
    // First try backend proxy
    try {
      const res = await fetch('/api/ai/ollama-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ollamaUrl })
      });
      const data = await res.json();
      if (data.connected) {
        setOllamaStatus({
          connected: true,
          message: `Connected! Available models: ${data.models?.join(', ') || 'gemma2:2b'}`,
          models: data.models
        });
        if (data.models && data.models.length > 0 && !data.models.map((m: string) => m.split(':')[0]).includes(ollamaModel.split(':')[0])) {
          setOllamaModel(data.models[0]);
        }
        setOllamaTesting(false);
        return;
      }
    } catch (e) {
      // Ignore backend proxy error and fall back to client fetch
    }

    // Direct browser fetch fallback (for local browser -> local Ollama)
    try {
      const cleanUrl = ollamaUrl.replace(/\/$/, '');
      const directRes = await fetch(`${cleanUrl}/api/tags`, { method: 'GET' });
      if (directRes.ok) {
        const data = await directRes.json();
        const models = (data.models || []).map((m: any) => m.name || m.model);
        setOllamaStatus({
          connected: true,
          message: `Connected directly via browser! Installed models: ${models.join(', ') || 'gemma2:2b'}`,
          models
        });
      } else {
        setOllamaStatus({
          connected: false,
          message: `Could not reach Ollama at ${ollamaUrl}. Ensure Ollama is running on your machine.`
        });
      }
    } catch (err: any) {
      setOllamaStatus({
        connected: false,
        message: `Could not connect to Ollama at ${ollamaUrl}. Make sure Ollama is active on your machine.`
      });
    } finally {
      setOllamaTesting(false);
    }
  };

  const handleSave = () => {
    const activeProvider = (openrouterApiKey && openrouterApiKey.trim())
      ? (provider === 'gemini' ? 'gemini' : 'openrouter')
      : provider;

    onUpdateSettings({
      provider: activeProvider,
      ollamaUrl,
      ollamaModel,
      openrouterApiKey: openrouterApiKey.trim(),
      openrouterModel: openrouterModel.trim() || 'google/gemini-2.5-flash:free',
      youtubeApiKey: youtubeApiKey.trim(),
      useSampleDataFallback: settings.useSampleDataFallback
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">AI Engine & API Settings</h3>
              <p className="text-xs text-slate-400">Configure OpenRouter, Gemini AI, and Ollama models</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-sm">✕</button>
        </div>

        <div className="space-y-6">
          
          {/* Provider Toggle */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">AI Provider Engine</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              
              <button
                type="button"
                onClick={() => setProvider('openrouter')}
                className={`p-3.5 rounded-2xl border text-left space-y-1 transition-all ${
                  provider === 'openrouter'
                    ? 'bg-purple-500/10 border-purple-500 text-white shadow-md shadow-purple-500/10'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs sm:text-sm text-white flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-purple-400 shrink-0" /> OpenRouter
                  </span>
                  {provider === 'openrouter' && <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />}
                </div>
                <p className="text-[10px] text-slate-400">Use OpenRouter API Key (Llama 3, DeepSeek, Claude, Gemini)</p>
              </button>

              <button
                type="button"
                onClick={() => setProvider('gemini')}
                className={`p-3.5 rounded-2xl border text-left space-y-1 transition-all ${
                  provider === 'gemini'
                    ? 'bg-red-500/10 border-red-500 text-white shadow-md shadow-red-500/10'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs sm:text-sm text-white flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-red-400 shrink-0" /> Gemini 3.6
                  </span>
                  {provider === 'gemini' && <CheckCircle2 className="w-4 h-4 text-red-400 shrink-0" />}
                </div>
                <p className="text-[10px] text-slate-400">Cloud Gemini API (Fast, Server-Side, Built-in)</p>
              </button>

              <button
                type="button"
                onClick={() => setProvider('ollama')}
                className={`p-3.5 rounded-2xl border text-left space-y-1 transition-all ${
                  provider === 'ollama'
                    ? 'bg-emerald-500/10 border-emerald-500 text-white shadow-md shadow-emerald-500/10'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs sm:text-sm text-white flex items-center gap-1.5">
                    <Server className="w-4 h-4 text-emerald-400 shrink-0" /> Ollama Local
                  </span>
                  {provider === 'ollama' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                </div>
                <p className="text-[10px] text-slate-400">Local Ollama Model (Private on PC)</p>
              </button>

            </div>
          </div>

          {/* OpenRouter Configuration Section */}
          {provider === 'openrouter' && (
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Globe className="w-4 h-4" /> OpenRouter API Settings
                </h4>
                <a
                  href="https://openrouter.ai/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-purple-400 hover:underline flex items-center gap-1 font-semibold"
                >
                  Get OpenRouter Key <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-slate-300 font-medium">OpenRouter API Key</label>
                <div className="relative">
                  <input
                    type={showOpenRouterKey ? 'text' : 'password'}
                    value={openrouterApiKey}
                    onChange={(e) => {
                      const val = e.target.value;
                      setOpenrouterApiKey(val);
                      if (val.trim() && provider !== 'gemini') {
                        setProvider('openrouter');
                      }
                    }}
                    placeholder="sk-or-v1-..."
                    className="w-full px-3 py-2.5 pr-10 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOpenRouterKey(!showOpenRouterKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                    title={showOpenRouterKey ? "Hide API key" : "Show API key"}
                  >
                    {showOpenRouterKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400">
                  Paste your key starting with <code className="text-purple-300 font-mono">sk-or-v1-</code>. It will be stored securely in your browser settings.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-slate-300 font-medium">Model ID</label>
                  <span className="text-[10px] text-purple-400 font-mono">Default: meta-llama/llama-3.1-8b-instruct</span>
                </div>
                <input
                  type="text"
                  value={openrouterModel}
                  onChange={(e) => setOpenrouterModel(e.target.value)}
                  placeholder="e.g. meta-llama/llama-3.1-8b-instruct"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:ring-1 focus:ring-purple-500"
                />

                <p className="text-[11px] text-slate-400">Popular OpenRouter Models:</p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: 'meta-llama/llama-3.1-8b-instruct', label: 'Llama 3.1 8B' },
                    { id: 'google/gemini-2.5-flash:free', label: 'Gemini 2.5 Flash (Free)' },
                    { id: 'meta-llama/llama-3.2-3b-instruct:free', label: 'Llama 3.2 3B (Free)' },
                    { id: 'deepseek/deepseek-r1:free', label: 'DeepSeek R1 (Free)' },
                    { id: 'meta-llama/llama-3.3-70b-instruct', label: 'Llama 3.3 70B' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setOpenrouterModel(m.id)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-colors ${
                        openrouterModel === m.id
                          ? 'bg-purple-600 text-white font-bold'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Ollama Configuration Section */}
          {provider === 'ollama' && (
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
              <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Ollama Server Settings</h4>
              
              <div className="space-y-2">
                <label className="text-xs text-slate-300">Ollama Base URL</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={ollamaUrl}
                    onChange={(e) => setOllamaUrl(e.target.value)}
                    placeholder="http://localhost:11434"
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={handleTestOllama}
                    disabled={ollamaTesting}
                    className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${ollamaTesting ? 'animate-spin' : ''}`} />
                    <span>Test Connection</span>
                  </button>
                </div>
              </div>

              {ollamaStatus && (
                <div className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                  ollamaStatus.connected
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}>
                  {ollamaStatus.connected ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" /> : <XCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />}
                  <p>{ollamaStatus.message}</p>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-slate-300">Model Name</label>
                  <span className="text-[10px] text-emerald-400 font-mono">Default: llama3.2</span>
                </div>
                <input
                  type="text"
                  value={ollamaModel}
                  onChange={(e) => setOllamaModel(e.target.value)}
                  placeholder="llama3.2, qwen2.5:1.5b, mistral, gemma2..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                />
                
                {/* Popular Model Presets */}
                <div className="pt-1 flex flex-wrap gap-1.5">
                  {[
                    { id: 'llama3.2', label: 'llama3.2 (2.0 GB)' },
                    { id: 'qwen2.5:1.5b', label: 'qwen2.5:1.5b (1.0 GB)' },
                    { id: 'gemma2:2b', label: 'gemma2:2b (1.6 GB)' },
                    { id: 'mistral', label: 'mistral (4.1 GB)' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setOllamaModel(m.id)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-colors ${
                        ollamaModel === m.id
                          ? 'bg-emerald-500 text-black font-bold'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Collapsible Setup Guide */}
              <div className="pt-2 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setShowGuide(!showGuide)}
                  className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold"
                >
                  <span>{showGuide ? 'Hide Setup Guide' : 'How to install & run local Ollama models?'}</span>
                </button>

                {showGuide && (
                  <div className="mt-2.5 p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-3 text-[11px] text-slate-300 leading-relaxed font-sans">
                    <p className="font-semibold text-white">Ollama Setup Guide for Windows & Mac:</p>
                    
                    <div className="space-y-1">
                      <p className="text-slate-400 font-medium">1. Download Ollama:</p>
                      <p className="font-mono text-emerald-300 bg-slate-950 p-1.5 rounded border border-slate-800">
                        https://ollama.com/download
                      </p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-slate-400 font-medium">2. Windows Command Prompt (CMD):</p>
                      <p className="font-mono text-emerald-300 bg-slate-950 p-1.5 rounded border border-slate-800 select-all">
                        set OLLAMA_ORIGINS=* && ollama serve
                      </p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-slate-400 font-medium">3. Windows PowerShell:</p>
                      <p className="font-mono text-emerald-300 bg-slate-950 p-1.5 rounded border border-slate-800 select-all">
                        $env:OLLAMA_ORIGINS="*" ; ollama serve
                      </p>
                    </div>

                    <div className="space-y-1 border-t border-slate-800 pt-2">
                      <p className="text-slate-400 font-medium text-amber-300">💡 Connecting to cloud-hosted web apps:</p>
                      <p className="text-slate-400">
                        Since this web app runs in the cloud, <code>http://localhost:11434</code> refers to your local PC. To connect your local Ollama to this cloud preview:
                      </p>
                      <p className="font-mono text-emerald-300 bg-slate-950 p-1.5 rounded border border-slate-800 select-all">
                        npx localtunnel --port 11434
                      </p>
                      <p className="text-[10px] text-slate-400">Copy the generated https URL (e.g. <code>https://xxxx.loca.lt</code>) and paste it into the Ollama Base URL field above!</p>
                    </div>

                    <p className="text-[10px] text-slate-500 pt-1">
                      Tip: You can also select <strong>Gemini 3.6</strong> as your AI Provider above to run AI models instantly without installing anything locally!
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* YouTube Data API Key */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Key className="w-4 h-4 text-red-400" />
              <span>YouTube Data API v3 Key (Optional)</span>
            </label>
            <input
              type="text"
              value={youtubeApiKey}
              onChange={(e) => setYoutubeApiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:ring-1 focus:ring-red-500"
            />
            <p className="text-[11px] text-slate-400">
              Provide a custom YouTube API Key to fetch real comments for any public video. If left blank, the app will use server fallback or simulated test video datasets.
            </p>
          </div>

        </div>

        <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-md shadow-red-600/20"
          >
            Save Settings
          </button>
        </div>

      </div>
    </div>
  );
};
