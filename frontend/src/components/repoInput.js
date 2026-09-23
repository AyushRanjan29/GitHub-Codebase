"use client";

import { useState } from "react";

export default function RepoInput() {
  const [repoUrl, setRepoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [repository, setRepository] = useState(null);
  const [error, setError] = useState("");

  const analyzeRepository = async () => {
    if (!repoUrl.trim()) {
      setError("Please enter a GitHub repository URL");
      return;
    }

    setLoading(true);
    setError("");
    setRepository(null);

    try {
      const response = await fetch(
        "http://localhost:5000/api/repository/index",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            repoUrl,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to analyze repository");
      }

      setRepository(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-3xl">
      <div className="flex gap-3">
        <input
          type="text"
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
          placeholder="https://github.com/user/repository"
          className="flex-1 rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 text-white outline-none focus:border-blue-500"
        />

        <button
          onClick={analyzeRepository}
          disabled={loading}
          className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Analyzing..." : "Analyze"}
        </button>
      </div>

      {error && <p className="mt-4 text-red-400">{error}</p>}

      {repository && (
        <div className="mt-8 rounded-xl border border-gray-800 bg-gray-900 p-6">
          <h2 className="text-2xl font-semibold">
            {repository.repository.name}
          </h2>

          <p className="mt-2 text-gray-400">
            {repository.repository.description || "No description"}
          </p>

          <div className="mt-5 grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Branch</p>

              <p className="mt-1">{repository.repository.defaultBranch}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Files</p>

              <p className="mt-1">{repository.totalFiles}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
