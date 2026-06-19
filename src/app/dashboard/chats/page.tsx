"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

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

export default function DashboardChats() {
  const searchParams = useSearchParams();
  const orgId = searchParams.get("orgId");

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  // Fetch all chat logs from the database
  const fetchChats = async () => {
    if (!orgId) return;
    try {
      const res = await fetch(`/api/dashboard/chats?orgId=${orgId}`);
      const data = await res.json();
      if (data.success) {
        setSessions(data.sessions);
        // Sync active screen if a session is currently selected
        if (selectedSession) {
          const updated = data.sessions.find(
            (s: ChatSession) => s._id === selectedSession._id,
          );
          if (updated) setSelectedSession(updated);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChats();
    // Poll the database every 5 seconds to instantly stream new messages coming from the widget
    const interval = setInterval(fetchChats, 5000);
    return () => clearInterval(interval);
  }, [orgId, selectedSession]);

  if (!orgId) {
    return (
      <div className="p-8 text-red-500">
        Error: Missing orgId parameter in URL.
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100 font-sans text-gray-800">
      {/* Left Column: Conversations Sidebar List */}
      <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h1 className="text-lg font-bold text-gray-900">
            Live Customer Conversations
          </h1>
          <p className="text-xs text-gray-500">
            Auto-refreshing live user sessions
          </p>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
          {loading && sessions.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-400">
              Loading threads...
            </div>
          ) : sessions.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-400">
              No active user chats yet.
            </div>
          ) : (
            sessions.map((session) => (
              <button
                key={session._id}
                onClick={() => setSelectedSession(session)}
                className={`w-full text-left p-4 transition-colors flex flex-col gap-1 hover:bg-gray-50 ${
                  selectedSession?._id === session._id
                    ? "bg-blue-50/70 border-l-4 border-blue-600"
                    : ""
                }`}
              >
                <div className="flex justify-between items-center w-full">
                  <span className="text-xs font-mono text-gray-400">
                    ID: {session._id.slice(-6)}
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-green-100 text-green-800">
                    {session.status}
                  </span>
                </div>
                <p className="text-sm text-gray-700 truncate font-medium">
                  Last:{" "}
                  {session.messages[session.messages.length - 1]?.content ||
                    "No messages"}
                </p>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right Column: Live Chat History Window View */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {selectedSession ? (
          <>
            <div className="p-4 border-b border-gray-200 bg-white shadow-xs">
              <h2 className="text-sm font-semibold text-gray-900">
                Active Thread Log
              </h2>
              <p className="text-xs text-gray-400 font-mono">
                Session ID: {selectedSession._id}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {selectedSession.messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
                >
                  <span className="text-[10px] text-gray-400 mb-1 capitalize font-medium">
                    {msg.sender}
                  </span>
                  <div
                    className={`max-w-[70%] rounded-xl px-4 py-2.5 text-sm shadow-xs ${
                      msg.sender === "user"
                        ? "bg-blue-600 text-white"
                        : "bg-white border border-gray-200 text-gray-800"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <svg
              xmlns="http://w3.org"
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              className="mb-2 text-gray-300"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            <p className="text-sm">
              Select a conversation from the list to inspect transcripts.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
