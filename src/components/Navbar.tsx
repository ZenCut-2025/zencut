import React from 'react';
import { Download, CheckCircle2, LogIn, LogOut, Zap, RotateCcw, Youtube } from 'lucide-react';
import { AISettings, ChannelInfo, UserProfile } from '../types';
import { BrandLogo } from './BrandLogo';

interface NavbarProps {
  settings: AISettings;
  channel: ChannelInfo | null;
  user: UserProfile | null;
  currentView: 'landing' | 'dashboard' | 'analysis';
  isFreePlanExpired?: boolean;
  onNavigate: (view: 'landing' | 'dashboard' | 'analysis') => void;
  onOpenSettings: () => void;
  onOpenConnectChannel: () => void;
  onOpenLogin: () => void;
  onOpenPricing?: () => void;
  onLogout: () => void;
  onExportReport?: () => void;
  onResetSession?: () => void;
  hasActiveSummary?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  settings,
  channel,
  user,
  currentView,
  isFreePlanExpired = false,
  onNavigate,
  onOpenSettings,
  onOpenConnectChannel,
  onOpenLogin,
  onOpenPricing,
  onLogout,
  onExportReport,
  onResetSession,
  hasActiveSummary
}) => {
  const isPro = user?.plan === 'Creator Pro' || user?.plan === 'Studio Agency';
  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Brand / Logo */}
        <div className="flex items-center gap-6 shrink-0">
          <button
            onClick={() => onNavigate(user ? 'dashboard' : 'landing')}
            className="flex items-center gap-2.5 text-left focus:outline-none group"
          >
            <div className="w-9 h-9 rounded-xl overflow-hidden shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform">
              <BrandLogo className="w-full h-full" />
            </div>
            <span className="font-extrabold text-base sm:text-lg tracking-tight text-white group-hover:text-amber-300 transition-colors">
              Zencut Studio
            </span>
          </button>
        </div>

        {/* Action Controls & User Account */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          
          {!isPro && onOpenPricing && (
            <button
              onClick={onOpenPricing}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                isFreePlanExpired
                  ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20 hover:bg-amber-400 animate-pulse'
                  : 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black shadow-xl shadow-amber-500/25 hover:scale-[1.02] active:scale-[0.98]'}
              }`}
              title={isFreePlanExpired ? '2-Hour Free Limit Expired - Click to Upgrade' : 'Upgrade Plan'}
            >
              <Zap className="w-3.5 h-3.5 fill-current shrink-0" />
              <span>{isFreePlanExpired ? 'Upgrade Required ⚡' : 'Upgrade'}</span>
            </button>
          )}

          {/* Pro Plan Active Badge */}
          {isPro && onOpenPricing && (
            <button
              onClick={onOpenPricing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 shadow-xl shadow-amber-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
              title="Upgrade Plan"
            >
              <Zap className="w-3.5 h-3.5 fill-current text-slate-950 shrink-0" />
              <span>Upgrade</span>
            </button>
          )}

          {/* Connected Channel Badge (Shown only if channel is connected) */}
          {currentView !== 'landing' && channel?.connected && (
            <button
              onClick={onOpenConnectChannel}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold bg-red-500/10 border border-red-500/30 text-red-300 hover:bg-red-500/20 transition-all"
              title="Click to manage connected channel"
            >
              <Youtube className="w-4 h-4 text-red-400 fill-current shrink-0" />
              <span className="hidden sm:inline max-w-[120px] truncate">
                {channel.title}
              </span>
              <span className="sm:hidden">
                Channel
              </span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            </button>
          )}

          {/* Login / Profile */}
          {user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-7 h-7 rounded-full object-cover border border-slate-700"
              />
              <button
                onClick={onLogout}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                title="Log Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenLogin}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Log In</span>
            </button>
          )}

        </div>
      </div>
    </header>
  );
};

