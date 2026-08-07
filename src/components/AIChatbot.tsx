/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { MessageSquareCode, X, Send, BrainCircuit, User } from "lucide-react";

interface ChatMessage {
  sender: "USER" | "AI";
  text: string;
}

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { sender: "AI", text: "Welcome to Smart Link Computer Business Center! I am your cognitive virtual agent. Ask me anything about CAC filings, NIN/BVN verifications, WAEC/JAMB scratch card PINs, or local services." },
  ]);
  const [inputVal, setInputVal] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim() || loading) return;

    const userText = inputVal.trim();
    setInputVal("");
    setMessages((prev) => [...prev, { sender: "USER", text: userText }]);
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText,
          history: messages.map((m) => ({
            role: m.sender === "USER" ? "user" : "model",
            text: m.text,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to communicate with AI");

      setMessages((prev) => [...prev, { sender: "AI", text: data.text }]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { sender: "AI", text: "I am experiencing temporary connection latency to the NimcGate-Node cloud. Please retry your inquiry shortly." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans" id="floating-ai-chatbot">
      {isOpen ? (
        /* Expanded Chat Panel */
        <div className="bg-white rounded-xl shadow-2xl w-80 sm:w-96 border border-slate-200 overflow-hidden flex flex-col h-[480px]">
          {/* Header */}
          <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/30 text-indigo-400">
                <BrainCircuit className="h-4 w-4 animate-pulse" />
              </div>
              <div>
                <h4 className="text-xs font-bold font-mono text-indigo-400">SMART LINK AI CHATBOT</h4>
                <h3 className="text-xs text-slate-300 font-light">Interactive Digital Support</h3>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-1 rounded hover:bg-slate-800 transition-colors">
              <X className="h-4 w-4 text-slate-400" />
            </button>
          </div>

          {/* Messages Container */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50">
            {messages.map((m, idx) => {
              const isUser = m.sender === "USER";
              return (
                <div key={idx} className={`flex ${isUser ? "justify-end" : "justify-start"} items-start gap-2 text-xs`}>
                  {!isUser && (
                    <div className="h-6 w-6 rounded-full bg-slate-900 text-indigo-400 flex items-center justify-center font-mono text-[9px] shrink-0 font-bold border border-slate-700 mt-0.5">
                      SL
                    </div>
                  )}
                  <div
                    className={`p-3 rounded-lg leading-relaxed text-left max-w-[80%] ${
                      isUser
                        ? "bg-indigo-600 text-white rounded-br-none font-medium shadow-xs"
                        : "bg-white text-slate-800 rounded-bl-none border border-slate-200 shadow-3xs"
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              );
            })}
            {loading && (
              <div className="flex justify-start items-center gap-2 text-[11px] text-slate-400 font-mono">
                <span className="h-3 w-3 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></span>
                <span>AI Agent is drafting response...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Form Footer */}
          <form onSubmit={handleSendMessage} className="p-3 border-t flex gap-2 bg-white">
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Ask about CAC, WAEC pin, verifications..."
              className="flex-1 px-3 py-2 border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50 focus:bg-white"
            />
            <button
              type="submit"
              disabled={loading}
              className="p-2 bg-slate-900 hover:bg-indigo-600 hover:text-white text-white rounded-lg transition-colors"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      ) : (
        /* Floating Bubble Button */
        <button
          onClick={() => setIsOpen(true)}
          id="btn-chatbot-bubble"
          className="h-14 w-14 bg-slate-900 text-indigo-400 border border-slate-800 hover:bg-indigo-600 hover:text-white rounded-full flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 group"
        >
          <MessageSquareCode className="h-6 w-6 group-hover:rotate-6 transition-transform" />
          <span className="absolute -top-1.5 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
          </span>
        </button>
      )}
    </div>
  );
}
