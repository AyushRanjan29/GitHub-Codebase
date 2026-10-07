"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { ArrowUp, FileCode2, FileText, Copy, Check, Zap } from "lucide-react";

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
    <div className="my-4 overflow-hidden rounded-xl border border-white/10 bg-[#090c12]">
      <div className="flex items-center justify-between border-b border-white/10 bg-[#171b26] px-4 py-2.5">
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
          className="flex items-center gap-1.5 rounded-md border border-white/10 px-2.5 py-1 text-[11px] text-slate-300 transition hover:bg-white/5"
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

function AssistantMarkdown({ content }) {
  return (
    <div className="break-words text-sm leading-7 text-slate-200">
      <ReactMarkdown
        components={{
          h1: ({ children }) => (
            <h3 className="mb-2 mt-4 text-lg font-bold text-white">
              {children}
            </h3>
          ),
          h2: ({ children }) => (
            <h3 className="mb-2 mt-4 text-base font-bold text-white">
              {children}
            </h3>
          ),
          h3: ({ children }) => (
            <h4 className="mb-2 mt-3 font-semibold text-white">{children}</h4>
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
            <strong className="font-semibold text-white">{children}</strong>
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-3 border-l-2 border-violet-500 pl-3 text-slate-400">
              {children}
            </blockquote>
          ),
          code: ({ children, className }) => {
            const isBlock = Boolean(className);
            return isBlock ? (
              <CodeBlock className={className}>{children}</CodeBlock>
            ) : (
              <code className="rounded border border-white/10 bg-[#202433] px-1.5 py-0.5 font-mono text-[12px] text-pink-300">
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
              className="text-violet-300 underline underline-offset-2 hover:text-violet-200"
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

function SourceCard({ source }) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-lg border border-white/[0.08] bg-[#191d28] p-3 transition hover:border-violet-500/40">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-violet-500/20 bg-violet-500/10 text-violet-400">
        <FileCode2 size={16} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="break-all text-xs font-medium text-slate-200">
          {source.filePath}
        </p>
        <p className="mt-1 text-[11px] text-slate-400">
          {source.startLine != null && source.endLine != null
            ? `Lines ${source.startLine}-${source.endLine}`
            : "Source file"}
          {typeof source.score === "number" && (
            <>
              <span className="mx-1.5">·</span>
              <span className="text-emerald-400">
                Match: {source.score.toFixed(3)}
              </span>
            </>
          )}
        </p>
      </div>

      <FileText size={15} className="shrink-0 text-slate-500" />
    </div>
  );
}

export default function Chatbot({ currentRepository }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const sendMessage = async (e) => {
    e.preventDefault();

    const query = input.trim();
    if (!query || loading) return;

    if (!currentRepository) {
      setError("Please analyze a GitHub repository first.");
      return;
    }

    setInput("");
    setError("");
    setMessages((prev) => [...prev, { role: "user", content: query }]);
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query, repository: currentRepository }),
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
    <section className="flex min-h-[72vh] flex-col">
      {/* Conversation */}
      <div className="flex-1 space-y-6 pb-6">
        {messages.length === 0 && (
          <div className="flex min-h-[340px] flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-500/20 bg-violet-500/10 text-violet-300">
              <Zap size={22} />
            </div>
            <h3 className="text-base font-semibold text-slate-200">
              Ask your codebase anything
            </h3>
            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
              Understand code, trace functions, explore architecture, and find
              relevant files using AI-powered retrieval.
            </p>
            <button
              type="button"
              onClick={() =>
                setInput(
                  "How is the Gemini API integrated in our backend service?",
                )
              }
              className="mt-5 rounded-lg border border-white/10 bg-[#141720] px-4 py-2 text-xs text-slate-300 transition hover:border-violet-500/40 hover:bg-[#191d28]"
            >
              Try: How is the Gemini API integrated?
            </button>
          </div>
        )}

        {messages.map((message, index) => (
          <div key={index}>
            {message.role === "user" ? (
              <div className="flex justify-end gap-3">
                <div className="max-w-[85%] rounded-2xl rounded-tr-sm border border-violet-500/30 bg-[#17152f] px-4 py-3.5 text-sm leading-6 text-slate-100 sm:max-w-[72%]">
                  {message.content}
                </div>
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-600 bg-[#202838] text-xs font-semibold text-slate-200">
                  U
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-violet-500/40 bg-[#111521] text-violet-300">
                  <Zap size={17} />
                </div>

                <div className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-[#12151e] p-4 shadow-xl shadow-black/10 sm:p-6">
                  <AssistantMarkdown content={message.content} />

                  {message.sources?.length > 0 && (
                    <div className="mt-5 border-t border-white/10 pt-4">
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                        <h4 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                          <FileText size={13} />
                          Sources & Citations
                        </h4>
                        <span className="text-[11px] text-slate-500">
                          {message.sources.length} files referenced
                        </span>
                      </div>

                      <div className="grid gap-2 sm:grid-cols-2">
                        {message.sources.map((source, sourceIndex) => (
                          <SourceCard
                            key={`${source.filePath}-${sourceIndex}`}
                            source={source}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-violet-500/30 bg-[#111521] text-violet-300">
              <Zap size={17} className="animate-pulse" />
            </div>
            <div className="rounded-xl border border-white/10 bg-[#12151e] px-4 py-3 text-sm text-slate-400">
              Searching the codebase and generating an answer...
            </div>
          </div>
        )}
      </div>

      {error && (
        <p
          role="alert"
          className="mb-3 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-sm text-red-400"
        >
          {error}
        </p>
      )}

      {/* Message composer */}
      <form
        onSubmit={sendMessage}
        className="sticky bottom-3 rounded-2xl border border-white/10 bg-[#12151e] p-3 shadow-2xl shadow-black/30 sm:p-4"
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
          className="max-h-36 min-h-[65px] w-full resize-y bg-transparent px-2 py-1 text-sm leading-6 text-slate-100 outline-none placeholder:text-slate-500 disabled:opacity-50"
        />

        <div className="mt-2 flex items-center justify-between border-t border-white/10 pt-2">
          <div className="flex flex-wrap items-center gap-3 px-2 text-[11px] text-slate-500">
            <span>
              <span className="text-violet-300">@</span> file
            </span>
            <span>
              <span className="text-emerald-400">#</span> symbol
            </span>
            <span className="hidden sm:inline">
              Enter to send · Shift + Enter for new line
            </span>
          </div>

          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="flex shrink-0 items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? "Thinking..." : "Send"}
            <ArrowUp size={15} />
          </button>
        </div>
      </form>
    </section>
  );
}
