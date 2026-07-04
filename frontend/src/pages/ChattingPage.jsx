import { useEffect, useMemo, useState } from "react";
import {
  ChatInput,
  ChatWindow,
  CrawlBar,
  Header,
} from "../components/chat/ChatUI";
import { useChat } from "../api-hooks/chat";
import { useCrawl } from "../api-hooks/crawl";

export default function ChattingPage() {
  const [url, setUrl] = useState("https://example.com");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);

  const [indexing, setIndexing] = useState({
    status: "idle",
    progress: 0,
  });

  const crawlMutation = useCrawl();
  const chatMutation = useChat();

  useEffect(() => {
    if (indexing.status !== "running") return;

    const timer = setInterval(() => {
      setIndexing((prev) => {
        if (prev.progress >= 99) return prev;

        let increment;

        if (prev.progress < 50) {
          increment = Math.random() * 5 + 4;
        } else if (prev.progress < 80) {
          increment = Math.random() * 1.5 + 1;
        } else {
          increment = Math.random() * 0.3 + 0.1; 
        }

        return {
          ...prev,
          progress: Math.min(99, prev.progress + increment),
        };
      });
    }, 300);

    return () => clearInterval(timer);
  }, [indexing.status]);

  const inputPlaceholder = useMemo(() => {
    if (indexing.status === "running")
      return "Indexing in progress — please wait…";

    return "Ask a question about the indexed website...";
  }, [indexing.status]);

  const handleCrawl = async () => {
    if (!url || crawlMutation.isPending) return;

    setMessages([]);

    setIndexing({
      status: "running",
      progress: 0,
    });

    try {
      await crawlMutation.mutateAsync({ url });

      setIndexing({
        status: "ready",
        progress: 100,
      });
    } catch {
      setIndexing({
        status: "idle",
        progress: 0,
      });
    }
  };

  const handleSend = async () => {
    const text = input.trim();

    if (!text || indexing.status === "running") return;

    const userMsg = {
      id: crypto.randomUUID(),
      role: "user",
      text,
    };

    const assistantId = crypto.randomUUID();

    setMessages((prev) => [
      ...prev,
      userMsg,
      {
        id: assistantId,
        role: "assistant",
        text: "",
        sources: [],
        streaming: true,
      },
    ]);

    setInput("");
    setThinking(true);

    try {
      const response = await chatMutation.mutateAsync({
        message: text,
        onChunk: (_chunk, fullText) => {
          setMessages((prev) =>
            prev.map((message) =>
              message.id === assistantId
                ? {
                    ...message,
                    text: fullText,
                    streaming: true,
                  }
                : message,
            ),
          );
        },
        onSources: (sources) => {
          setMessages((prev) =>
            prev.map((message) =>
              message.id === assistantId
                ? {
                    ...message,
                    sources,
                    streaming: false,
                  }
                : message,
            ),
          );
        },
      });

      setMessages((prev) =>
        prev.map((message) =>
          message.id === assistantId
            ? {
                ...message,
                text: response.text,
                sources: response.sources,
                streaming: false,
              }
            : message,
        ),
      );
    } catch {
      setMessages((prev) =>
        prev.map((message) =>
          message.id === assistantId
            ? {
                ...message,
                text:
                  "I couldn't get a response from the backend. Please try again.",
                sources: [],
                streaming: false,
              }
            : message,
        ),
      );
    } finally {
      setThinking(false);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setInput("");
    setUrl("https://example.com");
  };

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-slate-50 font-sans text-black">
      <Header onNewChat={handleNewChat} />

      <main className="relative flex min-h-0 flex-1 flex-col">
        <CrawlBar
          url={url}
          setUrl={setUrl}
          indexing={indexing}
          onCrawl={handleCrawl}
        />

        <ChatWindow
          messages={messages}
          indexing={indexing}
          thinking={thinking}
        />

        <ChatInput
          value={input}
          setValue={setInput}
          onSend={handleSend}
          disabled={
            indexing.status === "running" ||
            thinking ||
            chatMutation.isPending
          }
          placeholder={inputPlaceholder}
        />
      </main>
    </div>
  );
}