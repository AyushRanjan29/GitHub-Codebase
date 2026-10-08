"use client";

import { useState } from "react";
import {
  GitBranch,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  FileCode2,
} from "lucide-react";

export default function RepoInput({ onRepositoryChange, isLight }) {
  const [repoUrl, setRepoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [repository, setRepository] = useState(null);
  const [error, setError] = useState("");

  const analyzeRepository = async (e) => {
    e.preventDefault();

    if (!repoUrl.trim()) {
      setError("Please enter a GitHub repository URL.");
      setRepository(null);
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
          body: JSON.stringify({
            repoUrl: repoUrl.trim(),
          }),
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

  const repositoryName =
    repository?.repository?.fullName ||
    repository?.repository?.name ||
    "Repository";

  const totalFiles = repository?.totalFiles ?? 0;

  return (
    <div className="w-full">
      {/* Repository input */}
      <form
        onSubmit={analyzeRepository}
        className={`flex min-w-0 items-center gap-2 rounded-xl p-1.5 shadow-lg transition ${
          isLight
            ? "bg-white shadow-slate-200/60"
            : loading
              ? "bg-[#171923] shadow-black/20"
              : "bg-[#151821] shadow-black/20"
        }`}
      >
        <GitBranch
          size={18}
          className={`ml-2 shrink-0 ${
            loading
              ? "text-violet-400"
              : isLight
                ? "text-slate-400"
                : "text-slate-400"
          }`}
        />

        <input
          type="url"
          value={repoUrl}
          onChange={(e) => {
            setRepoUrl(e.target.value);

            if (error) {
              setError("");
            }
          }}
          placeholder="https://github.com/user/repository"
          aria-label="GitHub repository URL"
          disabled={loading}
          className={`min-w-0 flex-1 bg-transparent px-1 py-2 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-60 ${
            isLight
              ? "text-slate-900 placeholder:text-slate-400"
              : "text-slate-100 placeholder:text-slate-500"
          }`}
        />

        <button
          type="submit"
          disabled={loading || !repoUrl.trim()}
          className="flex shrink-0 items-center gap-2 rounded-lg bg-violet-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-violet-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-violet-600/40 disabled:opacity-70 sm:px-4 sm:text-sm"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />

          {loading ? "Analyzing..." : "Analyze"}
        </button>
      </form>

      {/* Error state */}
      {error && (
        <div
          className={`mt-2 flex items-start gap-2 rounded-lg px-3 py-2.5 ${
            isLight ? "bg-red-50" : "bg-red-500/[0.06]"
          }`}
        >
          <AlertCircle size={14} className="mt-0.5 shrink-0 text-red-400" />

          <p
            className={`min-w-0 break-words text-xs leading-5 ${
              isLight ? "text-red-500" : "text-red-400"
            }`}
          >
            {error}
          </p>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div
          className={`mt-2 rounded-lg px-3 py-2.5 ${
            isLight ? "bg-violet-50" : "bg-violet-500/[0.05]"
          }`}
        >
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-violet-400 [animation-delay:-0.3s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-violet-400 [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-violet-400" />
            </div>

            <span
              className={`text-xs font-medium ${
                isLight ? "text-violet-600" : "text-violet-300"
              }`}
            >
              Analyzing repository...
            </span>
          </div>

          <p className="mt-1 text-[10px] text-slate-500">
            Fetching files, processing code, and updating the index
          </p>
        </div>
      )}

      {/* Successful indexing state */}
      {repository && !loading && (
        <div
          className={`mt-2 rounded-lg px-3 py-2.5 ${
            isLight ? "bg-emerald-50" : "bg-emerald-500/[0.05]"
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 size={14} className="shrink-0 text-emerald-400" />

            <p
              className={`min-w-0 truncate text-xs font-medium ${
                isLight ? "text-emerald-600" : "text-emerald-300"
              }`}
            >
              {repositoryName}
            </p>

            <span
              className={`ml-auto shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                isLight
                  ? "bg-emerald-100 text-emerald-600"
                  : "bg-emerald-500/10 text-emerald-400"
              }`}
            >
              Ready
            </span>
          </div>

          <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-500">
            <FileCode2 size={12} />

            <span>
              {totalFiles} {totalFiles === 1 ? "file" : "files"} indexed
            </span>

            <span className={isLight ? "text-slate-300" : "text-slate-700"}>
              •
            </span>

            <span>Chatbot ready</span>
          </div>
        </div>
      )}
    </div>
  );
}
