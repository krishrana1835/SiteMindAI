import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  ChatInput,
  ChatWindow,
  SiteManager,
  Header,
} from "../components/chat/ChatUI";
import { useChat } from "../api-hooks/chat";
import {
  useIndexSite,
  useRemoveSite,
  useGetSites,
} from "../api-hooks/crawl";

export default function ChattingPage() {
  const queryClient = useQueryClient();
  const [url, setUrl] = useState("https://example.com");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);

  const [indexing, setIndexing] = useState({
    status: "idle",
    progress: 0,
  });

  const { data: sitesData } = useGetSites();
  const sites = sitesData?.data || [];

  const indexMutation = useIndexSite();
  const removeMutation = useRemoveSite();
  const chatMutation = useChat();

  useEffect(() => {
    if (indexing.status !== "running") return;

    const timer = setInterval(() => {
      setIndexing((prev) => {
        if (prev.progress >= 99) return prev;
        let increment =
          prev.progress < 50
            ? Math.random() * 5 + 4
            : prev.progress < 80
            ? Math.random() * 1.5 + 1
            : Math.random() * 0.3 + 0.1;
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
    if (sites.length === 0) return "Please index a site to start chatting.";
    return "Ask a question about the indexed website(s)...";
  }, [indexing.status, sites.length]);

  const handleAddSite = async () => {
    if (!url || indexMutation.isPending) return;

    setIndexing({ status: "running", progress: 0 });

    try {
      await indexMutation.mutateAsync({ url });
      queryClient.invalidateQueries(["sites"]);
      setIndexing({ status: "ready", progress: 100 });
      setUrl("");
    } catch {
      setIndexing({ status: "idle", progress: 0 });
    }
  };

  const handleRemoveSite = async (siteUrl) => {
    if (removeMutation.isPending) return;
    try {
      await removeMutation.mutateAsync({ url: siteUrl });
      queryClient.invalidateQueries(["sites"]);
    } catch (error) {
      console.error("Failed to remove site:", error);
    }
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || indexing.status === "running" || sites.length === 0) return;

    const userMsg = { id: crypto.randomUUID(), role: "user", text };
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
      const siteIds = sites.map((s) => s.id);
      await chatMutation.mutateAsync({
        message: text,
        siteIds,
        onChunk: (_chunk, fullText) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, text: fullText, streaming: true } : m
            )
          );
        },
        onSources: (sources) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, sources, streaming: false } : m
            )
          );
        },
      });
    } catch (err) {
        console.error(err)
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                text: "I couldn't get a response from the backend. Please try again.",
                sources: [],
                streaming: false,
              }
            : m
        )
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
        <SiteManager
          sites={sites}
          url={url}
          setUrl={setUrl}
          indexing={indexing}
          onAddSite={handleAddSite}
          onRemoveSite={handleRemoveSite}
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
            chatMutation.isPending ||
            sites.length === 0
          }
          placeholder={inputPlaceholder}
        />
      </main>
    </div>
  );
}
