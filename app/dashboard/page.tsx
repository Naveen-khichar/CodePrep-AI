"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import ProtectedRoute from "../components/ProtectedRoute";
import { db } from "../lib/firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { problems } from "../data/problems";
import Link from "next/link";

interface ProgressStats {
  solvedProblems: string[];
  submissionsCount: number;
  streak: number;
  lastSubmissionDate: string;
  accuracy: number;
  favoriteLanguage: string;
  totalTimeSpent: number;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [recentSubmissions, setRecentSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Calculate difficulty counts based on total static data
  const totalEasy = problems.filter((p) => p.difficulty === "Easy").length;
  const totalMedium = problems.filter((p) => p.difficulty === "Medium").length;
  const totalHard = problems.filter((p) => p.difficulty === "Hard").length;

  useEffect(() => {
    if (!user) return;

    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // 1. Fetch user stats progress document
        const progressRef = doc(db, "progress", user.uid);
        const progressSnap = await getDoc(progressRef);
        
        if (progressSnap.exists()) {
          setStats(progressSnap.data() as ProgressStats);
        } else {
          // Fallback default statistics for new profile
          setStats({
            solvedProblems: [],
            submissionsCount: 0,
            streak: 0,
            lastSubmissionDate: "",
            accuracy: 100,
            favoriteLanguage: "JavaScript",
            totalTimeSpent: 0,
          });
        }

        // 2. Fetch recent submissions logs (limit to 5)
        const subQuery = query(
          collection(db, "submissions"),
          where("userId", "==", user.uid),
          orderBy("timestamp", "desc"),
          limit(5)
        );
        const subSnap = await getDocs(subQuery);
        const subsList: any[] = [];
        subSnap.forEach((doc) => {
          subsList.push({ id: doc.id, ...doc.data() });
        });
        setRecentSubmissions(subsList);

      } catch (error) {
        console.error("Error retrieving dashboard records:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  // Compute category counts solved
  const solvedDetails = stats
    ? stats.solvedProblems.reduce(
        (acc, id) => {
          const problem = problems.find((p) => p.id === Number(id));
          if (problem) {
            acc[problem.difficulty.toLowerCase() as "easy" | "medium" | "hard"] += 1;
          }
          return acc;
        },
        { easy: 0, medium: 0, hard: 0 }
      )
    : { easy: 0, medium: 0, hard: 0 };

  const totalSolved = stats ? stats.solvedProblems.length : 0;
  const totalProblemsCount = problems.length;
  const solvedPercent = totalProblemsCount > 0 ? Math.round((totalSolved / totalProblemsCount) * 100) : 0;

  // Calculate circular SVG progress parameters
  const radius = 50;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (solvedPercent / 100) * circumference;

  return (
    <ProtectedRoute>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col min-h-screen">
        
        {/* Dashboard Profile Header */}
        {user && (
          <div className="glass-panel border border-custom rounded-2xl p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-6 bg-gradient-to-r from-brand-primary/5 via-transparent to-brand-secondary/5">
            <div className="flex items-center gap-4 text-center md:text-left flex-col md:flex-row">
              {user.photoURL ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.photoURL}
                  alt={user.displayName || "Avatar"}
                  className="w-16 h-16 rounded-full border-2 border-brand-primary/40 shadow-lg shadow-brand-primary/10"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-brand-primary text-white flex items-center justify-center font-bold text-2xl border-2 border-brand-primary/40">
                  {user.displayName?.charAt(0) || "U"}
                </div>
              )}
              <div>
                <h1 className="text-2xl font-black text-white">Welcome back, {user.displayName}!</h1>
                <p className="text-gray-400 text-xs mt-0.5">SDE candidate profile | {user.email}</p>
              </div>
            </div>

            {/* Streak Flame Badge */}
            <div className="flex items-center gap-3 bg-brand-secondary/10 border border-brand-secondary/20 px-4 py-2.5 rounded-xl">
              <span className="text-2xl animate-pulse">🔥</span>
              <div className="text-left font-mono">
                <p className="text-[10px] uppercase font-sans font-bold text-gray-400">Current Streak</p>
                <p className="text-lg font-black text-brand-secondary">{stats?.streak || 0} Day{stats?.streak !== 1 ? "s" : ""}</p>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          // Loader Skeleton
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-white/5 border border-custom animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : (
          stats && (
            <>
              {/* Stats Cards Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                
                {/* Solved Circle Progress */}
                <div className="glass-panel border border-custom rounded-2xl p-5 flex items-center justify-between gap-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Problems Solved</span>
                    <span className="text-3xl font-black text-white mt-1">
                      {totalSolved}
                      <span className="text-gray-500 text-sm font-bold">/{totalProblemsCount}</span>
                    </span>
                    <span className="text-[10px] text-brand-primary font-bold mt-1">
                      {solvedPercent}% Complete
                    </span>
                  </div>
                  <div className="relative w-20 h-20 flex-shrink-0 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                      <circle
                        cx="60"
                        cy="60"
                        r={radius}
                        className="stroke-white/5 fill-transparent"
                        strokeWidth={strokeWidth}
                      />
                      <circle
                        cx="60"
                        cy="60"
                        r={radius}
                        className="stroke-brand-primary fill-transparent transition-all duration-500"
                        strokeWidth={strokeWidth}
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute text-[11px] font-black text-white">{solvedPercent}%</span>
                  </div>
                </div>

                {/* Accuracy */}
                <div className="glass-panel border border-custom rounded-2xl p-5 flex flex-col justify-between">
                  <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Solution Accuracy</span>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-3xl font-black text-white">{stats.submissionsCount > 0 ? stats.accuracy || 80 : 100}%</span>
                    <span className="text-[10px] text-gray-400 font-bold">across tests</span>
                  </div>
                  <div className="w-full bg-white/5 h-1.5 rounded-full mt-4 overflow-hidden border border-white/5">
                    <div
                      className="bg-brand-secondary h-full rounded-full"
                      style={{ width: `${stats.submissionsCount > 0 ? stats.accuracy || 80 : 100}%` }}
                    />
                  </div>
                </div>

                {/* Submissions count */}
                <div className="glass-panel border border-custom rounded-2xl p-5 flex flex-col justify-between">
                  <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Total Evaluated</span>
                  <div className="mt-2">
                    <span className="text-3xl font-black text-white">{stats.submissionsCount}</span>
                    <p className="text-[10px] text-gray-400 font-bold mt-1">submissions submitted</p>
                  </div>
                  <span className="text-[10px] text-brand-accent font-bold mt-auto pt-2">
                    Sandboxed compilation
                  </span>
                </div>

                {/* Favorite Language */}
                <div className="glass-panel border border-custom rounded-2xl p-5 flex flex-col justify-between">
                  <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Primary Language</span>
                  <div className="mt-2">
                    <span className="text-2xl font-black text-white capitalize font-mono">{stats.favoriteLanguage}</span>
                    <p className="text-[10px] text-gray-400 font-bold mt-1">most active editor syntax</p>
                  </div>
                  <span className="text-[10px] text-gray-500 font-bold mt-auto pt-2">
                    C++, Python, JS, Java
                  </span>
                </div>

              </div>

              {/* Sub-panels Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Left Side: Recent Submissions logs */}
                <div className="lg:col-span-2 glass-panel border border-custom rounded-2xl p-6 flex flex-col">
                  <h3 className="text-base font-bold text-white mb-4 border-b border-white/5 pb-2">Recent Run Verdicts</h3>
                  {recentSubmissions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center flex-grow py-12 text-center text-gray-500">
                      <span className="text-2xl">📥</span>
                      <p className="text-xs mt-1">No execution logs registered yet.</p>
                      <Link href="/problems" className="text-xs text-brand-primary mt-2 hover:underline">
                        Solve problems
                      </Link>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left font-mono text-xs">
                        <thead>
                          <tr className="border-b border-white/5 text-gray-500 uppercase text-[9px] font-sans font-extrabold pb-2">
                            <th className="py-2">Challenge</th>
                            <th className="py-2">Language</th>
                            <th className="py-2">Verdict</th>
                            <th className="py-2">Time</th>
                            <th className="py-2 text-right">Timestamp</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-gray-300">
                          {recentSubmissions.map((sub) => (
                            <tr key={sub.id} className="hover:bg-white/5 transition">
                              <td className="py-3 font-sans font-bold text-white">
                                <Link href={`/problems/${sub.problemId}`} className="hover:underline">
                                  {sub.problemTitle}
                                </Link>
                              </td>
                              <td className="py-3">
                                <span className="bg-white/10 px-1.5 py-0.5 rounded text-[10px] uppercase">
                                  {sub.language}
                                </span>
                              </td>
                              <td className={`py-3 font-bold ${sub.verdict === "Accepted" ? "text-easy" : "text-hard"}`}>
                                {sub.verdict}
                              </td>
                              <td className="py-3 text-gray-400">{sub.runtime} ms</td>
                              <td className="py-3 text-right text-gray-500 font-sans text-[10px]">
                                {sub.timestamp instanceof Timestamp
                                  ? sub.timestamp.toDate().toLocaleDateString()
                                  : new Date(sub.timestamp?.seconds * 1000).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Right Side: Difficulty breakdown detail bars */}
                <div className="glass-panel border border-custom rounded-2xl p-6 flex flex-col">
                  <h3 className="text-base font-bold text-white mb-4 border-b border-white/5 pb-2">Difficulty Distribution</h3>
                  
                  <div className="space-y-6 flex-grow flex flex-col justify-center">
                    
                    {/* Easy progress */}
                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-2">
                        <span className="text-easy">Easy</span>
                        <span className="text-white">{solvedDetails.easy} <span className="text-gray-500">/ {totalEasy}</span></span>
                      </div>
                      <div className="w-full bg-white/5 h-2.5 rounded-full overflow-hidden border border-white/5">
                        <div
                          className="bg-easy h-full rounded-full transition-all duration-500"
                          style={{ width: `${totalEasy > 0 ? (solvedDetails.easy / totalEasy) * 100 : 0}%` }}
                        />
                      </div>
                    </div>

                    {/* Medium progress */}
                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-2">
                        <span className="text-medium">Medium</span>
                        <span className="text-white">{solvedDetails.medium} <span className="text-gray-500">/ {totalMedium}</span></span>
                      </div>
                      <div className="w-full bg-white/5 h-2.5 rounded-full overflow-hidden border border-white/5">
                        <div
                          className="bg-medium h-full rounded-full transition-all duration-500"
                          style={{ width: `${totalMedium > 0 ? (solvedDetails.medium / totalMedium) * 100 : 0}%` }}
                        />
                      </div>
                    </div>

                    {/* Hard progress */}
                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-2">
                        <span className="text-hard">Hard</span>
                        <span className="text-white">{solvedDetails.hard} <span className="text-gray-500">/ {totalHard}</span></span>
                      </div>
                      <div className="w-full bg-white/5 h-2.5 rounded-full overflow-hidden border border-white/5">
                        <div
                          className="bg-hard h-full rounded-full transition-all duration-500"
                          style={{ width: `${totalHard > 0 ? (solvedDetails.hard / totalHard) * 100 : 0}%` }}
                        />
                      </div>
                    </div>

                  </div>
                </div>

              </div>
            </>
          )
        )}

      </div>
    </ProtectedRoute>
  );
}
