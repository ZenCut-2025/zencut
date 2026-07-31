import React, { useState } from 'react';
import { X, Check, Zap, Sparkles, CreditCard, Shield, Star, AlertCircle, ShieldCheck, Lock, CheckCircle2, ArrowRight } from 'lucide-react';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  isExpired?: boolean;
  onUpgradePlan?: (planName: string, successText?: string) => void;
  onRequireLogin?: (planId: string, billingCycle: 'pass' | 'monthly') => void;
  onCheckout?: (planId: string, billingCycle: 'pass' | 'monthly') => Promise<void>;
}

export const PricingModal: React.FC<PricingModalProps> = ({
  isOpen,
  onClose,
  userEmail,
  isExpired = false,
  onUpgradePlan,
  onRequireLogin,
  onCheckout
}) => {
  const [billingCycle, setBillingCycle] = useState<'pass' | 'monthly'>('pass');
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCheckout = async (planId: string) => {
    if (!userEmail) {
      if (onRequireLogin) {
        onRequireLogin(planId, billingCycle);
      } else {
        setErrorMessage('Please sign in before continuing to checkout.');
      }
      return;
    }

    if (onCheckout) {
      setIsLoading(planId);
      setErrorMessage(null);
      try {
        await onCheckout(planId, billingCycle);
      } catch (err: any) {
        console.error('Checkout error:', err);
        setErrorMessage(err?.message || 'Payment service error. Please try again.');
      } finally {
        setIsLoading(null);
      }
      return;
    }

    setIsLoading(planId);
    setErrorMessage(null);

    // Open new tab synchronously inside click event handler to bypass popup blockers
    let newTab: Window | null = null;
    try {
      newTab = window.open('about:blank', '_blank');
    } catch (e) {
      console.warn('Could not open blank tab:', e);
    }

    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: `${planId}_${billingCycle}`,
          billingInterval: billingCycle,
          userEmail,
          redirectUrl: window.location.href
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initiate checkout');
      }

      if (data.url) {
        if (newTab && !newTab.closed) {
          newTab.location.href = data.url;
        } else {
          const opened = window.open(data.url, '_blank');
          if (!opened) window.location.href = data.url;
        }
      } else {
        if (newTab && !newTab.closed) newTab.close();
        throw new Error('No checkout URL received from server');
      }
    } catch (err: any) {
      if (newTab && !newTab.closed) newTab.close();
      console.error('Stripe Checkout Error:', err);
      setErrorMessage(err.message || 'Payment service error. Please try again.');
    } finally {
      setIsLoading(null);
    }
  };

  const handleDemoActivate = () => {
    if (onUpgradePlan) {
      onUpgradePlan('Creator Pro', '🎉 Demo mode activated. Your account now has Creator Pro access.');
      return;
    }

    try {
      const savedUser = localStorage.getItem('yt_studio_user');
      const current = savedUser ? JSON.parse(savedUser) : { name: 'Creator Pro User', email: userEmail || 'user@example.com' };
      current.plan = 'Creator Pro';
      localStorage.setItem('yt_studio_user', JSON.stringify(current));
      window.location.reload();
    } catch {
      window.location.reload();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/90 backdrop-blur-xl animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto bg-slate-950 border border-slate-800/80 rounded-3xl p-6 sm:p-10 text-slate-100 shadow-2xl shadow-red-950/20 custom-scrollbar">
        
        {/* Glow ambient background effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-red-600/10 blur-[100px] pointer-events-none rounded-full" />

        {/* Close Button - Only show if plan is NOT expired */}
        {!isExpired && (
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2.5 rounded-full bg-slate-900/90 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-all z-10 hover:rotate-90"
            title="Close pricing modal"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Header */}
        <div className="text-center space-y-3.5 max-w-2xl mx-auto mb-8 relative">
          
          {isExpired && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-red-600/30 via-amber-500/30 to-red-600/30 border-2 border-amber-500/80 text-amber-200 text-center space-y-1.5 shadow-xl shadow-amber-500/15 animate-pulse">
              <div className="flex items-center justify-center gap-2 font-black text-amber-300 text-sm sm:text-base">
                <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
                <span>2-Hour Free Plan Limit Reached — Upgrade Required</span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed max-w-xl mx-auto">
                Your free 2-hour session limit has ended. To continue using Zencut Studio for comment analysis, AI chat, and channel management, please upgrade to Creator Pro below.
              </p>
            </div>
          )}

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-red-500/15 via-red-500/10 to-amber-500/15 border border-red-500/30 text-red-400 text-xs font-extrabold uppercase tracking-widest shadow-sm">
            <Zap className="w-3.5 h-3.5 fill-current text-red-400" />
            <span>Zencut Studio Pro Access</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Unlock Full Creator Intelligence
          </h2>

          <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-lg mx-auto">
            Deep comment analysis, automatic spam detection, and instant AI audience insights without expensive subscriptions or surprises.
          </p>

          {/* Billing Cycle Switcher */}
          <div className="pt-2 flex flex-col items-center justify-center gap-4">
            {!userEmail && (
              <div className="w-full max-w-xl rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 text-amber-100 text-sm">
                <p className="font-semibold">Sign in to complete your purchase.</p>
                <p className="text-[11px] text-slate-300 mt-1">
                  To pay for Creator Pro, please log in first. After signing in, we will continue to Stripe checkout automatically.
                </p>
              </div>
            )}
            <div className="p-1 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-1">
              <button
                type="button"
                onClick={() => setBillingCycle('pass')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  billingCycle === 'pass'
                    ? 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-md shadow-red-600/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>10-Day Creator Pass ($8)</span>
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 relative ${
                  billingCycle === 'monthly'
                    ? 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-md shadow-red-600/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>Monthly Pro ($19/mo)</span>
                <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-[10px] font-black border border-emerald-500/30">
                  Save 20%
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Error Alert / Notice */}
        {errorMessage && (
          <div className="mb-8 p-4 rounded-2xl bg-amber-950/30 border border-amber-500/30 text-amber-300 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fadeIn">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-200">Stripe Integration Notice</p>
                <p className="text-slate-300 mt-0.5 leading-relaxed">{errorMessage}</p>
              </div>
            </div>
            <button
              onClick={handleDemoActivate}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shrink-0 transition-all shadow-md shadow-amber-500/20 flex items-center gap-1.5 whitespace-nowrap"
            >
              <span>Activate Free Pro Demo ⚡</span>
            </button>
          </div>
        )}

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto relative">
          
          {/* Starter Free Tier */}
          <div className="p-6 sm:p-7 rounded-3xl bg-slate-900/60 border border-slate-800/80 flex flex-col justify-between space-y-6 hover:border-slate-700/80 transition-all">
            <div className="space-y-5">
              <div>
                <div className="inline-block px-2.5 py-1 rounded-lg bg-slate-800 text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-2">
                  Starter Tier
                </div>
                <h3 className="font-bold text-white text-xl">Free Creator</h3>
                <p className="text-xs text-slate-400 mt-1">For casual YouTubers & initial channel inspection</p>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-white">$0</span>
                <span className="text-xs text-slate-500 font-medium">/ forever</span>
              </div>

              <div className="pt-2 border-t border-slate-800/60">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">Included Features:</p>
                <ul className="space-y-3 text-xs text-slate-300">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                    <span><strong>2-Hour max free session access</strong></span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                    <span>Analyze up to <strong>100 comments</strong> per video</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                    <span>Basic sentiment & top keywords summary</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                    <span>Standard AI processing speed</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-slate-500">
                    <X className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                    <span>No full AI Chat assistant Q&A</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-slate-500">
                    <X className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                    <span>No bulk export to PDF / JSON</span>
                  </li>
                </ul>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 font-bold text-xs transition-colors border border-slate-700/50"
            >
              Current Active Plan
            </button>
          </div>

          {/* Pro Creator Plan */}
          <div className="relative p-6 sm:p-7 rounded-3xl bg-gradient-to-b from-red-950/40 via-slate-900 to-slate-950 border-2 border-red-500/60 flex flex-col justify-between space-y-6 shadow-2xl shadow-red-950/30">
            
            {/* Top Badge */}
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full bg-gradient-to-r from-red-600 to-amber-600 text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-1.2 shadow-lg shadow-red-600/30 whitespace-nowrap">
              <Star className="w-3 h-3 fill-current text-amber-300" />
              <span>RECOMMENDED FOR CREATORS</span>
            </div>

            <div className="space-y-5 pt-1">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-500/10 text-red-400 text-[11px] font-bold uppercase tracking-wider mb-2 border border-red-500/20">
                  <Sparkles className="w-3 h-3 text-red-400" /> Pro Features Unlocked
                </div>
                <h3 className="font-bold text-white text-xl">Pro Creator</h3>
                <p className="text-xs text-slate-400 mt-1">High-quota access • Instant setup with zero hidden fees</p>
              </div>

              <div className="flex items-baseline gap-1.5">
                <span className="text-4xl font-black text-white">
                  {billingCycle === 'pass' ? '$8' : '$19'}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {billingCycle === 'pass' ? '/ 10 days pass' : '/ month'}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-800/80">
                <p className="text-[11px] font-semibold text-red-400 uppercase tracking-wider mb-3">All Pro Capabilities:</p>
                <ul className="space-y-3 text-xs text-slate-200">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <span><strong>Unlimited session access</strong> (No 2-hour expiration)</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <span>Deep analysis up to <strong>1,000 comments</strong> per video</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <span>Analyze up to <strong>20 YouTube videos</strong> per cycle</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <span><strong>Full AI Chat assistant</strong> to ask any question about your audience</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <span>Automated spam, bot & toxic comment detector</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <span>One-click <strong>PDF Executive & JSON exports</strong></span>
                  </li>
                </ul>
              </div>
            </div>

            <button
              onClick={() => handleCheckout('pro')}
              disabled={isLoading === 'pro'}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-red-600 via-red-500 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-extrabold text-xs sm:text-sm transition-all shadow-xl shadow-red-600/25 flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.99] border border-red-400/30"
            >
              {isLoading === 'pro' ? (
                <span className="animate-pulse flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Connecting to Stripe...
                </span>
              ) : (
                <>
                  <CreditCard className="w-4.5 h-4.5" />
                  <span>
                    Get Started ({billingCycle === 'pass' ? '$8 / 10 Days' : '$19 / Month'})
                  </span>
                  <ArrowRight className="w-4 h-4 ml-0.5" />
                </>
              )}
            </button>
          </div>

        </div>

        {/* Payment Trust Footer */}
        <div className="mt-10 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <p className="font-bold text-slate-200">256-Bit Bank-Grade Encryption</p>
              <p className="text-[11px] text-slate-500">Processed securely via official Stripe Checkout with SSL</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-slate-500" /> Instant Setup
            </span>
            <span>•</span>
            <span>Cancel Anytime</span>
            <span>•</span>
            <button
              onClick={handleDemoActivate}
              className="text-amber-400 hover:underline font-semibold"
            >
              Test Demo Mode
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

