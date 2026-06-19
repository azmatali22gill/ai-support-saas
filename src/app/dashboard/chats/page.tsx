"use client";

export const dynamic = "force-dynamic";

import { useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";

interface Message {
  sender: "user" | "ai" | "agent";
  content: string;
  timestamp: string;
}

interface ChatSession {
  _id: string;
  status: string;
  messages: Message[];
  createdAt: string;
}

function ChatsDashboardContent() {
  const searchParams = useSearchParams();
  const orgId = searchParams.get("orgId");

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  useEffect(() => {
    if (!orgId) return;
    const fetchChats = async () => {
      try {
        const res = await fetch(`/api/dashboard/chats?orgId=${orgId}`);
        const data = await res.json();
        if (data.success) {
          setSessions(data.sessions);
          setLastRefreshed(new Date());
          setSelectedSession((currentSelected) => {
            if (!currentSelected) return null;
            const updated = data.sessions.find((s: ChatSession) => s._id === currentSelected._id);
            return updated || currentSelected;
          });
        }
      } catch (err) {
        console.error("Error fetching chats:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchChats();
    const interval = setInterval(fetchChats, 5000);
    return () => clearInterval(interval);
  }, [orgId]);

  const totalMessages = sessions.reduce((sum, s) => sum + s.messages.length, 0);
  const aiActive = sessions.filter((s) => s.status === "ai_active").length;

  if (!orgId) {
    return (
      <div className="min-h-screen bg-[#080c14] flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 font-bold mb-2">Missing orgId</div>
          <Link href="/" className="text-sm text-blue-400 underline">← Back to Demo</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#080c14] font-sans text-slate-100 overflow-hidden">

      {/* ── SIDEBAR ─────────────────────────── */}
      <div className="w-[300px] flex-shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col">
        {/* Sidebar header */}
        <div className="px-4 pt-5 pb-4 border-b border-slate-800">
          <Link href="/" className="flex items-center gap-2 mb-4 text-slate-500 hover:text-slate-300 text-xs transition-colors">
            ← Back to Demo
          </Link>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <h1 className="text-sm font-bold text-white">Agent Monitoring</h1>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {sessions.length} session{sessions.length !== 1 ? "s" : ""} · auto-sync every 5s
          </p>
        </div>

        {/* Stats */}
        <div className="px-4 py-3 border-b border-slate-800 grid grid-cols-3 gap-2">
          {[
            { label: "Sessions", val: sessions.length, color: "text-white" },
            { label: "Messages", val: totalMessages, color: "text-white" },
            { label: "AI Active", val: aiActive, color: "text-emerald-400" },
          ].map((s) => (
            <div key={s.label} className="bg-slate-800/60 rounded-lg px-2 py-2 text-center">
              <div className={`text-lg font-black ${s.color}`}>{s.val}</div>
              <div className="text-[9px] text-slate-500 font-medium uppercase tracking-wide">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Session list */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
          {loading && sessions.length === 0 ? (
            <div className="p-4 text-center">
              <div className="w-4 h-4 border-2 border-blue-500/30 border-t-blue-400 rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-600">Loading sessions...</p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-xs text-slate-600">No sessions yet.</p>
              <Link href="/" className="text-xs text-blue-400 mt-1 block underline">Start a chat →</Link>
            </div>
          ) : (
            sessions.map((session) => {
              const lastMsg = session.messages[session.messages.length - 1];
              const isSelected = selectedSession?._id === session._id;
              return (
                <button
                  key={session._id}
                  onClick={() => setSelectedSession(session)}
                  className={`w-full text-left px-4 py-3 transition-all flex flex-col gap-1.5 hover:bg-slate-800/50 ${isSelected ? "bg-blue-600/10 border-l-2 border-blue-500" : "border-l-2 border-transparent"}`}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-mono text-slate-500">
                      #{session._id.slice(-6).toUpperCase()}
                    </span>
                    <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${session.status === "ai_active" ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"}`}>
                      {session.status === "ai_active" ? "AI" : "HUMAN"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 truncate">
                    {lastMsg?.content || "No messages"}
                  </p>
                  <p className="text-[10px] text-slate-600">
                    {session.messages.length} message{session.messages.length !== 1 ? "s" : ""}
                  </p>
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-slate-800">
          <p className="text-[10px] text-slate-600 text-center">
            Last synced: {lastRefreshed.toLocaleTimeString()}
          </p>
        </div>
      </div>

      {/* ── MAIN AREA ───────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedSession ? (
          <>
            {/* Thread header */}
            <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-white">
                  Thread #{selectedSession._id.slice(-6).toUpperCase()}
                </h2>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  {selectedSession._id}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-bold uppercase px-3 py-1.5 rounded-lg ${selectedSession.status === "ai_active" ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20" : "bg-amber-500/15 text-amber-400 border border-amber-500/20"}`}>
                  {selectedSession.status.replace("_", " ")}
                </span>
                <span className="text-xs text-slate-600">
                  {selectedSession.messages.length} msgs
                </span>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {selectedSession.messages.map((msg, index) => (
                <div key={index} className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${msg.sender === "user" ? "text-amber-400" : msg.sender === "agent" ? "text-violet-400" : "text-emerald-400"}`}>
                      {msg.sender}
                    </span>
                    {msg.timestamp && (
                      <span className="text-[10px] text-slate-600">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                  <div className={`max-w-[65%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.sender === "user"
                      ? "bg-blue-600 text-white rounded-br-sm"
                      : msg.sender === "agent"
                      ? "bg-violet-600/20 border border-violet-500/30 text-violet-200 rounded-bl-sm"
                      : "bg-slate-800 border border-slate-700/60 text-slate-200 rounded-bl-sm"
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-xs">
              <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-slate-300 mb-1">Select a Conversation</h3>
              <p className="text-sm text-slate-600">
                Choose a session from the sidebar to inspect its full transcript.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DashboardChats() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#080c14] flex items-center justify-center">
          <div className="text-center">
            <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-400 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-slate-500">Loading dashboard...</p>
          </div>
        </div>
      }
    >
      <ChatsDashboardContent />
    </Suspense>
  );
}
