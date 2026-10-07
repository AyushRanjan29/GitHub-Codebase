"use client";

import { useState } from "react";
import { GitBranch, RefreshCw } from "lucide-react";

export default function RepoInput({ onRepositoryChange }) {
  const [repoUrl, setRepoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [repository, setRepository] = useState(null);
  const [error, setError] = useState("");

  const analyzeRepository = async (e) => {
    e.preventDefault();

    if (!repoUrl.trim()) {
      setError("Please enter a GitHub repository URL.");
      return;
    }

    setLoading(true);
    setError("");
    setRepository(null);

    // Clear the previously selected repository while a new one is being analyzed.
    onRepositoryChange("");

    try {
      const response = await fetch(
        "http://localhost:5000/api/repository/index",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ repoUrl: repoUrl.trim() }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to analyze repository.");
      }

      setRepository(data);

      // Send the canonical repository name to the parent component.
      const fullName = data.repository?.fullName;

      if (fullName) {
        onRepositoryChange(fullName);
      }
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <form
        onSubmit={analyzeRepository}
        className="flex min-w-0 items-center gap-2 rounded-xl border border-white/10 bg-[#151821] p-1.5 shadow-lg shadow-black/20"
      >
        <GitBranch size={18} className="ml-2 shrink-0 text-slate-400" />

        <input
          type="url"
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
          placeholder="https://github.com/user/repository"
          aria-label="GitHub repository URL"
          className="min-w-0 flex-1 bg-transparent px-1 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-500"
        />

        <button
          type="submit"
          disabled={loading}
          className="flex shrink-0 items-center gap-2 rounded-lg bg-violet-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50 sm:px-4 sm:text-sm"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          {loading ? "Analyzing..." : "Analyze"}
        </button>
      </form>

      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}

      {repository && (
        <div className="mt-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-xs text-emerald-300">
          Indexed: {repository.repository?.name || "Repository"}
          {" · "}
          {repository.totalFiles ?? 0} files
        </div>
      )}
    </div>
  );
}
