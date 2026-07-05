"use client";

import { useState } from "react";

interface AiAssistantPanelProps {
  isOpen: boolean;
  onClose: () => void;
  problemTitle: string;
  problemDescription: string;
  code: string;
  language: string;
}

interface Message {
  role: "user" | "model";
  text: string;
  actionName?: string;
}

export default function AiAssistantPanel({
  isOpen,
  onClose,
  problemTitle,
  problemDescription,
  code,
  language,
}: AiAssistantPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [customQuestion, setCustomQuestion] = useState("");
  const [loading, setLoading] = useState(false);

  const quickActions = [
    { name: "Get Hint", action: "hint", icon: "💡" },
    { name: "Explain Code", action: "explain", icon: "🧠" },
    { name: "Optimize Solution", action: "optimize", icon: "🚀" },
    { name: "Complexity (Big-O)", action: "complexity", icon: "📊" },
    { name: "Find Bugs", action: "bug", icon: "🔍" },
    { name: "Dry Run", action: "dryrun", icon: "🏃" },
  ];

  const handleAction = async (action: string, actionName: string) => {
    setLoading(true);
    
    // Add user request message to the thread
    const userMsg: Message = {
      role: "user",
      text: `Analyze current solution: "${actionName}"`,
      actionName,
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          problemTitle,
          problemDescription,
          code,
          language,
        }),
      });

      const data = await response.json();
      
      setMessages((prev) => [
        ...prev,
        { role: "model", text: data.response || "No response received from AI." },
      ]);
    } catch (error: any) {
      setMessages((prev) => [
        ...prev,
        { role: "model", text: `Error connecting to AI mentor: ${error.message}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customQuestion.trim() || loading) return;

    const userText = customQuestion.trim();
    setMessages((prev) => [...prev, { role: "user", text: userText }]);
    setCustomQuestion("");
    setLoading(true);

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "explain", // Fallback standard explain mode
          problemTitle,
          problemDescription: `${problemDescription}\n\nCandidate Question: ${userText}`,
          code,
          language,
        }),
      });

      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        { role: "model", text: data.response || "No response received." },
      ]);
    } catch (error: any) {
      setMessages((prev) => [
        ...prev,
        { role: "model", text: `Error asking AI mentor: ${error.message}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md sm:max-w-lg glass-panel border-l border-custom shadow-2xl flex flex-col h-full bg-[#070b13]/95 backdrop-blur-xl">
      
      {/* Sidebar Header */}
      <div className="flex items-center justify-between p-4 border-b border-custom bg-white/5">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-brand-secondary animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
          <span className="font-extrabold text-sm tracking-tight text-white">Gemini AI Socratic Mentor</span>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Quick Action Button Panel */}
      <div className="p-4 border-b border-custom bg-black/20 grid grid-cols-2 sm:grid-cols-3 gap-2 flex-shrink-0">
        {quickActions.map((qa) => (
          <button
            key={qa.action}
            onClick={() => handleAction(qa.action, qa.name)}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-brand-primary/10 border border-white/5 hover:border-brand-primary/20 text-gray-300 hover:text-white rounded-lg text-xs font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <span>{qa.icon}</span>
            <span>{qa.name}</span>
          </button>
        ))}
      </div>

      {/* Chat Messages Feed */}
      <div className="flex-grow p-4 overflow-y-auto space-y-4 max-h-[calc(100vh-16rem)]">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 text-gray-400">
            <span className="text-3xl mb-3">✨</span>
            <h4 className="font-bold text-sm text-white">Ask your Socratic Mentor</h4>
            <p className="text-xs leading-relaxed max-w-xs mt-1">
              Select a quick action card above to analyze your code, or ask a specific follow-up question below.
            </p>
          </div>
        )}

        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex flex-col ${
              msg.role === "user" ? "items-end" : "items-start"
            }`}
          >
            <span className="text-[9px] text-gray-500 uppercase font-bold tracking-widest mb-1 px-1">
              {msg.role === "user" ? "You" : "Gemini Mentor"}
            </span>
            <div
              className={`rounded-xl p-3 text-xs leading-relaxed max-w-[90%] whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-brand-primary/20 text-white border border-brand-primary/30"
                  : "bg-white/5 border border-white/5 text-gray-300 prose prose-invert max-w-none"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex flex-col items-start">
            <span className="text-[9px] text-gray-500 uppercase font-bold tracking-widest mb-1 px-1">Gemini Mentor</span>
            <div className="bg-white/5 border border-white/5 rounded-xl p-4 flex items-center gap-3 w-[70%]">
              <div className="flex space-x-1.5">
                <div className="w-1.5 h-1.5 bg-brand-secondary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-1.5 h-1.5 bg-brand-secondary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-1.5 h-1.5 bg-brand-secondary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
              <span className="text-[10px] text-gray-500 animate-pulse">Analyzing logic structure...</span>
            </div>
          </div>
        )}
      </div>

      {/* Custom Chat Inputs Footer */}
      <form
        onSubmit={handleCustomSubmit}
        className="p-4 border-t border-custom bg-black/30 flex gap-2 flex-shrink-0"
      >
        <input
          type="text"
          value={customQuestion}
          onChange={(e) => setCustomQuestion(e.target.value)}
          placeholder="Ask AI a custom question (e.g. Why is it O(N) space?)..."
          className="flex-grow glass-input rounded-lg px-3 py-2 text-xs font-medium focus:outline-none"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !customQuestion.trim()}
          className="bg-brand-primary disabled:opacity-50 text-white px-3.5 py-2 rounded-lg text-xs font-bold transition shadow-md shadow-brand-primary/20 cursor-pointer"
        >
          Send
        </button>
      </form>
    </div>
  );
}
