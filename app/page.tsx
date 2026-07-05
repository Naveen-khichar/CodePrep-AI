"use client";

import Link from "next/link";
import { useAuth } from "./context/AuthContext";

export default function Home() {
  const { user, loading, loginWithGoogle } = useAuth();

  const features = [
    {
      title: "Interactive Monaco Workspace",
      description: "Code in a professional split-screen IDE featuring syntax highlights, custom font size configurations, and templates for Python, C++, Java, and JavaScript.",
      icon: (
        <svg className="w-6 h-6 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      ),
    },
    {
      title: "Real-time Judge0 Execution",
      description: "Compile and execute your code against real inputs inside sandboxed container nodes. Get detailed output results, runtimes, and memory usages instantly.",
      icon: (
        <svg className="w-6 h-6 text-easy" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
    },
    {
      title: "Gemini AI Socratic Mentor",
      description: "Stuck on a test case? Activate your AI coding companion. Request algorithm hints, Big-O complexity reports, dry runs, and bug checks without revealing full answers.",
      icon: (
        <svg className="w-6 h-6 text-brand-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
    },
    {
      title: "Granular Performance Charts",
      description: "Track your accuracy, streak milestones, and problem-solving metrics on an interactive user dashboard synchronized with your profile.",
      icon: (
        <svg className="w-6 h-6 text-brand-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2" />
        </svg>
      ),
    },
  ];

  return (
    <div className="flex flex-col min-h-screen relative overflow-hidden bg-background">
      {/* Background Decorative Blur */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-brand-primary/5 rounded-full blur-[120px] pointer-events-none select-none" />

      {/* Hero Section */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 mb-6 backdrop-blur">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-easy opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-easy"></span>
          </span>
          <span className="text-xs font-bold text-gray-300">Google Gemini & Judge0 Sandboxes Integrated</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white mb-6 leading-tight max-w-4xl mx-auto">
          Elevate Your Coding Interviews with <span className="text-gradient">Socratic AI</span>
        </h1>

        <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Don&apos;t just memorize solution scripts. Build deep engineering logic with real-time compilation execution and guided step-by-step AI critiques.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          {loading ? (
            <div className="w-40 h-12 bg-white/10 rounded-lg animate-pulse" />
          ) : user ? (
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/problems"
                className="px-8 py-3.5 bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-bold rounded-lg text-sm transition-all hover:shadow-lg hover:shadow-brand-primary/25 cursor-pointer"
              >
                Go to Problems
              </Link>
              <Link
                href="/dashboard"
                className="px-8 py-3.5 border border-white/10 text-white font-bold rounded-lg text-sm bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
              >
                View Dashboard
              </Link>
            </div>
          ) : (
            <button
              onClick={loginWithGoogle}
              className="flex items-center gap-3 bg-gradient-to-r from-brand-primary to-brand-secondary text-white px-8 py-3.5 rounded-lg text-sm font-extrabold shadow-lg shadow-brand-primary/20 hover:shadow-brand-primary/30 transition-all cursor-pointer hover:scale-[1.01]"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
              </svg>
              Get Started with Google Auth
            </button>
          )}
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-white/5 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white mb-4">
            Engineered for Google, Microsoft, and Meta Internships
          </h2>
          <p className="text-gray-400 text-sm max-w-lg mx-auto">
            CodePrep AI mimics the actual tech evaluation pipelines used by FAANG companies to help you succeed in SDE interviews.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feat, index) => (
            <div
              key={index}
              className="glass-panel glass-panel-hover rounded-xl p-6 border border-custom flex gap-4"
            >
              <div className="p-3 bg-white/5 rounded-lg h-fit flex items-center justify-center border border-white/5">
                {feat.icon}
              </div>
              <div>
                <h3 className="text-base font-bold text-white mb-2">{feat.title}</h3>
                <p className="text-gray-400 text-xs leading-relaxed">{feat.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Call To Action Banner */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-20 text-center relative z-10">
        <div className="glass-panel border border-custom rounded-2xl p-8 sm:p-12 bg-gradient-to-br from-brand-primary/5 via-transparent to-brand-secondary/5">
          <h2 className="text-xl sm:text-3xl font-extrabold text-white mb-4">
            Ready to Pass Your Technical Screening?
          </h2>
          <p className="text-gray-400 text-xs sm:text-sm max-w-md mx-auto mb-8">
            Create your free developer account today. Solved problem stats, language statistics, and execution streams will sync directly to your profile.
          </p>
          {!user && (
            <button
              onClick={loginWithGoogle}
              className="bg-white hover:bg-gray-100 text-black px-6 py-2.5 rounded-lg text-xs font-bold transition shadow-lg cursor-pointer inline-flex items-center gap-2"
            >
              Sign In Now
            </button>
          )}
        </div>
      </section>
    </div>
  );
}