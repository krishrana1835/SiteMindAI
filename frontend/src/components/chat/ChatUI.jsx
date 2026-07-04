import React, { useState, useEffect, useRef } from "react";
import {
  ArrowUp,
  Bot,
  CheckCircle2,
  Boxes,
  ExternalLink,
  FileSearch,
  Globe2,
  Loader2,
  Plus,
  Hexagon,
  Sparkles,
  Trash2,
} from "lucide-react";

const STAGE_ICONS = {
  crawling: Globe2,
  parsing: FileSearch,
  embedding: Boxes,
  ready: Sparkles,
};

export function StatusDot({ active }) {
  return (
    <span className="relative flex h-2 w-2 shrink-0">
      {active && (
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-black opacity-75" />
      )}
      <span
        className={`relative inline-flex h-2 w-2 rounded-full ${active ? "bg-black" : "bg-slate-300"
          }`}
      />
    </span>
  );
}

export function Header({ onNewChat }) {
  return (
    <header className="z-10 flex h-16 w-full shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4">
      <div className="flex items-center gap-2">
        <Hexagon className="h-5 w-5 text-black" strokeWidth={2.25} />
        <h1 className="text-[17px] font-semibold tracking-tight text-black">
          SiteMind AI
        </h1>
      </div>
      <span className="hidden rounded border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-[11px] uppercase tracking-wide text-slate-500 sm:inline-block">
        Multi-Domain Ingestion
      </span>
      <button
        onClick={onNewChat}
        className="flex items-center gap-1 rounded bg-black px-3 py-1.5 text-white transition-all hover:bg-black/85 active:scale-[0.97]"
      >
        <Plus className="h-4 w-4" />
        <span className="font-mono text-[13px]">New Chat</span>
      </button>
    </header>
  );
}

export function SiteManager({
  sites,
  onAddSite,
  onRemoveSite,
  url,
  setUrl,
  indexing,
}) {
  const isRunning = indexing.status === "running";

  return (
    <div className="shrink-0 border-b border-slate-200 bg-white p-4">
      <div className="flex flex-col gap-3">
        <div className="flex w-full gap-2">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={isRunning}
            placeholder="https://example.com"
            className="flex-1 rounded border border-slate-300 bg-white px-3 py-2 text-[14px] placeholder:text-slate-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black disabled:bg-slate-50 disabled:text-slate-400"
          />
          <button
            onClick={onAddSite}
            disabled={isRunning || !url}
            className="flex shrink-0 items-center gap-2 rounded bg-black px-4 py-2 font-mono text-[13px] text-white transition-colors hover:bg-black/85 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isRunning ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">
              {isRunning ? "Indexing…" : "Add Index"}
            </span>
            <span className="sm:hidden">{isRunning ? "…" : "Index"}</span>
          </button>
        </div>

        {sites && sites.length > 0 && (
          <div className="flex flex-col gap-2">
            <h3 className="text-[11px] font-mono uppercase tracking-wide text-slate-500">
              Indexed Sites
            </h3>
            <ul className="flex flex-wrap gap-2">
              {sites.map((site) => (
                <li
                  key={site.id}
                  className="flex items-center gap-2 rounded bg-slate-100 px-2 py-1"
                >
                  <a
                    href={site.originalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-[12px] text-slate-700 hover:underline"
                  >
                    {site.title || site.originalUrl}
                  </a>
                  <button
                    onClick={() => onRemoveSite(site.originalUrl)}
                    className="text-slate-500 hover:text-red-500"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export function IndexingLoaderCard({ indexing }) {
  const [displayProgress, setDisplayProgress] = useState(0);

  useEffect(() => {
    setDisplayProgress(indexing.progress);
  }, [indexing.progress]);

  return (
    <div className="w-full rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="font-medium">
            Crawling through pages...
          </span>
        </div>

        <span className="font-mono text-sm">
          {Math.floor(displayProgress)}%
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-black transition-all duration-500 ease-out"
          style={{ width: `${displayProgress}%` }}
        />
      </div>

      <p className="mt-3 text-sm text-slate-500">
        Discovering pages, extracting content and preparing your knowledge base.
      </p>
    </div>
  );
}

export function SourceChip({ path }) {
  return (
    <a
      href={path}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 rounded border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-[11px] text-black transition-colors hover:bg-slate-100"
    >
      {path}
      <ExternalLink className="h-3 w-3" />
    </a>
  );
}

function renderInline(text) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={index}>{part.slice(2, -2)}</strong>
    ) : (
      <React.Fragment key={index}>{part}</React.Fragment>
    ),
  );
}

export function AssistantBubble({ msg, streaming }) {
  const lines = msg.text.split("\n").filter(Boolean);

  return (
    <div className="flex w-full flex-col items-start gap-2">
      <div className="mb-1 ml-1 flex items-center gap-2 text-black">
        <Bot className="h-4 w-4" />
        <span className="font-mono text-[11px] font-semibold uppercase tracking-wide">
          SiteMind AI
        </span>
      </div>
      <div className="w-full max-w-[95%] rounded-lg rounded-tl-sm border border-slate-200 bg-white px-4 py-3 text-black shadow-sm sm:max-w-[85%]">
        {lines.map((line, index) => {
          const isBullet = line.trim().startsWith("- ");
          return isBullet ? (
            <p key={index} className="relative mb-1.5 pl-4 text-[14px] leading-relaxed">
              <span className="absolute left-0">•</span>
              {renderInline(line.replace(/^- /, ""))}
            </p>
          ) : (
            <p key={index} className="mb-2 text-[14px] leading-relaxed">
              {renderInline(line)}
            </p>
          );
        })}
        {streaming && (
          <span className="ml-1 inline-block h-4 w-2 animate-pulse align-middle bg-black" />
        )}
      </div>
      {msg.sources?.length > 0 && (
        <div className="ml-1 mt-1 flex flex-wrap gap-2">
          <span className="mr-1 self-center font-mono text-[11px] text-slate-500">
            Sources:
          </span>
          {msg.sources.map((source) => (
            <SourceChip key={source} path={source} />
          ))}
        </div>
      )}
    </div>
  );
}

export function UserBubble({ msg }) {
  return (
    <div className="flex w-full flex-col items-end">
      <div className="max-w-[85%] rounded-lg rounded-tr-sm border border-slate-200 bg-slate-50 px-4 py-3 text-black shadow-sm sm:max-w-[75%]">
        <p className="text-[14px]">{msg.text}</p>
      </div>
      <span className="mr-1 mt-1 font-mono text-[11px] text-slate-500">You</span>
    </div>
  );
}

export function ChatWindow({ messages, indexing, thinking }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, indexing.status, indexing.progress, thinking]);

  return (
    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
      {messages.map((message) =>
        message.role === "user" ? (
          <UserBubble key={message.id} msg={message} />
        ) : (
          <AssistantBubble
            key={message.id}
            msg={message}
            streaming={message.streaming}
          />
        ),
      )}

      {indexing.status === "running" && <IndexingLoaderCard indexing={indexing} />}

      {thinking && (
        <div className="ml-1 flex items-center gap-2 text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="font-mono text-[13px]">Thinking…</span>
        </div>
      )}

      <div ref={bottomRef} className="h-1 shrink-0" />
    </div>
  );
}

export function ChatInput({ value, setValue, onSend, disabled, placeholder }) {
  const taRef = useRef(null);

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSend();
    }
  };

  useEffect(() => {
    if (!taRef.current) return;
    taRef.current.style.height = "auto";
    taRef.current.style.height = `${Math.min(taRef.current.scrollHeight, 120)}px`;
  }, [value]);

  return (
    <div className="shrink-0 border-t border-slate-200 bg-white p-4">
      <div className="relative flex items-center">
        <textarea
          ref={taRef}
          rows={1}
          value={value}
          disabled={disabled}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full resize-none rounded-lg border border-slate-300 bg-white py-3 pl-4 pr-12 text-[14px] shadow-sm placeholder:text-slate-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black disabled:bg-slate-50 disabled:text-slate-400"
          style={{ minHeight: 48 }}
        />
        <button
          onClick={onSend}
          disabled={disabled || !value.trim()}
          className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded bg-black text-white transition-colors hover:bg-black/85 disabled:bg-slate-300"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      </div>
      <p className="mt-2 text-center text-[11px] text-slate-400 sm:text-left">
        Answers are strictly grounded in crawled site content. If the information
        isn't present, the AI will notify you.
      </p>
    </div>
  );
}