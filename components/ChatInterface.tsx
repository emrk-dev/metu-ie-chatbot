// Author: emrk-dev
"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  text: string;
  sources?: { title: string; url: string }[];
}

const SUGGESTIONS = [
  "What are the requirements for IE 300?",
  "How do I apply for SGK insurance?",
  "What documents do I need for IE 400?",
  "What is a project-based internship?",
];

function MarkdownText({ text }: { text: string }) {
  // Minimal markdown: bold, bullet points, line breaks
  const lines = text.split("\n");
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        if (line.startsWith("* ") || line.startsWith("- ")) {
          return (
            <div key={i} className="flex gap-2">
              <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-current opacity-60 self-start mt-[7px]" />
              <span dangerouslySetInnerHTML={{ __html: boldify(line.slice(2)) }} />
            </div>
          );
        }
        if (line.trim() === "") return <div key={i} className="h-1" />;
        return (
          <p key={i} dangerouslySetInnerHTML={{ __html: boldify(line) }} />
        );
      })}
    </div>
  );
}

function boldify(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    // Markdown links [text](url) → clickable anchor
    .replace(
      /\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer" class="underline text-blue-600 hover:text-blue-800">$1</a>'
    );
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;

    const userMsg: Message = { role: "user", text: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text.trim(),
          history: messages,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? "Request failed");

      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: data.answer, sources: data.sources },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "Sorry, something went wrong. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="bg-metu-navy text-white px-6 py-4 shadow-md flex-shrink-0">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center font-bold text-metu-navy text-sm flex-shrink-0">
            IE
          </div>
          <div>
            <h1 className="font-semibold text-lg leading-tight">
              METU-IE Summer Practice Assistant
            </h1>
            <p className="text-blue-200 text-xs">
              IE300 &amp; IE400 · Official SP Information
            </p>
          </div>
        </div>
      </header>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto chat-scroll px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.length === 0 && (
            <div className="text-center mt-8">
              <p className="text-gray-500 text-sm mb-6">
                Ask me anything about METU-IE Summer Practice
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    className="text-sm bg-white border border-gray-200 rounded-full px-4 py-2 text-gray-600 hover:bg-metu-navy hover:text-white hover:border-metu-navy transition-colors shadow-sm"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="w-7 h-7 rounded-full bg-metu-navy text-white text-xs flex items-center justify-center flex-shrink-0 mr-2 mt-1">
                  IE
                </div>
              )}
              <div className="max-w-[80%]">
                <div
                  className={`rounded-2xl px-4 py-3 text-sm ${
                    msg.role === "user"
                      ? "bg-metu-navy text-white rounded-tr-sm"
                      : "bg-white text-gray-800 shadow-sm rounded-tl-sm"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <MarkdownText text={msg.text} />
                  ) : (
                    <p>{msg.text}</p>
                  )}
                </div>

                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {[...new Map(msg.sources.map((s) => [s.title + s.url, s])).values()]
                      .slice(0, 3)
                      .map((src, j) => (
                        <a
                          key={j}
                          href={
                            src.url.startsWith("http") ? src.url : "https://sp-ie.metu.edu.tr/en"
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-metu-navy bg-metu-light border border-blue-100 rounded-full px-2 py-0.5 hover:underline"
                        >
                          {src.title.length > 40
                            ? src.title.slice(0, 40) + "…"
                            : src.title}
                        </a>
                      ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="w-7 h-7 rounded-full bg-metu-navy text-white text-xs flex items-center justify-center flex-shrink-0 mr-2 mt-1">
                IE
              </div>
              <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                <div className="flex gap-1 items-center h-4">
                  <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input bar */}
      <div className="flex-shrink-0 border-t bg-white px-4 py-3">
        <div className="max-w-3xl mx-auto flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about IE300/IE400 summer practice…"
            rows={1}
            className="flex-1 resize-none rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-metu-navy focus:border-transparent max-h-32 overflow-y-auto"
            style={{ fieldSizing: "content" } as React.CSSProperties}
            disabled={loading}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            className="bg-metu-navy text-white rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-blue-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
          >
            Send
          </button>
        </div>
        <p className="text-center text-xs text-gray-400 mt-2">
          Answers are based on official METU-IE SP documents · Always verify at{" "}
          <a
            href="https://sp-ie.metu.edu.tr/en"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-gray-600"
          >
            sp-ie.metu.edu.tr
          </a>
        </p>
      </div>
    </div>
  );
}
