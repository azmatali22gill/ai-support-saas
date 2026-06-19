import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans flex flex-col justify-between">
      {/* Navbar Section Layout */}
      <header className="max-w-6xl mx-auto w-full px-6 py-6 flex justify-between items-center border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse" />
          <span className="font-bold text-lg tracking-tight">SupportAI.io</span>
        </div>
        <span className="text-xs bg-slate-800 text-slate-400 font-mono px-2.5 py-1 rounded-md border border-slate-700">
          v1.0 Production Ready
        </span>
      </header>

      {/* Hero Body Content Main Pitch Layout */}
      <main className="max-w-4xl mx-auto text-center px-6 py-20 flex flex-col items-center gap-6">
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight max-w-3xl leading-tight">
          Multi-Tenant <span className="text-blue-500">AI-Driven</span> Customer
          Support Infrastructure
        </h1>
        <p className="text-slate-400 text-base sm:text-lg max-w-xl leading-relaxed">
          A production-grade SaaS built with Next.js App Router, MongoDB Atlas
          Vector Search, and an embeddable widget system.
        </p>

        {/* Informative Grid Details Boxes */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full my-8 text-left">
          <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-800">
            <h3 className="text-sm font-bold text-blue-400 mb-1">
              Vector RAG Architecture
            </h3>
            <p className="text-xs text-slate-400">
              Processes text documents into mathematical chunks for semantic
              matching using MongoDB Atlas Search Indices.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-800">
            <h3 className="text-sm font-bold text-blue-400 mb-1">
              Cross-Origin Injection
            </h3>
            <p className="text-xs text-slate-400">
              Lightweight Vanilla JS script loads a sandboxed cross-domain
              customer support conversation interface seamlessly.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-800">
            <h3 className="text-sm font-bold text-blue-400 mb-1">
              Multi-Tenant Inbox
            </h3>
            <p className="text-xs text-slate-400">
              An auto-refreshing dashboard built for customer support agents to
              monitor conversation transcripts in real time.
            </p>
          </div>
        </div>
      </main>

      {/* Footer System Details */}
      <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-500">
        Developed as a high-performance Full Stack showcase project repository
        portfolio item.
      </footer>
    </div>
  );
}
