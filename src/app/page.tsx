"use client";

import { useState, useEffect, useRef } from "react";

interface Message {
  sender: "user" | "ai" | "agent";
  content: string;
}

interface ChatSession {
  _id: string;
  messages: Message[];
}

export default function InteractiveSandboxHome() {
  const orgId = "65f1a23e8f9b4c0017a5bc8d";

  const [docContent, setDocContent] = useState(
    "Our standard shipping takes 3-5 business days and is free for orders over $50. Returns are accepted within 30 days.",
  );
  const [ingestStatus, setIngestStatus] = useState("");
  const [ingestLoading, setIngestLoading] = useState(false);

  const [chatMessage, setChatMessage] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [widgetMessages, setWidgetMessages] = useState<Message[]>([
    { sender: "ai", content: "Hello! Test my knowledge about this business." },
  ]);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const [dashboardSessions, setDashboardSessions] = useState<ChatSession[]>([]);
  const [dashboardLoading, setDashboardLoading] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchDashboardLogs = async () => {
    try {
      const res = await fetch(`/api/dashboard/chats?orgId=${orgId}`);
      const data = await res.json();
      if (data.success) {
        setDashboardSessions(data.sessions);
      }
    } catch (_err) {
      console.error("Failed to fetch dashboard logs");
    } finally {
      setDashboardLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardLogs();
    const interval = setInterval(fetchDashboardLogs, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [widgetMessages, chatLoading]);

  const handleIngest = async () => {
    if (!docContent.trim()) return;
    setIngestLoading(true);
    setIngestStatus("");
    try {
      const res = await fetch("/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgId,
          fileName: "live_sandbox_data.txt",
          content: docContent,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIngestStatus(
          `🎉 Success! Saved ${data.chunksProcessed} vector chunks to MongoDB.`,
        );
      } else {
        setIngestStatus("❌ Ingestion error occurred.");
      }
    } catch (_err) {
      setIngestStatus("❌ Network connection failed.");
    } finally {
      setIngestLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    const userText = chatMessage.trim();
    setChatMessage("");
    setWidgetMessages((prev) => [
      ...prev,
      { sender: "user", content: userText },
    ]);
    setChatLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId, sessionId, message: userText }),
      });
      const data = await res.json();
      if (data.success) {
        setSessionId(data.sessionId);
        setWidgetMessages((prev) => [
          ...prev,
          { sender: "ai", content: data.response },
        ]);
        fetchDashboardLogs();
      }
    } catch (_err) {
      console.error("Chat failed");
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 sm:p-8">
      {/* Header */}
      <header className="max-w-7xl mx-auto mb-8 border-b border-slate-800 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            AI SUPPORT SaaS TESTING LAB
          </h1>
          <p className="text-xs text-slate-400">
            Test the entire multi-tenant AI framework interactively on a single
            landing page.
          </p>
        </div>
        <span className="text-xs font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1 rounded-full font-bold">
          Active Org ID: {orgId.slice(0, 8)}...
        </span>
      </header>

      {/* Main Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* PANEL 1: Knowledge Base */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="bg-blue-600 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                1
              </span>
              <h2 className="font-bold text-white text-base">
                Train the Bot Context
              </h2>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              Type custom business documentation rules below to index them into
              MongoDB Atlas Vector Search.
            </p>
            <textarea
              className="w-full h-48 bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 focus:outline-none focus:border-blue-500 resize-none font-medium"
              value={docContent}
              onChange={(e) => setDocContent(e.target.value)}
              placeholder="Paste company instructions, refund guidelines, or menu pricing rules here..."
            />
          </div>
          <div className="mt-4">
            <button
              onClick={handleIngest}
              disabled={ingestLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 text-white font-semibold text-xs py-2.5 rounded-lg transition-colors shadow-sm"
            >
              {ingestLoading
                ? "Processing Vector Embeddings..."
                : "Save & Index to MongoDB"}
            </button>
            {ingestStatus && (
              <p className="text-[11px] font-medium mt-2 text-center text-blue-400 animate-pulse">
                {ingestStatus}
              </p>
            )}
          </div>
        </div>

        {/* PANEL 2: Live Chat Widget */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col h-[500px] lg:h-auto">
          <div className="flex items-center gap-2 mb-3 flex-shrink-0">
            <span className="bg-blue-600 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
              2
            </span>
            <h2 className="font-bold text-white text-base">
              Live Floating Widget UI
            </h2>
          </div>

          <div className="flex-1 bg-slate-950 border border-slate-800/80 rounded-lg p-4 overflow-y-auto space-y-3 min-h-0">
            {widgetMessages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-xs leading-relaxed ${
                    msg.sender === "user"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-slate-900 border border-slate-800 text-slate-200"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="text-left">
                <span className="inline-block bg-slate-900 text-slate-500 italic text-[11px] rounded px-2 py-1 animate-pulse">
                  AI reading MongoDB chunks...
                </span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form
            onSubmit={handleSendMessage}
            className="mt-3 flex gap-2 flex-shrink-0"
          >
            <input
              type="text"
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              placeholder="Ask about shipping, returns, etc..."
              className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              disabled={chatLoading}
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-lg transition-colors"
              disabled={chatLoading}
            >
              Ask
            </button>
          </form>
        </div>

        {/* PANEL 3: Agent Monitoring */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col h-[500px] lg:h-auto">
          <div className="flex items-center gap-2 mb-1 flex-shrink-0">
            <span className="bg-blue-600 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
              3
            </span>
            <h2 className="font-bold text-white text-base">
              Agent Monitoring Inbox
            </h2>
          </div>
          <p className="text-[11px] text-slate-400 mb-3 flex-shrink-0">
            Automated live background snapshot of conversations saved in MongoDB
            logs.
          </p>

          <div className="flex-1 bg-slate-950 border border-slate-800/80 rounded-lg p-3 overflow-y-auto space-y-4 min-h-0 divide-y divide-slate-900">
            {dashboardLoading && dashboardSessions.length === 0 ? (
              <p className="text-center text-xs text-slate-600 py-4">
                Syncing with database logs...
              </p>
            ) : dashboardSessions.length === 0 ? (
              <p className="text-center text-xs text-slate-600 py-4">
                No logged database chats found.
              </p>
            ) : (
              dashboardSessions.map((session, sIdx) => (
                <div
                  key={session._id}
                  className={`pt-3 ${sIdx === 0 ? "pt-0" : ""}`}
                >
                  <p className="text-[10px] font-mono text-slate-500 mb-2">
                    THREAD: #{session._id.slice(-6).toUpperCase()} Live
                    Transcript Log
                  </p>
                  <div className="space-y-1">
                    {session.messages.map((m, mIdx) => (
                      <div
                        key={mIdx}
                        className="text-[11px] text-slate-300 leading-relaxed"
                      >
                        <span
                          className={`font-bold uppercase tracking-wider text-[9px] mr-1.5 ${
                            m.sender === "user"
                              ? "text-amber-400"
                              : "text-emerald-400"
                          }`}
                        >
                          [{m.sender}]:
                        </span>
                        {m.content}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto mt-8 pt-4 border-t border-slate-800 text-center">
        <p className="text-[11px] text-slate-600">
          Framework Engine Node: Next.js Architecture Pipeline • MongoDB Atlas
          Vector Sync
        </p>
      </footer>
    </div>
  );
}
