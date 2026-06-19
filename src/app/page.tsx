"use client";

import { useState, useEffect, useRef } from "react";

interface Message {
  sender: "user" | "ai" | "agent";
  content: string;
}

interface ChatSession {
  _id: string;
  messages: Message[];
  status: string;
  createdAt: string;
}

// --- Animated Counter Hook ---
function useCountUp(target: number, duration = 1800, start = false) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    const step = (ts: number) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      setVal(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return val;
}

export default function InteractiveSandboxHome() {
  const orgId = "65f1a23e8f9b4c0017a5bc8d";

  const [docContent, setDocContent] = useState(
    "Our standard shipping takes 3-5 business days and is free for orders over $50. Returns are accepted within 30 days of purchase with a full refund. For premium members, expedited 1-day delivery is available for $9.99.",
  );
  const [ingestStatus, setIngestStatus] = useState("");
  const [ingestLoading, setIngestLoading] = useState(false);

  const [chatMessage, setChatMessage] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [widgetMessages, setWidgetMessages] = useState<Message[]>([
    { sender: "ai", content: "Hi! I'm your AI support agent. Train me with your business docs, then ask me anything." },
  ]);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const [dashboardSessions, setDashboardSessions] = useState<ChatSession[]>([]);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [totalMessages, setTotalMessages] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const [heroVisible, setHeroVisible] = useState(false);

  // Intersection observer for hero stats animation
  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) setHeroVisible(true);
    }, { threshold: 0.3 });
    if (heroRef.current) observer.observe(heroRef.current);
    return () => observer.disconnect();
  }, []);

  const statChunks = useCountUp(1536, 1500, heroVisible);
  const statLatency = useCountUp(120, 1200, heroVisible);
  const statTenants = useCountUp(100, 1400, heroVisible);

  const fetchDashboardLogs = async () => {
    try {
      const res = await fetch(`/api/dashboard/chats?orgId=${orgId}`);
      const data = await res.json();
      if (data.success) {
        setDashboardSessions(data.sessions);
        const total = data.sessions.reduce(
          (sum: number, s: ChatSession) => sum + s.messages.length, 0
        );
        setTotalMessages(total);
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
        setIngestStatus(`✓ ${data.chunksProcessed} vector chunks indexed to MongoDB Atlas`);
      } else {
        setIngestStatus("✗ Ingestion error — check your connection.");
      }
    } catch (_err) {
      setIngestStatus("✗ Network connection failed.");
    } finally {
      setIngestLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    const userText = chatMessage.trim();
    setChatMessage("");
    setWidgetMessages((prev) => [...prev, { sender: "user", content: userText }]);
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
        setWidgetMessages((prev) => [...prev, { sender: "ai", content: data.response }]);
        fetchDashboardLogs();
      }
    } catch (_err) {
      console.error("Chat failed");
    } finally {
      setChatLoading(false);
    }
  };

  const techStack = [
    { name: "Next.js 15", color: "bg-white/10 text-white" },
    { name: "TypeScript", color: "bg-blue-500/20 text-blue-300" },
    { name: "MongoDB Atlas", color: "bg-green-500/20 text-green-300" },
    { name: "Vector Search", color: "bg-purple-500/20 text-purple-300" },
    { name: "OpenAI GPT-4o", color: "bg-amber-500/20 text-amber-300" },
    { name: "RAG Pipeline", color: "bg-rose-500/20 text-rose-300" },
    { name: "Tailwind CSS", color: "bg-cyan-500/20 text-cyan-300" },
    { name: "REST APIs", color: "bg-indigo-500/20 text-indigo-300" },
  ];

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 font-sans">

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section ref={heroRef} className="relative overflow-hidden border-b border-slate-800/60">
        {/* Grid background */}
        <div className="absolute inset-0"
          style={{
            backgroundImage: "linear-gradient(rgba(59,130,246,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.05) 1px, transparent 1px)",
            backgroundSize: "40px 40px"
          }}
        />
        {/* Glow orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-6 pt-16 pb-14">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/25 rounded-full px-4 py-1.5 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-xs font-semibold text-blue-300 tracking-wide uppercase">MERN Stack Portfolio Project</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.05] mb-5 max-w-4xl">
            Multi-Tenant{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-violet-400 to-cyan-400">
              AI Support
            </span>{" "}
            SaaS Platform
          </h1>

          <p className="text-slate-400 text-lg max-w-2xl mb-8 leading-relaxed">
            A production-grade RAG pipeline — ingest company docs, embed them into MongoDB Atlas Vector Search, and serve context-aware AI responses in real-time. Built end-to-end with Next.js, Express architecture, and OpenAI.
          </p>

          {/* Stat row */}
          <div className="flex flex-wrap gap-8 mb-10">
            {[
              { value: statChunks, suffix: "D", label: "Embedding Dimensions", desc: "OpenAI text-embedding-3-small" },
              { value: statLatency, suffix: "ms", label: "Avg. Response Latency", desc: "Vector search + LLM round-trip" },
              { value: statTenants, suffix: "+", label: "Multi-Tenant Ready", desc: "Isolated org data boundaries" },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-3xl font-black text-white">
                  {s.value.toLocaleString()}<span className="text-blue-400">{s.suffix}</span>
                </div>
                <div className="text-sm font-semibold text-slate-200 mt-0.5">{s.label}</div>
                <div className="text-xs text-slate-500 mt-0.5">{s.desc}</div>
              </div>
            ))}
          </div>

          {/* Tech stack badges */}
          <div className="flex flex-wrap gap-2">
            {techStack.map((t) => (
              <span key={t.name} className={`text-xs font-semibold px-3 py-1 rounded-full border border-white/10 ${t.color}`}>
                {t.name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── ARCHITECTURE OVERVIEW ────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 py-10">
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-violet-400" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">System Architecture</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {[
              { label: "Client UI", color: "bg-blue-600" },
              { arrow: true },
              { label: "Next.js API Routes", color: "bg-slate-700" },
              { arrow: true },
              { label: "OpenAI Embeddings", color: "bg-amber-700" },
              { arrow: true },
              { label: "MongoDB Atlas", color: "bg-green-700" },
              { arrow: true },
              { label: "Vector Search", color: "bg-purple-700" },
              { arrow: true },
              { label: "GPT-4o-mini", color: "bg-rose-700" },
              { arrow: true },
              { label: "AI Response", color: "bg-cyan-700" },
            ].map((item, i) =>
              "arrow" in item ? (
                <span key={i} className="text-slate-600 font-bold">→</span>
              ) : (
                <span key={i} className={`${item.color} text-white px-3 py-1.5 rounded-lg font-semibold`}>
                  {item.label}
                </span>
              )
            )}
          </div>
          <p className="text-slate-500 text-xs mt-4">
            Each request generates a semantic embedding, runs a cosine similarity search over the org's indexed knowledge base, then feeds the top-matching chunks as context to GPT-4o-mini — all within a single Next.js API route.
          </p>
        </div>
      </section>

      {/* ── LIVE DEMO LABEL ──────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 mb-4 flex items-center gap-3">
        <div className="flex-1 h-px bg-slate-800" />
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Interactive Live Demo</span>
        </div>
        <div className="flex-1 h-px bg-slate-800" />
      </div>

      {/* ── STEP INDICATORS ──────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 mb-6">
        <div className="grid grid-cols-3 gap-4">
          {[
            { step: "01", title: "Index Knowledge", desc: "Feed business docs into vector DB" },
            { step: "02", title: "Chat with AI", desc: "RAG-powered context retrieval" },
            { step: "03", title: "Monitor Sessions", desc: "Real-time conversation logs" },
          ].map((s) => (
            <div key={s.step} className="flex items-center gap-3 bg-slate-900/40 border border-slate-800/60 rounded-xl px-4 py-3">
              <span className="text-2xl font-black text-slate-700">{s.step}</span>
              <div>
                <div className="text-sm font-bold text-slate-200">{s.title}</div>
                <div className="text-xs text-slate-500">{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── THREE DEMO PANELS ────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 pb-6 grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* PANEL 1 — Knowledge Base Ingest */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">Step 01</div>
              <h2 className="text-base font-bold text-white">Knowledge Base Ingest</h2>
              <p className="text-xs text-slate-500 mt-1">
                Text gets split into chunks, embedded via OpenAI, and stored as 1536-D vectors in MongoDB Atlas.
              </p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 flex items-center justify-center flex-shrink-0 ml-3">
              <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7M4 7c0-2 1-3 3-3h10c2 0 3 1 3 3M4 7h16M9 11h6" />
              </svg>
            </div>
          </div>

          <textarea
            className="flex-1 min-h-40 bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-blue-500/70 resize-none font-mono leading-relaxed transition-colors"
            value={docContent}
            onChange={(e) => setDocContent(e.target.value)}
            placeholder="Paste company policy, FAQ, or product docs here..."
          />

          <button
            onClick={handleIngest}
            disabled={ingestLoading}
            className="mt-4 w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold text-xs py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
          >
            {ingestLoading ? (
              <>
                <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Generating Embeddings...
              </>
            ) : (
              "→  Index to MongoDB Atlas"
            )}
          </button>

          {ingestStatus && (
            <div className={`mt-3 text-xs font-medium px-3 py-2 rounded-lg text-center ${ingestStatus.startsWith("✓") ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>
              {ingestStatus}
            </div>
          )}

          {/* Mini explainer */}
          <div className="mt-4 bg-slate-800/40 border border-slate-800 rounded-lg p-3 space-y-1.5">
            {["Text → Sentence chunks", "Chunks → OpenAI embeddings", "Vectors stored in MongoDB Atlas"].map((step, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-slate-400">
                <span className="w-4 h-4 rounded-full bg-slate-700 text-[9px] font-bold flex items-center justify-center text-slate-300 flex-shrink-0">{i + 1}</span>
                {step}
              </div>
            ))}
          </div>
        </div>

        {/* PANEL 2 — Chat Widget */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col h-[580px] lg:h-auto">
          <div className="flex items-start justify-between mb-4 flex-shrink-0">
            <div>
              <div className="text-xs font-bold text-violet-400 uppercase tracking-wider mb-1">Step 02</div>
              <h2 className="text-base font-bold text-white">AI Chat Widget</h2>
              <p className="text-xs text-slate-500 mt-1">
                Simulates a customer support bot. Questions are matched to indexed docs via vector similarity.
              </p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-violet-600/20 flex items-center justify-center flex-shrink-0 ml-3">
              <svg className="w-4 h-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
          </div>

          {/* Messages area */}
          <div className="flex-1 bg-slate-950 border border-slate-800/60 rounded-xl p-3 overflow-y-auto space-y-2.5 min-h-0">
            {widgetMessages.map((msg, index) => (
              <div key={index} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                {msg.sender === "ai" && (
                  <div className="w-5 h-5 rounded-full bg-violet-600/30 border border-violet-500/40 flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">
                    <span className="text-[8px] font-black text-violet-300">AI</span>
                  </div>
                )}
                <div className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                  msg.sender === "user"
                    ? "bg-blue-600 text-white rounded-br-sm"
                    : "bg-slate-800 border border-slate-700/60 text-slate-200 rounded-bl-sm"
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="w-5 h-5 rounded-full bg-violet-600/30 border border-violet-500/40 flex items-center justify-center mr-2 flex-shrink-0">
                  <span className="text-[8px] font-black text-violet-300">AI</span>
                </div>
                <div className="bg-slate-800 border border-slate-700/60 rounded-2xl rounded-bl-sm px-3.5 py-2.5">
                  <div className="flex gap-1 items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick prompts */}
          <div className="mt-2.5 flex gap-1.5 flex-shrink-0 flex-wrap">
            {["Shipping time?", "Return policy?", "Premium delivery?"].map((q) => (
              <button
                key={q}
                onClick={() => { setChatMessage(q); }}
                className="text-[11px] text-slate-400 border border-slate-700 hover:border-blue-500/50 hover:text-blue-300 px-2.5 py-1 rounded-full transition-colors"
              >
                {q}
              </button>
            ))}
          </div>

          <form onSubmit={handleSendMessage} className="mt-2 flex gap-2 flex-shrink-0">
            <input
              type="text"
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              placeholder="Ask something about the indexed docs..."
              className="flex-1 bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-blue-500/70 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none transition-colors"
              disabled={chatLoading}
            />
            <button
              type="submit"
              disabled={chatLoading || !chatMessage.trim()}
              className="bg-violet-600 hover:bg-violet-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all"
            >
              Send
            </button>
          </form>
        </div>

        {/* PANEL 3 — Agent Monitoring */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col h-[580px] lg:h-auto">
          <div className="flex items-start justify-between mb-1 flex-shrink-0">
            <div>
              <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">Step 03</div>
              <h2 className="text-base font-bold text-white">Agent Monitoring</h2>
            </div>
            <div className="flex items-center gap-1.5 ml-3">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] text-emerald-400 font-semibold">LIVE</span>
            </div>
          </div>
          <p className="text-xs text-slate-500 mb-3 flex-shrink-0">
            All conversations are persisted to MongoDB and auto-synced every 4s.
          </p>

          {/* Stats bar */}
          <div className="flex gap-3 mb-3 flex-shrink-0">
            <div className="flex-1 bg-slate-800/50 border border-slate-700/60 rounded-lg px-3 py-2 text-center">
              <div className="text-base font-black text-white">{dashboardSessions.length}</div>
              <div className="text-[10px] text-slate-500 font-medium">Sessions</div>
            </div>
            <div className="flex-1 bg-slate-800/50 border border-slate-700/60 rounded-lg px-3 py-2 text-center">
              <div className="text-base font-black text-white">{totalMessages}</div>
              <div className="text-[10px] text-slate-500 font-medium">Messages</div>
            </div>
            <div className="flex-1 bg-slate-800/50 border border-slate-700/60 rounded-lg px-3 py-2 text-center">
              <div className="text-base font-black text-emerald-400">●</div>
              <div className="text-[10px] text-slate-500 font-medium">MongoDB</div>
            </div>
          </div>

          <div className="flex-1 bg-slate-950 border border-slate-800/60 rounded-xl p-3 overflow-y-auto space-y-4 min-h-0 divide-y divide-slate-800/60">
            {dashboardLoading && dashboardSessions.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="w-5 h-5 border-2 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-xs text-slate-600">Syncing with MongoDB...</p>
                </div>
              </div>
            ) : dashboardSessions.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center px-4">
                  <div className="text-2xl mb-2">💬</div>
                  <p className="text-xs text-slate-500">No sessions yet. Start a chat in Step 02 and it will appear here.</p>
                </div>
              </div>
            ) : (
              dashboardSessions.map((session, sIdx) => (
                <div key={session._id} className={`${sIdx === 0 ? "" : "pt-4"}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono text-slate-600">
                      #{session._id.slice(-6).toUpperCase()}
                    </span>
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${session.status === "ai_active" ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"}`}>
                      {session.status}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {session.messages.map((m, mIdx) => (
                      <div key={mIdx} className="text-[11px] text-slate-300 leading-relaxed flex items-start gap-1.5">
                        <span className={`font-bold uppercase tracking-wider text-[9px] flex-shrink-0 mt-px ${m.sender === "user" ? "text-amber-400" : "text-emerald-400"}`}>
                          {m.sender === "user" ? "USR" : "BOT"}
                        </span>
                        <span className="text-slate-400">{m.content}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <footer className="border-t border-slate-800/60 mt-4">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-slate-300">AI Support SaaS — Portfolio Demo</p>
            <p className="text-xs text-slate-600 mt-0.5">
              Built with Next.js 15 · MongoDB Atlas Vector Search · OpenAI · TypeScript
            </p>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="/dashboard/chats?orgId=65f1a23e8f9b4c0017a5bc8d"
              className="text-xs font-semibold text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 px-4 py-2 rounded-lg transition-colors"
            >
              Full Dashboard →
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
