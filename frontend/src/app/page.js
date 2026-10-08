"use client";

import { useEffect, useState } from "react";
import { Moon, Sun, Code2, Sparkles } from "lucide-react";
import RepoInput from "../components/repoInput";
import Chatbot from "../components/chatBot";

export default function Home() {
  const [currentRepository, setCurrentRepository] = useState("");

  const [isLight, setIsLight] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return localStorage.getItem("github-rag-theme") === "light";
  });

  useEffect(() => {
    localStorage.setItem("github-rag-theme", isLight ? "light" : "dark");

    document.documentElement.classList.toggle("light", isLight);
  }, [isLight]);

  return (
    <main
      className={`min-h-screen transition-colors duration-200 ${
        isLight ? "bg-[#f5f5f5] text-slate-900" : "bg-black text-white"
      }`}
    >
      {/* Application-wide theme toggle */}
      <div className="fixed right-5 top-5 z-50">
        <button
          type="button"
          onClick={() => setIsLight((previous) => !previous)}
          aria-label={isLight ? "Switch to dark mode" : "Switch to light mode"}
          title={isLight ? "Switch to dark mode" : "Switch to light mode"}
          className={`flex h-10 w-10 items-center justify-center rounded-xl transition ${
            isLight
              ? "bg-white text-slate-700 shadow-md hover:bg-slate-100"
              : "bg-[#171717] text-slate-300 hover:bg-[#242424]"
          }`}
        >
          {isLight ? <Moon size={17} /> : <Sun size={17} />}
        </button>
      </div>

      {/* Top navigation */}
      <header
        className={`transition-colors duration-200 ${
          isLight ? "bg-[#f5f5f5]" : "bg-[#090b10]"
        }`}
      >
        <div className="mx-auto flex max-w-[1500px] flex-col gap-4 px-5 py-4 pr-20 lg:flex-row lg:items-center lg:justify-between">
          {/* Brand */}
          <div className="flex shrink-0 items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 shadow-lg shadow-violet-950/40">
              <Code2 size={22} />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1
                  className={`text-base font-bold ${
                    isLight ? "text-slate-900" : "text-white"
                  }`}
                >
                  CodeRAG AI
                </h1>

                <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-500">
                  <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Repository Intelligence
                </span>
              </div>

              <p
                className={`text-xs ${
                  isLight ? "text-slate-500" : "text-slate-400"
                }`}
              >
                Contextual Repository Intelligence
              </p>
            </div>
          </div>

          {/* Repository input */}
          <div className="min-w-0 flex-1 lg:max-w-[710px]">
            <RepoInput
              onRepositoryChange={setCurrentRepository}
              isLight={isLight}
            />
          </div>

          {/* AI Powered */}
          <div
            className={`hidden shrink-0 items-center gap-2 text-xs xl:flex ${
              isLight ? "text-slate-500" : "text-slate-400"
            }`}
          >
            <span
              className={`flex items-center rounded-full px-3 py-2 ${
                isLight
                  ? "bg-white text-slate-600 shadow-sm"
                  : "bg-[#141720] text-slate-400"
              }`}
            >
              <Sparkles className="mr-1 inline" size={13} />
              AI Powered
            </span>
          </div>
        </div>
      </header>

      {/* Main chat area */}
      <div className="mx-auto max-w-[1080px] px-4 pb-8 pt-8 sm:px-6 lg:pt-7">
        <div
          className={`mb-6 pb-3 ${
            isLight ? "border-b border-slate-200" : "border-b border-white/10"
          }`}
        >
          <h2
            className={`text-2xl font-bold tracking-tight sm:text-[27px] ${
              isLight ? "text-slate-900" : "text-white"
            }`}
          >
            Chat with your Codebase
          </h2>

          <p
            className={`mt-2 text-sm sm:text-base ${
              isLight ? "text-slate-500" : "text-slate-400"
            }`}
          >
            Ask questions, trace architecture logic, and inspect citations from
            indexed repository code.
          </p>
        </div>

        <Chatbot currentRepository={currentRepository} isLight={isLight} />

        <footer
          className={`mt-5 text-center text-[11px] tracking-wide ${
            isLight ? "text-slate-400" : "text-slate-500"
          }`}
        >
          Context-aware answers powered by semantic code retrieval
        </footer>
      </div>
    </main>
  );
}
