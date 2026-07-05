"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import ProtectedRoute from "../components/ProtectedRoute";
import { db } from "../lib/firebase";
import { collection, query, where, orderBy, getDocs, Timestamp } from "firebase/firestore";
import Link from "next/link";

export default function SubmissionsPage() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [verdictFilter, setVerdictFilter] = useState("All");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchSubmissions = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, "submissions"),
          where("userId", "==", user.uid),
          orderBy("timestamp", "desc")
        );
        const snapshot = await getDocs(q);
        const logs: any[] = [];
        snapshot.forEach((doc) => {
          logs.push({ id: doc.id, ...doc.data() });
        });
        setSubmissions(logs);
      } catch (error) {
        console.error("Error retrieving historical submissions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, [user]);

  const filteredSubmissions = submissions.filter((sub) => {
    const matchesSearch = sub.problemTitle?.toLowerCase().includes(search.toLowerCase());
    const matchesVerdict =
      verdictFilter === "All" ||
      (verdictFilter === "Accepted" && sub.verdict === "Accepted") ||
      (verdictFilter === "Failed" && sub.verdict !== "Accepted");
    return matchesSearch && matchesVerdict;
  });

  return (
    <ProtectedRoute>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col min-h-screen">
        
        {/* Title Block */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-white tracking-tight">Submission History</h1>
          <p className="text-gray-400 text-sm mt-1">
            Review your technical solution submissions, sandboxed runtimes, and compiler verdict traces.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6 bg-white/5 border border-custom rounded-xl p-4 glass-panel items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by problem..."
              className="glass-input rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none w-full sm:w-60"
            />
            <select
              value={verdictFilter}
              onChange={(e) => setVerdictFilter(e.target.value)}
              className="glass-input rounded-lg px-2.5 py-2 text-xs font-semibold cursor-pointer w-full sm:w-40"
            >
              <option value="All">All Verdicts</option>
              <option value="Accepted">Accepted Only</option>
              <option value="Failed">Failed / Non-Accepted</option>
            </select>
          </div>
          <span className="text-xs text-gray-500 font-medium">
            Registered: {filteredSubmissions.length} record{filteredSubmissions.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Content table */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-white/5 border border-custom animate-pulse rounded-xl" />
            ))}
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center glass-panel border border-custom rounded-2xl">
            <span className="text-3xl mb-2">📂</span>
            <h3 className="font-bold text-white text-base">No submissions recorded</h3>
            <p className="text-gray-500 text-xs mt-1">Submit code in the compiler workspaces to populate this index.</p>
          </div>
        ) : (
          <div className="glass-panel border border-custom rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-custom bg-white/5 text-gray-500 uppercase text-[9px] font-sans font-extrabold pb-3">
                    <th className="px-6 py-3.5">Problem</th>
                    <th className="px-6 py-3.5">Language</th>
                    <th className="px-6 py-3.5">Verdict</th>
                    <th className="px-6 py-3.5">Time</th>
                    <th className="px-6 py-3.5">Memory</th>
                    <th className="px-6 py-3.5">Timestamp</th>
                    <th className="px-6 py-3.5 text-right">Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-gray-300">
                  {filteredSubmissions.map((sub) => {
                    const isExpanded = expandedId === sub.id;
                    return (
                      <>
                        <tr
                          key={sub.id}
                          className="hover:bg-white/5 transition border-b border-white/5 cursor-pointer"
                          onClick={() => setExpandedId(isExpanded ? null : sub.id)}
                        >
                          <td className="px-6 py-4 font-sans font-bold text-white">
                            <Link
                              href={`/problems/${sub.problemId}`}
                              className="hover:text-brand-primary transition"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {sub.problemTitle}
                            </Link>
                          </td>
                          <td className="px-6 py-4">
                            <span className="bg-white/10 px-2 py-0.5 rounded text-[10px] uppercase font-bold text-gray-300">
                              {sub.language}
                            </span>
                          </td>
                          <td className={`px-6 py-4 font-bold ${sub.verdict === "Accepted" ? "text-easy" : "text-hard"}`}>
                            {sub.verdict}
                          </td>
                          <td className="px-6 py-4 text-gray-400">{sub.runtime} ms</td>
                          <td className="px-6 py-4 text-gray-400">{(sub.memory / 1024).toFixed(2)} MB</td>
                          <td className="px-6 py-4 text-gray-500 font-sans text-[10px]">
                            {sub.timestamp instanceof Timestamp
                              ? sub.timestamp.toDate().toLocaleString()
                              : new Date(sub.timestamp?.seconds * 1000).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedId(isExpanded ? null : sub.id);
                              }}
                              className="text-brand-primary font-bold hover:underline cursor-pointer"
                            >
                              {isExpanded ? "Hide Code" : "View Code"}
                            </button>
                          </td>
                        </tr>
                        {/* Collapsible Source Code Drawer */}
                        {isExpanded && (
                          <tr>
                            <td colSpan={7} className="px-6 py-4 bg-black/60 border-b border-custom">
                              <div className="flex flex-col gap-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-sans font-bold uppercase text-gray-500">
                                    Submitted {sub.language} Syntax Block:
                                  </span>
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(sub.code);
                                      alert("Code copied to clipboard!");
                                    }}
                                    className="text-[10px] font-sans font-bold text-gray-400 hover:text-white px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/5 rounded"
                                  >
                                    Copy Code
                                  </button>
                                </div>
                                <pre className="bg-[#1e1e1e] p-4 rounded-lg border border-white/5 overflow-x-auto text-xs text-gray-300 whitespace-pre scrollbar">
                                  <code>{sub.code}</code>
                                </pre>
                                {sub.errorMessage && (
                                  <div className="mt-2 bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded text-xs">
                                    <p className="font-bold mb-1">Compiler Feedback Trace:</p>
                                    <pre className="whitespace-pre-wrap">{sub.errorMessage}</pre>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </ProtectedRoute>
  );
}
