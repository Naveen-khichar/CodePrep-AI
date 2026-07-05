"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { problems } from "../data/problems";

export default function ProblemsPage() {
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("All");
  const [selectedTag, setSelectedTag] = useState("All");
  const [selectedCompany, setSelectedCompany] = useState("All");
  const [sortBy, setSortBy] = useState("id");

  // Get unique tags and companies dynamically
  const { allTags, allCompanies } = useMemo(() => {
    const tags = new Set<string>();
    const companies = new Set<string>();
    problems.forEach((p) => {
      p.tags.forEach((t) => tags.add(t));
      p.companies.forEach((c) => companies.add(c));
    });
    return {
      allTags: Array.from(tags),
      allCompanies: Array.from(companies),
    };
  }, []);

  // Filter and sort problem records
  const filteredProblems = useMemo(() => {
    return problems
      .filter((p) => {
        const matchesSearch =
          p.title.toLowerCase().includes(search.toLowerCase()) ||
          p.description.toLowerCase().includes(search.toLowerCase());
        const matchesDifficulty =
          difficulty === "All" || p.difficulty === difficulty;
        const matchesTag = selectedTag === "All" || p.tags.includes(selectedTag);
        const matchesCompany =
          selectedCompany === "All" || p.companies.includes(selectedCompany);
        return matchesSearch && matchesDifficulty && matchesTag && matchesCompany;
      })
      .sort((a, b) => {
        if (sortBy === "title") {
          return a.title.localeCompare(b.title);
        }
        if (sortBy === "acceptance") {
          return b.acceptanceRate - a.acceptanceRate;
        }
        if (sortBy === "difficulty") {
          const order = { Easy: 1, Medium: 2, Hard: 3 };
          return order[a.difficulty] - order[b.difficulty];
        }
        // Default sort by ID
        return a.id - b.id;
      });
  }, [search, difficulty, selectedTag, selectedCompany, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col min-h-screen">
      
      {/* Directory Title */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white tracking-tight">Code Interview Problems</h1>
        <p className="text-gray-400 text-sm mt-1">
          Select from our curated syllabus of technical challenges compiled from real company interviews.
        </p>
      </div>

      {/* Control Panel Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8 bg-white/5 border border-custom rounded-xl p-5 glass-panel">
        
        {/* Search */}
        <div className="flex flex-col gap-1 md:col-span-1 lg:col-span-2">
          <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Search Problems</label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, topics..."
            className="glass-input rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none"
          />
        </div>

        {/* Difficulty */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Difficulty</label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="glass-input rounded-lg px-2.5 py-2 text-xs font-semibold cursor-pointer"
          >
            <option value="All">All Difficulties</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
        </div>

        {/* Tag Selection */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Topics</label>
          <select
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            className="glass-input rounded-lg px-2.5 py-2 text-xs font-semibold cursor-pointer font-sans"
          >
            <option value="All">All Topics</option>
            {allTags.map((tag) => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
        </div>

        {/* Company selection */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Company</label>
          <select
            value={selectedCompany}
            onChange={(e) => setSelectedCompany(e.target.value)}
            className="glass-input rounded-lg px-2.5 py-2 text-xs font-semibold cursor-pointer"
          >
            <option value="All">All Companies</option>
            {allCompanies.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Sorting Tabs */}
      <div className="flex items-center justify-between border-b border-custom pb-4 mb-6">
        <span className="text-xs text-gray-400 font-medium">
          Showing {filteredProblems.length} challenge{filteredProblems.length !== 1 ? "s" : ""}
        </span>
        <div className="flex items-center gap-2 text-xs font-semibold">
          <span className="text-gray-500">Sort by:</span>
          {(["id", "title", "difficulty", "acceptance"] as const).map((sortOpt) => (
            <button
              key={sortOpt}
              onClick={() => setSortBy(sortOpt)}
              className={`px-3 py-1 rounded-md transition capitalize cursor-pointer ${
                sortBy === sortOpt
                  ? "bg-brand-primary/10 text-brand-primary"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {sortOpt === "id" ? "Default" : sortOpt}
            </button>
          ))}
        </div>
      </div>

      {/* Problem list grid */}
      {filteredProblems.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-grow py-20 text-center glass-panel border border-custom rounded-2xl">
          <span className="text-3xl mb-2">🔍</span>
          <h3 className="font-bold text-white text-base">No problems found</h3>
          <p className="text-gray-500 text-xs mt-1">Try adjusting your filters or search keywords.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredProblems.map((prob) => (
            <Link key={prob.id} href={`/problems/${prob.id}`} className="group">
              <div className="glass-panel glass-panel-hover rounded-xl p-5 border border-custom flex flex-col md:flex-row md:items-center justify-between gap-4">
                
                {/* Left Side: Meta & Info */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <h3 className="text-base font-bold text-white group-hover:text-brand-primary transition">
                      {prob.id}. {prob.title}
                    </h3>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        prob.difficulty === "Easy"
                          ? "bg-easy/10 text-easy border border-easy/25"
                          : prob.difficulty === "Medium"
                          ? "bg-medium/10 text-medium border border-medium/25"
                          : "bg-hard/10 text-hard border border-hard/25"
                      }`}
                    >
                      {prob.difficulty}
                    </span>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {prob.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[9px] font-bold bg-white/5 text-gray-400 px-2 py-0.5 rounded border border-white/5"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Right Side: Companies & Acceptance */}
                <div className="flex flex-wrap items-center md:justify-end gap-4 border-t border-white/5 md:border-none pt-3 md:pt-0">
                  <div className="flex flex-wrap gap-1">
                    {prob.companies.slice(0, 3).map((comp) => (
                      <span
                        key={comp}
                        className="text-[9px] uppercase tracking-wider font-extrabold bg-brand-accent/5 text-brand-accent px-1.5 py-0.5 rounded border border-brand-accent/10"
                      >
                        {comp}
                      </span>
                    ))}
                    {prob.companies.length > 3 && (
                      <span className="text-[9px] text-gray-500 font-bold px-1.5 py-0.5">
                        +{prob.companies.length - 3}
                      </span>
                    )}
                  </div>

                  <div className="text-left md:text-right font-mono text-xs text-gray-400">
                    <p className="text-[9px] uppercase tracking-wider font-sans text-gray-500 font-bold">Acceptance</p>
                    <p className="font-semibold text-white">{prob.acceptanceRate}%</p>
                  </div>
                  
                  {/* Action Icon */}
                  <div className="hidden md:flex p-2 rounded-lg bg-white/5 border border-white/5 group-hover:bg-brand-primary/10 group-hover:border-brand-primary/20 text-gray-400 group-hover:text-white transition">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>

              </div>
            </Link>
          ))}
        </div>
      )}

    </div>
  );
}