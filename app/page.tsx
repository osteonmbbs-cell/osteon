"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginContent() {
  const searchParams = useSearchParams();
  const hasError = searchParams.get("error") === "not_authorized";
  const [mounted, setMounted] = useState(false);
  const [hovering, setHovering] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSignIn = () => {
    signIn("google", { callbackUrl: "/dashboard" });
  };

  return (
    <div className="bg-mesh min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Floating background orbs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl animate-float-slow pointer-events-none" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-float pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Particles */}
      <div className="particle w-1 h-1 bg-indigo-400 top-[15%] left-[20%] animate-float" style={{animationDelay: '0s'}} />
      <div className="particle w-1.5 h-1.5 bg-purple-400 top-[60%] left-[75%] animate-float-slow" style={{animationDelay: '1s'}} />
      <div className="particle w-1 h-1 bg-cyan-400 top-[80%] left-[30%] animate-float" style={{animationDelay: '2s'}} />
      <div className="particle w-2 h-2 bg-indigo-300 top-[25%] left-[85%] animate-float-slow" style={{animationDelay: '0.5s'}} />
      <div className="particle w-1 h-1 bg-purple-300 top-[45%] left-[10%] animate-float" style={{animationDelay: '1.5s'}} />

      <div
        className={`relative z-10 w-full max-w-md transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      >
        {/* Main Card */}
        <div className="glass-card p-10 text-center space-y-8">
          {/* Emoji Face */}
          <div className="relative">
            <div
              className={`emoji-face transition-all duration-500 ${
                hasError
                  ? 'grayscale-[30%]'
                  : hovering
                  ? 'scale-110'
                  : ''
              }`}
              style={{
                filter: hasError
                  ? 'drop-shadow(0 0 30px rgba(239,68,68,0.4))'
                  : 'drop-shadow(0 0 30px rgba(99,102,241,0.4))',
              }}
            >
              {hasError ? '😔' : hovering ? '😄' : '🙂'}
            </div>
            {/* Glow ring behind emoji */}
            <div
              className={`absolute inset-0 -z-10 mx-auto w-28 h-28 rounded-full blur-2xl transition-colors duration-500 top-2 ${
                hasError ? 'bg-red-500/20' : 'bg-indigo-500/20'
              }`}
            />
          </div>

          {/* Branding */}
          <div className="space-y-2">
            <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent animate-gradient">
              Osteon
            </h1>
            <p className="text-sm font-medium text-[var(--text-secondary)] tracking-wide uppercase">
              Secure Medical Test Portal
            </p>
          </div>

          {/* Error Message */}
          {hasError && (
            <div className="animate-scale-in bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-left">
              <div className="flex items-start gap-3">
                <span className="text-red-400 text-lg mt-0.5">⚠</span>
                <div>
                  <p className="text-red-300 text-sm font-semibold">Access Denied</p>
                  <p className="text-red-400/80 text-xs mt-1 leading-relaxed">
                    Your email is not registered in our system. Please contact your administrator to get whitelisted.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Sign In Button */}
          <button
            onClick={handleSignIn}
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
            className="btn-glow w-full text-sm flex items-center justify-center gap-3 py-3.5"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Sign in with Google
          </button>

          {/* Subtle bottom text */}
          <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
            Access is restricted to verified medical students only.
          </p>
        </div>

        {/* Floating decorative badge */}
        <div className="absolute -top-4 -right-4 glass-card px-3 py-1.5 text-[10px] font-bold text-indigo-300 uppercase tracking-widest animate-float">
          🔒 Secure
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <Suspense fallback={
      <div className="bg-mesh min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-400" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
