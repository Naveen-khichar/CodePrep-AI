"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { Problem } from "../../data/problems";
import CodeEditor from "./CodeEditor";
import AiAssistantPanel from "../../components/AiAssistantPanel";
import { db } from "../../lib/firebase";
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
  increment,
  Timestamp,
} from "firebase/firestore";

interface CodeWorkspaceProps {
  problem: Problem;
}

export default function CodeWorkspace({ problem }: CodeWorkspaceProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"description" | "hints" | "submissions">("description");
  const [language, setLanguage] = useState<string>("javascript");
  const [code, setCode] = useState<string>("");
  const [fontSize, setFontSize] = useState<number>(14);
  const [theme, setTheme] = useState<"vs-dark" | "light">("vs-dark");
  const [customInput, setCustomInput] = useState<string>("");
  
  // Terminal/Output Panel State
  const [isConsoleOpen, setIsConsoleOpen] = useState<boolean>(false);
  const [consoleTab, setConsoleTab] = useState<"input" | "output">("input");
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [runResult, setRunResult] = useState<any>(null);
  
  // Submit State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitVerdict, setSubmitVerdict] = useState<any>(null);
  
  // Submission History state
  const [pastSubmissions, setPastSubmissions] = useState<any[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState<boolean>(false);
  const [isAiOpen, setIsAiOpen] = useState<boolean>(false);

  // Set default code template when language changes
  useEffect(() => {
    if (problem.starterTemplates && problem.starterTemplates[language]) {
      setCode(problem.starterTemplates[language]);
    }
  }, [language, problem.starterTemplates]);

  // Fetch past submissions from Firestore
  const fetchSubmissions = async () => {
    if (!user) return;
    setLoadingSubmissions(true);
    try {
      const q = query(
        collection(db, "submissions"),
        where("userId", "==", user.uid),
        where("problemId", "==", problem.id.toString()),
        orderBy("timestamp", "desc")
      );
      const querySnapshot = await getDocs(q);
      const fetched: any[] = [];
      querySnapshot.forEach((doc) => {
        fetched.push({ id: doc.id, ...doc.data() });
      });
      setPastSubmissions(fetched);
    } catch (error) {
      console.error("Error loading submissions:", error);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  useEffect(() => {
    if (activeTab === "submissions" && user) {
      fetchSubmissions();
    }
  }, [activeTab, user]);

  const handleRunCode = async () => {
    setIsRunning(true);
    setIsConsoleOpen(true);
    setConsoleTab("output");
    setRunResult(null);
    setSubmitVerdict(null);

    try {
      const response = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language,
          code,
          stdin: customInput,
        }),
      });
      const data = await response.json();
      setRunResult(data);
    } catch (error: any) {
      setRunResult({ error: "Network Error", details: error.message });
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmitCode = async () => {
    if (!user) {
      alert("Please sign in to submit your solution.");
      return;
    }
    
    setIsSubmitting(true);
    setIsConsoleOpen(true);
    setConsoleTab("output");
    setSubmitVerdict(null);
    setRunResult(null);

    try {
      const response = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemId: problem.id,
          language,
          code,
        }),
      });
      
      const result = await response.json();
      setSubmitVerdict(result);

      // Perform Firestore Writes Client-Side with Authorized Session
      await addDoc(collection(db, "submissions"), {
        userId: user.uid,
        problemId: problem.id.toString(),
        problemTitle: problem.title,
        language,
        code,
        verdict: result.verdict,
        runtime: result.runtime || 0,
        memory: result.memory || 0,
        timestamp: Timestamp.now(),
        errorMessage: result.errorLogs || null,
      });

      // Synchronize User Progress collection
      const progressRef = doc(db, "progress", user.uid);
      const progressSnap = await getDoc(progressRef);
      
      const todayStr = new Date().toISOString().split("T")[0];
      let streakVal = 1;
      let solvedList: string[] = [];

      if (progressSnap.exists()) {
        const progData = progressSnap.data();
        solvedList = progData.solvedProblems || [];
        const isNewSolve = result.verdict === "Accepted" && !solvedList.includes(problem.id.toString());
        
        if (isNewSolve) {
          solvedList.push(problem.id.toString());
        }

        // Calculate Streaks
        const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split("T")[0];
        if (progData.lastSubmissionDate === yesterdayStr) {
          streakVal = (progData.streak || 0) + 1;
        } else if (progData.lastSubmissionDate === todayStr) {
          streakVal = progData.streak || 1;
        }

        await updateDoc(progressRef, {
          submissionsCount: increment(1),
          lastSubmissionDate: todayStr,
          streak: streakVal,
          favoriteLanguage: language,
          solvedProblems: solvedList,
        });
      } else {
        // Initialize fallback
        if (result.verdict === "Accepted") {
          solvedList.push(problem.id.toString());
        }
        await setDoc(progressRef, {
          userId: user.uid,
          solvedProblems: solvedList,
          submissionsCount: 1,
          streak: 1,
          lastSubmissionDate: todayStr,
          accuracy: 100,
          favoriteLanguage: language,
          totalTimeSpent: 10,
        });
      }
      
      // Refresh submissions tab list in background
      fetchSubmissions();

    } catch (error: any) {
      console.error("Failed submitting answer:", error);
      setSubmitVerdict({ verdict: "Runtime Error", errorLogs: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row flex-grow w-full max-w-[90rem] mx-auto px-4 sm:px-6 py-6 gap-6 min-h-[calc(100vh-4rem)]">
      
      {/* Left Panel: Problem Information Workspace */}
      <div className="w-full lg:w-1/2 flex flex-col glass-panel rounded-xl overflow-hidden border border-custom">
        {/* Navigation Tabs */}
        <div className="flex border-b border-custom bg-white/5">
          {(["description", "hints", "submissions"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3.5 text-sm font-semibold capitalize transition-all border-b-2 ${
                activeTab === tab
                  ? "border-brand-primary text-brand-primary bg-white/5"
                  : "border-transparent text-gray-400 hover:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Contents */}
        <div className="flex-grow p-6 overflow-y-auto max-h-[600px] lg:max-h-[calc(100vh-14rem)]">
          {activeTab === "description" && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <h1 className="text-2xl font-bold text-white">{problem.title}</h1>
                <span
                  className={`px-2.5 py-0.5 rounded text-xs font-bold ${
                    problem.difficulty === "Easy"
                      ? "bg-easy/10 text-easy border border-easy/25"
                      : problem.difficulty === "Medium"
                      ? "bg-medium/10 text-medium border border-medium/25"
                      : "bg-hard/10 text-hard border border-hard/25"
                  }`}
                >
                  {problem.difficulty}
                </span>
                <span className="text-gray-500 text-xs font-medium">
                  Acceptance Rate: {problem.acceptanceRate}%
                </span>
              </div>

              {/* Company tags */}
              <div className="flex flex-wrap gap-1.5 mb-6">
                {problem.companies.map((company) => (
                  <span
                    key={company}
                    className="text-[10px] uppercase tracking-wider font-bold bg-white/5 border border-white/10 text-brand-accent px-2 py-0.5 rounded"
                  >
                    {company}
                  </span>
                ))}
              </div>

              {/* Description */}
              <div className="prose prose-invert text-gray-300 max-w-none text-sm leading-relaxed whitespace-pre-line mb-8">
                {problem.description}
              </div>

              {/* Examples */}
              <div className="space-y-6 mb-8">
                <h3 className="text-base font-bold text-white border-b border-white/5 pb-2">Examples</h3>
                {problem.examples.map((ex, idx) => (
                  <div key={idx} className="bg-black/40 rounded-lg p-4 border border-white/5 font-mono text-xs">
                    <p className="mb-2">
                      <strong className="text-gray-400">Input:</strong> {ex.input}
                    </p>
                    <p className="mb-2">
                      <strong className="text-gray-400">Output:</strong> {ex.output}
                    </p>
                    {ex.explanation && (
                      <p className="text-gray-400 mt-2 italic">
                        <strong>Explanation:</strong> {ex.explanation}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* Constraints */}
              <div>
                <h3 className="text-base font-bold text-white border-b border-white/5 pb-2 mb-4">Constraints</h3>
                <ul className="list-disc pl-5 space-y-2 text-sm text-gray-400">
                  {problem.constraints.map((c, i) => (
                    <li key={i} className="font-mono text-xs">{c}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {activeTab === "hints" && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-white mb-4">Socratic Coding Hints</h2>
              {problem.hints.map((hint, idx) => (
                <div key={idx} className="bg-brand-primary/5 border border-brand-primary/10 rounded-lg p-5">
                  <span className="text-xs font-bold text-brand-primary uppercase tracking-wider">Hint {idx + 1}</span>
                  <p className="text-sm text-gray-300 mt-2">{hint}</p>
                </div>
              ))}
            </div>
          )}

          {activeTab === "submissions" && (
            <div>
              <h2 className="text-lg font-bold text-white mb-4">Your Past Solutions</h2>
              {!user ? (
                <p className="text-gray-400 text-sm">Please log in to view submission logs.</p>
              ) : loadingSubmissions ? (
                <div className="space-y-3">
                  <div className="h-10 bg-white/5 animate-pulse rounded" />
                  <div className="h-10 bg-white/5 animate-pulse rounded" />
                </div>
              ) : pastSubmissions.length === 0 ? (
                <p className="text-gray-400 text-sm">No solutions submitted yet for this problem.</p>
              ) : (
                <div className="space-y-3">
                  {pastSubmissions.map((sub) => (
                    <div
                      key={sub.id}
                      className="bg-black/30 border border-white/5 rounded-lg p-4 flex justify-between items-center"
                    >
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-bold ${
                              sub.verdict === "Accepted" ? "text-easy" : "text-hard"
                            }`}
                          >
                            {sub.verdict}
                          </span>
                          <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-gray-400 uppercase font-mono">
                            {sub.language}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {sub.timestamp instanceof Timestamp
                            ? sub.timestamp.toDate().toLocaleString()
                            : new Date(sub.timestamp?.seconds * 1000).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-right text-xs text-gray-400 font-mono">
                        <p>{sub.runtime} ms</p>
                        <p>{(sub.memory / 1024).toFixed(1)} MB</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Panel: Code Editor Workspace */}
      <div className="w-full lg:w-1/2 flex flex-col gap-4">
        {/* Monaco Controls Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-3 bg-white/5 rounded-xl border border-custom glass-panel">
          {/* Dropdowns */}
          <div className="flex items-center gap-3">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="glass-input rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer"
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="cpp">C++</option>
              <option value="java">Java</option>
            </select>

            <select
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="glass-input rounded-lg px-2 py-1.5 text-xs font-semibold cursor-pointer"
            >
              {[12, 14, 16, 18, 20].map((size) => (
                <option key={size} value={size}>{size}px</option>
              ))}
            </select>

            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value as "vs-dark" | "light")}
              className="glass-input rounded-lg px-2 py-1.5 text-xs font-semibold cursor-pointer"
            >
              <option value="vs-dark">Dark Editor</option>
              <option value="light">Light Editor</option>
            </select>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsAiOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-primary/10 text-brand-primary border border-brand-primary/20 text-xs font-bold hover:bg-brand-primary/20 transition-all cursor-pointer animate-pulse-slow"
            >
              <span>✨</span> Ask AI Mentor
            </button>
            <button
              onClick={() => {
                if (confirm("Reset code template to starter boilerplate?")) {
                  setCode(problem.starterTemplates[language]);
                }
              }}
              className="text-xs text-gray-400 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M9 11l3-3 3 3m-3-3v12" />
              </svg>
              Reset
            </button>
          </div>
        </div>

        {/* Monaco Editor Container */}
        <div className="flex-grow h-[350px] lg:h-[450px] rounded-xl overflow-hidden border border-custom glass-panel">
          <CodeEditor
            code={code}
            onChange={(newCode) => setCode(newCode || "")}
            language={language}
            theme={theme}
            fontSize={fontSize}
          />
        </div>

        {/* Terminal/Runner Output Console Drawer */}
        <div className="flex flex-col bg-black/40 border border-custom rounded-xl overflow-hidden glass-panel">
          {/* Console Header Tabs */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-custom bg-white/5">
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setIsConsoleOpen(true);
                  setConsoleTab("input");
                }}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                  isConsoleOpen && consoleTab === "input"
                    ? "bg-white/10 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Custom Input
              </button>
              <button
                onClick={() => {
                  setIsConsoleOpen(true);
                  setConsoleTab("output");
                }}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                  isConsoleOpen && consoleTab === "output"
                    ? "bg-white/10 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Execution Result
              </button>
            </div>
            
            {/* Toggle open/closed */}
            <button
              onClick={() => setIsConsoleOpen(!isConsoleOpen)}
              className="text-gray-400 hover:text-white p-1 rounded transition"
            >
              <svg
                className={`w-4 h-4 transform transition-transform ${isConsoleOpen ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {/* Console Body */}
          {isConsoleOpen && (
            <div className="p-4 bg-black/50 min-h-[140px] font-mono text-xs max-h-[220px] overflow-y-auto">
              {consoleTab === "input" ? (
                <textarea
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  placeholder="Enter inputs here (e.g. array on line 1, target on line 2 for Two Sum)..."
                  className="w-full h-28 bg-black/30 border border-white/5 rounded p-2.5 text-gray-300 font-mono focus:outline-none focus:border-brand-primary/40 focus:ring-1 focus:ring-brand-primary/30"
                />
              ) : (
                // Output Tab contents
                <div>
                  {isRunning && (
                    <div className="flex flex-col gap-2 py-4 items-center justify-center text-gray-400">
                      <div className="w-5 h-5 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
                      <span>Executing code on Judge0 Sandbox...</span>
                    </div>
                  )}
                  {isSubmitting && (
                    <div className="flex flex-col gap-2 py-4 items-center justify-center text-gray-400">
                      <div className="w-5 h-5 border-2 border-brand-secondary border-t-transparent rounded-full animate-spin" />
                      <span>Testing code against hidden test cases...</span>
                    </div>
                  )}

                  {/* Run code outcomes */}
                  {runResult && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span
                          className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                            runResult.status?.id === 3 ? "bg-easy/10 text-easy" : "bg-hard/10 text-hard"
                          }`}
                        >
                          {runResult.status?.description || "Execution Completed"}
                        </span>
                        <div className="text-[10px] text-gray-500 space-x-3">
                          <span>Time: {runResult.time}s</span>
                          <span>Memory: {runResult.memory} KB</span>
                        </div>
                      </div>

                      {runResult.compile_output && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-2.5 rounded whitespace-pre-wrap">
                          {runResult.compile_output}
                        </div>
                      )}
                      
                      {runResult.stderr && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-2.5 rounded whitespace-pre-wrap">
                          {runResult.stderr}
                        </div>
                      )}

                      {runResult.stdout && (
                        <div className="bg-black/60 p-2.5 rounded text-gray-300 border border-white/5">
                          <p className="text-gray-500 text-[10px] uppercase font-sans mb-1 select-none">Output stdout:</p>
                          <pre className="whitespace-pre-wrap">{runResult.stdout}</pre>
                        </div>
                      )}
                      
                      {!runResult.stdout && !runResult.stderr && !runResult.compile_output && (
                        <p className="text-gray-500 italic">No output logged to standard out.</p>
                      )}
                    </div>
                  )}

                  {/* Submission outcome */}
                  {submitVerdict && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b border-white/5 pb-2">
                        <div>
                          <p className="text-[10px] uppercase text-gray-500 font-sans font-bold">Verdict</p>
                          <h4
                            className={`text-base font-black ${
                              submitVerdict.verdict === "Accepted" ? "text-easy" : "text-hard"
                            }`}
                          >
                            {submitVerdict.verdict}
                          </h4>
                        </div>
                        <div className="text-right text-[10px] text-gray-400">
                          <p>
                            Passed Cases: {submitVerdict.passedCount} / {submitVerdict.totalCount}
                          </p>
                          {submitVerdict.verdict === "Accepted" && (
                            <p className="font-mono mt-0.5">
                              Avg Time: {submitVerdict.runtime} ms | Memory: {submitVerdict.memory} KB
                            </p>
                          )}
                        </div>
                      </div>

                      {submitVerdict.errorLogs && (
                        <div className="bg-black/60 border border-white/5 p-3 rounded text-red-400 whitespace-pre-wrap">
                          <p className="text-gray-500 text-[10px] uppercase font-sans font-bold mb-1">Execution trace / mismatch log</p>
                          <pre>{submitVerdict.errorLogs}</pre>
                        </div>
                      )}

                      {submitVerdict.verdict === "Accepted" && (
                        <div className="bg-easy/5 border border-easy/10 text-easy/80 p-3 rounded text-xs leading-relaxed">
                          🎉 Solution evaluated successfully! All test cases passed. Your submission metrics and streaking updates are synchronized with your profile.
                        </div>
                      )}
                    </div>
                  )}

                  {!runResult && !submitVerdict && !isRunning && !isSubmitting && (
                    <p className="text-gray-500 italic">No execution run yet. Press &quot;Run Code&quot; or &quot;Submit&quot;.</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 px-4 py-3 bg-white/5 border-t border-custom">
            <button
              onClick={handleRunCode}
              disabled={isRunning || isSubmitting}
              className="px-4 py-2 border border-white/10 hover:border-white/20 text-xs font-bold rounded-lg text-gray-300 hover:text-white transition-all bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              Run Code
            </button>
            <button
              onClick={handleSubmitCode}
              disabled={isRunning || isSubmitting}
              className="px-5 py-2 bg-easy hover:opacity-90 disabled:opacity-50 font-bold rounded-lg text-xs text-black shadow-md shadow-easy/20 transition-all disabled:cursor-not-allowed cursor-pointer"
            >
              Submit Solution
            </button>
          </div>
        </div>
      </div>
      
      {/* Collapsible Socratic AI panel */}
      <AiAssistantPanel
        isOpen={isAiOpen}
        onClose={() => setIsAiOpen(false)}
        problemTitle={problem.title}
        problemDescription={problem.description}
        code={code}
        language={language}
      />
    </div>
  );
}
