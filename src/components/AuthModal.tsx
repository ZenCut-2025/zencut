import React, { useState, useEffect } from 'react';
import { ShieldCheck, AlertCircle } from 'lucide-react';
import { UserProfile } from '../types';
import { BrandLogo } from './BrandLogo';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    // Listen for postMessage from Google OAuth Callback window
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'GOOGLE_AUTH_SUCCESS' && event.data.user) {
        setIsLoading(false);
        setErrorMsg(null);
        localStorage.setItem('yt_studio_user', JSON.stringify(event.data.user));
        onLoginSuccess(event.data.user);
        onClose();
      } else if (event.data?.type === 'GOOGLE_AUTH_ERROR') {
        setIsLoading(false);
        setErrorMsg(event.data.error || 'Google login failed. Please try again.');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onLoginSuccess, onClose]);

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    setErrorMsg(null);

    const width = 520;
    const height = 680;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    const popup = window.open(
      'about:blank',
      'GoogleOAuthWindow',
      `width=${width},height=${height},top=${top},left=${left},scrollbars=yes`
    );

    try {
      const res = await fetch('/api/auth/google/url');
      const data = await res.json();

      if (data.configured && data.authUrl) {
        if (popup) {
          popup.location.href = data.authUrl;
          popup.focus();
        } else {
          window.location.href = data.authUrl;
        }
      } else {
        if (popup) {
          popup.location.href = '/api/auth/google/login';
          popup.focus();
        } else {
          window.location.href = '/api/auth/google/login';
        }
      }
    } catch (err: any) {
      console.error('OAuth initiation error:', err);
      if (popup) {
        popup.location.href = '/api/auth/google/login';
        popup.focus();
      } else {
        window.location.href = '/api/auth/google/login';
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-sm w-full p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
        
        {/* Glow behind modal */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-red-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl overflow-hidden shadow-lg shadow-amber-500/20">
              <BrandLogo className="w-full h-full" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                Sign In
              </h3>
              <p className="text-xs text-slate-400">YouTube Comment Studio</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-sm transition-colors p-1">✕</button>
        </div>

        <div className="text-center space-y-2">
          <p className="text-xs text-slate-300 leading-relaxed">
            Sign in with your Google account to access your studio dashboard, video analytics, and comment intelligence.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        <button
          onClick={handleGoogleAuth}
          disabled={isLoading}
          className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-bold text-sm flex items-center justify-center gap-3 transition-all shadow-lg shadow-red-600/25 disabled:opacity-50 active:scale-[0.99]"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <svg className="w-5 h-5 shrink-0 bg-white rounded-full p-0.5" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.2 9 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 10.8 0 12.3s.7 2.6 1.9 5l3.7-2.5z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.2-6.4-5.2L1.9 16c1.8 3.7 5.6 7 10.1 7z"
                />
              </svg>
              <span>Sign in with Google</span>
            </>
          )}
        </button>

        <div className="pt-2 flex items-center justify-center gap-2 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Protected by Google OAuth 2.0</span>
        </div>

      </div>
    </div>
  );
};



