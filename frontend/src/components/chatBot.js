"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import {
  ArrowUp,
  FileCode2,
  FileText,
  Copy,
  Check,
  Zap,
  Database,
  CircleCheck,
} from "lucide-react";

function CodeBlock({ children, className }) {
  const [copied, setCopied] = useState(false);

  const language = className?.replace("language-", "") || "CODE";

  const code = String(children).replace(/\n$/, "");

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);

      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="my-4 overflow-hidden rounded-xl bg-[#090c12]">
      <div className="flex items-center justify-between bg-[#171b26] px-4 py-2.5">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500/90" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400/90" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/90" />

          <span className="ml-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            {language}
          </span>
        </div>

        <button
          onClick={copyCode}
          type="button"
          className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] text-slate-300 transition hover:bg-white/5"
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}

          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      <pre className="overflow-x-auto p-4 text-[13px] leading-6 text-sky-200">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function AssistantMarkdown({ content, isLight }) {
  return (
    <div
      className={`break-words text-sm leading-7 ${
        isLight ? "text-slate-700" : "text-slate-200"
      }`}
    >
      <ReactMarkdown
        components={{
          h1: ({ children }) => (
            <h3
              className={`mb-2 mt-4 text-lg font-bold ${
                isLight ? "text-slate-900" : "text-white"
              }`}
            >
              {children}
            </h3>
          ),

          h2: ({ children }) => (
            <h3
              className={`mb-2 mt-4 text-base font-bold ${
                isLight ? "text-slate-900" : "text-white"
              }`}
            >
              {children}
            </h3>
          ),

          h3: ({ children }) => (
            <h4
              className={`mb-2 mt-3 font-semibold ${
                isLight ? "text-slate-900" : "text-white"
              }`}
            >
              {children}
            </h4>
          ),

          p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,

          ul: ({ children }) => (
            <ul className="mb-3 list-disc space-y-1 pl-5">{children}</ul>
          ),

          ol: ({ children }) => (
            <ol className="mb-3 list-decimal space-y-1 pl-5">{children}</ol>
          ),

          li: ({ children }) => <li>{children}</li>,

          strong: ({ children }) => (
            <strong
              className={`font-semibold ${
                isLight ? "text-slate-900" : "text-white"
              }`}
            >
              {children}
            </strong>
          ),

          blockquote: ({ children }) => (
            <blockquote
              className={`my-3 border-l-2 border-violet-500 pl-3 ${
                isLight ? "text-slate-500" : "text-slate-400"
              }`}
            >
              {children}
            </blockquote>
          ),

          code: ({ children, className }) => {
            const isBlock = Boolean(className);

            return isBlock ? (
              <CodeBlock className={className}>{children}</CodeBlock>
            ) : (
              <code
                className={`rounded px-1.5 py-0.5 font-mono text-[12px] ${
                  isLight
                    ? "bg-slate-200 text-pink-600"
                    : "bg-[#202433] text-pink-300"
                }`}
              >
                {children}
              </code>
            );
          },

          pre: ({ children }) => <>{children}</>,

          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="text-violet-400 underline underline-offset-2 hover:text-violet-300"
            >
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

function SourceCard({ source, index, isLight }) {
  const hasLines = source.startLine != null && source.endLine != null;

  const hasScore = typeof source.score === "number";

  const scorePercentage = hasScore
    ? Math.max(0, Math.min(100, source.score * 100))
    : null;

  return (
    <div
      className={`group flex min-w-0 items-center gap-3 rounded-xl p-3 transition duration-200 ${
        isLight
          ? "bg-slate-100 hover:bg-slate-200"
          : "bg-[#171b25] hover:bg-[#1b1f2b]"
      }`}
    >
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[10px] font-semibold ${
          isLight
            ? "bg-slate-200 text-slate-500"
            : "bg-[#10131b] text-slate-500"
        }`}
      >
        {String(index + 1).padStart(2, "0")}
      </div>

      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
          isLight
            ? "bg-violet-100 text-violet-600"
            : "bg-violet-500/10 text-violet-400"
        }`}
      >
        <FileCode2 size={15} />
      </div>

      <div className="min-w-0 flex-1">
        <p
          className={`truncate text-xs font-medium ${
            isLight ? "text-slate-800" : "text-slate-200"
          }`}
          title={source.filePath}
        >
          {source.filePath || "Unknown source"}
        </p>

        <div
          className={`mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] ${
            isLight ? "text-slate-500" : "text-slate-500"
          }`}
        >
          {hasLines && (
            <span>
              Lines {source.startLine}–{source.endLine}
            </span>
          )}

          {hasLines && hasScore && (
            <span className={isLight ? "text-slate-300" : "text-slate-700"}>
              •
            </span>
          )}

          {hasScore && (
            <span className="font-medium text-emerald-500">
              {scorePercentage.toFixed(1)}% match
            </span>
          )}
        </div>

        {hasScore && (
          <div
            className={`mt-2 h-1 w-full max-w-[180px] overflow-hidden rounded-full ${
              isLight ? "bg-slate-200" : "bg-white/[0.06]"
            }`}
          >
            <div
              className="h-full rounded-full bg-emerald-500/70 transition-all"
              style={{
                width: `${scorePercentage}%`,
              }}
            />
          </div>
        )}
      </div>

      <FileText
        size={14}
        className={`shrink-0 transition ${
          isLight
            ? "text-slate-400 group-hover:text-slate-600"
            : "text-slate-600 group-hover:text-slate-400"
        }`}
      />
    </div>
  );
}

export default function Chatbot({ currentRepository, isLight }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const sendMessage = async (e) => {
    e.preventDefault();

    const query = input.trim();

    if (!query || loading) {
      return;
    }

    if (!currentRepository) {
      setError("Please analyze a GitHub repository first.");
      return;
    }

    setInput("");
    setError("");

    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: query,
      },
    ]);

    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
          repository: currentRepository,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to get an answer.");
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.answer || "No answer was returned.",
          sources: data.sources || [],
        },
      ]);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      className={`relative flex min-h-[72vh] flex-col transition-colors duration-200 ${
        isLight ? "text-slate-900" : "text-white"
      }`}
    >
      {/* Repository context */}
      <div
        className={`mb-4 rounded-xl px-4 py-3 transition-colors duration-200 ${
          isLight ? "bg-white shadow-sm" : "bg-[#12151e]"
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
              isLight
                ? "bg-violet-100 text-violet-600"
                : "bg-violet-500/10 text-violet-400"
            }`}
          >
            <Database size={15} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              Repository context
            </p>

            <p
              className={`mt-0.5 truncate text-xs font-medium ${
                isLight ? "text-slate-800" : "text-slate-200"
              }`}
              title={currentRepository || "No repository selected"}
            >
              {currentRepository || "No repository selected"}
            </p>
          </div>

          {currentRepository ? (
            <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-medium text-emerald-500">
              <CircleCheck size={11} />
              Active
            </div>
          ) : (
            <div
              className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-medium ${
                isLight
                  ? "bg-slate-100 text-slate-500"
                  : "bg-white/[0.03] text-slate-500"
              }`}
            >
              Not selected
            </div>
          )}
        </div>
      </div>

      {/* Conversation */}
      <div className="flex-1 space-y-6 pb-6">
        {messages.length === 0 && (
          <div className="flex min-h-[340px] flex-col items-center justify-center text-center">
            <div
              className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${
                isLight
                  ? "bg-violet-100 text-violet-600"
                  : "bg-violet-500/10 text-violet-300"
              }`}
            >
              <Zap size={22} />
            </div>

            <h3
              className={`text-base font-semibold ${
                isLight ? "text-slate-900" : "text-slate-200"
              }`}
            >
              Ask your codebase anything
            </h3>

            <p
              className={`mt-2 max-w-md text-sm leading-6 ${
                isLight ? "text-slate-500" : "text-slate-500"
              }`}
            >
              Understand code, trace functions, explore architecture, and find
              relevant files using AI-powered retrieval.
            </p>

            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {[
                "How is the Gemini API integrated?",
                "Explain the project architecture",
                "Where is vector search implemented?",
              ].map((question) => (
                <button
                  key={question}
                  type="button"
                  onClick={() => setInput(question)}
                  className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition active:scale-[0.98] ${
                    isLight
                      ? "bg-violet-600 text-white shadow-lg shadow-violet-900/10 hover:bg-violet-500"
                      : "bg-violet-600 text-white shadow-lg shadow-violet-900/20 hover:bg-violet-500"
                  }`}
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message, index) => (
          <div key={index}>
            {message.role === "user" ? (
              <div className="flex justify-end gap-3">
                <div
                  className={`max-w-[85%] rounded-2xl rounded-tr-sm px-4 py-3.5 text-sm leading-6 sm:max-w-[72%] ${
                    isLight
                      ? "bg-violet-100 text-slate-800"
                      : "bg-[#17152f] text-slate-100"
                  }`}
                >
                  {message.content}
                </div>

                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                    isLight
                      ? "bg-slate-200 text-slate-700"
                      : "bg-[#202838] text-slate-200"
                  }`}
                >
                  U
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <div
                  className={`mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                    isLight
                      ? "bg-violet-100 text-violet-600"
                      : "bg-[#111521] text-violet-300"
                  }`}
                >
                  <Zap size={17} />
                </div>

                <div
                  className={`min-w-0 flex-1 rounded-2xl p-4 sm:p-6 ${
                    isLight ? "bg-white shadow-sm" : "bg-[#12151e]"
                  }`}
                >
                  <AssistantMarkdown
                    content={message.content}
                    isLight={isLight}
                  />

                  {message.sources?.length > 0 && (
                    <div className="mt-6 pt-5">
                      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <div
                            className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                              isLight
                                ? "bg-violet-100 text-violet-600"
                                : "bg-violet-500/10 text-violet-400"
                            }`}
                          >
                            <FileText size={13} />
                          </div>

                          <div>
                            <h4
                              className={`text-xs font-semibold ${
                                isLight ? "text-slate-800" : "text-slate-200"
                              }`}
                            >
                              Sources & Citations
                            </h4>

                            <p className="mt-0.5 text-[10px] text-slate-500">
                              Retrieved from the analyzed repository
                            </p>
                          </div>
                        </div>

                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${
                            isLight
                              ? "bg-slate-100 text-slate-500"
                              : "bg-white/[0.03] text-slate-400"
                          }`}
                        >
                          {message.sources.length}{" "}
                          {message.sources.length === 1 ? "source" : "sources"}
                        </span>
                      </div>

                      <div className="grid gap-2.5 lg:grid-cols-2">
                        {message.sources.map((source, sourceIndex) => (
                          <SourceCard
                            key={`${source.filePath}-${sourceIndex}`}
                            source={source}
                            index={sourceIndex}
                            isLight={isLight}
                          />
                        ))}
                      </div>

                      <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-500">
                        <span className="h-1 w-1 rounded-full bg-slate-500" />
                        Source relevance is based on retrieval and reranking
                        scores.
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Loading */}
        {loading && (
          <div className="flex items-start gap-3">
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                isLight
                  ? "bg-violet-100 text-violet-600"
                  : "bg-[#111521] text-violet-300"
              }`}
            >
              <Zap size={17} className="animate-pulse" />
            </div>

            <div
              className={`rounded-xl px-4 py-3 ${
                isLight ? "bg-white shadow-sm" : "bg-[#12151e]"
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-violet-400 [animation-delay:-0.3s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-violet-400 [animation-delay:-0.15s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-violet-400" />
                </div>

                <span className="text-sm text-slate-400">
                  Searching your codebase...
                </span>
              </div>

              <p className="mt-1 text-[10px] text-slate-500">
                Retrieving relevant code and generating an answer
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div
          role="alert"
          className={`mb-3 flex items-start gap-3 rounded-xl px-4 py-3 ${
            isLight ? "bg-red-50" : "bg-red-500/[0.06]"
          }`}
        >
          <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-red-400">
            !
          </div>

          <div className="min-w-0">
            <p className="text-xs font-semibold text-red-400">
              Something went wrong
            </p>

            <p className="mt-1 break-words text-xs leading-5 text-red-400/80">
              {error}
            </p>
          </div>
        </div>
      )}

      {/* Message composer */}
      <form
        onSubmit={sendMessage}
        className={`sticky bottom-3 rounded-2xl p-3 shadow-2xl sm:p-4 ${
          isLight
            ? "bg-white shadow-slate-300/30"
            : "bg-[#12151e] shadow-black/30"
        }`}
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              e.currentTarget.form?.requestSubmit();
            }
          }}
          placeholder="Ask a question about your code or architecture..."
          rows={2}
          disabled={loading}
          className={`max-h-36 min-h-[65px] w-full resize-y bg-transparent px-2 py-1 text-sm leading-6 outline-none disabled:opacity-50 ${
            isLight
              ? "text-slate-800 placeholder:text-slate-400"
              : "text-slate-100 placeholder:text-slate-500"
          }`}
        />

        <div className="mt-2 flex items-center justify-between gap-3 pt-2">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3 px-2 text-[11px] text-slate-500">
            <span>
              <span className="text-violet-400">@</span> file
            </span>

            <span>
              <span className="text-emerald-500">#</span> symbol
            </span>

            <span className="hidden sm:inline">
              Enter to send · Shift + Enter for new line
            </span>

            {currentRepository && (
              <div
                className={`flex min-w-0 max-w-[260px] items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-medium ${
                  isLight
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-emerald-500/[0.07] text-emerald-400"
                }`}
                title={currentRepository}
              >
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />

                <span className="truncate">{currentRepository}</span>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="flex shrink-0 items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-violet-900/20 transition hover:bg-violet-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-violet-600/40 disabled:opacity-70 disabled:shadow-none"
          >
            {loading ? "Thinking..." : "Send"}

            <ArrowUp size={15} />
          </button>
        </div>
      </form>
    </section>
  );
}
