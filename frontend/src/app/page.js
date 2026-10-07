"use client";

import { useState } from "react";
import RepoInput from "../components/repoInput";
import Chatbot from "../components/chatBot";
import { Code2, Sparkles } from "lucide-react";

export default function Home() {
  const [currentRepository, setCurrentRepository] = useState("");

  return (
    <main className="min-h-screen bg-[#090b10] text-white">
      {/* Top navigation */}
      <header className="border-b border-white/10 bg-[#0c0e14]">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex shrink-0 items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 shadow-lg shadow-violet-950/40">
              <Code2 size={22} />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold">CodeRAG AI</h1>

                <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                  <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Repository Intelligence
                </span>
              </div>

              <p className="text-xs text-slate-400">
                Contextual Repository Intelligence
              </p>
            </div>
          </div>

          <div className="min-w-0 flex-1 lg:max-w-[710px]">
            <RepoInput onRepositoryChange={setCurrentRepository} />
          </div>

          <div className="hidden shrink-0 items-center gap-2 text-xs text-slate-400 xl:flex">
            <span className="rounded-full border border-white/10 bg-[#141720] px-3 py-2">
              <Sparkles className="mr-1 inline" size={13} />
              AI Powered
            </span>
          </div>
        </div>
      </header>

      {/* Main chat area */}
      <div className="mx-auto max-w-[1080px] px-4 pb-8 pt-8 sm:px-6 lg:pt-7">
        <div className="mb-6 border-b border-white/15 pb-3">
          <h2 className="text-2xl font-bold tracking-tight sm:text-[27px]">
            Chat with your Codebase
          </h2>

          <p className="mt-2 text-sm text-slate-400 sm:text-base">
            Ask questions, trace architecture logic, and inspect citations from
            indexed repository code.
          </p>
        </div>

        <Chatbot currentRepository={currentRepository} />

        <footer className="mt-5 text-center text-[11px] tracking-wide text-slate-500">
          Context-aware answers powered by semantic code retrieval
        </footer>
      </div>
    </main>
  );
}
