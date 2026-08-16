import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft, Ticket, MessageSquare, Send, Paperclip, Clock, CheckCircle2, AlertCircle, RefreshCw, User, ShieldCheck, FileText, Image as ImageIcon, X, Lock } from "lucide-react";
import { safeFetchJson } from "../../utils/authErrorHandler";
import { getAuthHeaders } from "../../services/providerService";

interface UserTicketDetailViewProps {
  ticketId: string;
  onBack: () => void;
  userEmail?: string;
  userName?: string;
}

export function UserTicketDetailView({ ticketId, onBack, userEmail = "adamuamuhammad8541@gmail.com", userName = "Adamu A. Muhammad" }: UserTicketDetailViewProps) {
  const [ticket, setTicket] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [replyMessage, setReplyMessage] = useState("");
  const [replyAttachments, setReplyAttachments] = useState<any[]>([]);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchTicketDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = await getAuthHeaders();
      const res = await safeFetchJson<{ success: boolean; ticket?: any; messages?: any[]; activityLogs?: any[]; message?: string }>(
        `/api/support/tickets/${encodeURIComponent(ticketId)}`,
        {
          headers: { ...headers, "x-user-email": userEmail },
        }
      );
      if (res.ok && res.data?.success && res.data.ticket) {
        setTicket(res.data.ticket);
        setMessages(res.data.messages || []);
        setActivityLogs(res.data.activityLogs || []);
      } else {
        setError(res.error || res.data?.message || "Ticket details not found.");
      }
    } catch (err: any) {
      setError("Failed to connect to support server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicketDetails();
  }, [ticketId, userEmail]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setReplyAttachments((prev) => [
          ...prev,
          {
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type || "image/jpeg",
            dataUrl: event.target?.result as string,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeReplyAttachment = (index: number) => {
    setReplyAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim()) return;

    setSending(true);
    try {
      const headers = await getAuthHeaders();
      const res = await safeFetchJson<{ success: boolean; message?: string }>(
        `/api/support/tickets/${encodeURIComponent(ticketId)}/reply`,
        {
          method: "POST",
          headers: {
            ...headers,
            "Content-Type": "application/json",
            "x-user-email": userEmail,
          },
          body: JSON.stringify({
            message: replyMessage.trim(),
            attachments: replyAttachments,
            senderType: "USER",
            senderName: userName,
            senderEmail: userEmail,
          }),
        }
      );

      if (res.ok && res.data?.success) {
        setReplyMessage("");
        setReplyAttachments([]);
        fetchTicketDetails();
      } else {
        alert(res.error || res.data?.message || "Failed to submit reply.");
      }
    } catch (err) {
      alert("Error sending message reply.");
    } finally {
      setSending(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Open":
        return <span className="px-3 py-1 bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-full text-xs font-bold">Open</span>;
      case "In Progress":
        return <span className="px-3 py-1 bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-full text-xs font-bold">In Progress</span>;
      case "Waiting for Customer":
        return <span className="px-3 py-1 bg-purple-50 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 rounded-full text-xs font-bold">Waiting for You</span>;
      case "Escalated":
        return <span className="px-3 py-1 bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-full text-xs font-bold">Escalated to Tier 3</span>;
      case "Resolved":
        return <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-full text-xs font-bold">Resolved</span>;
      case "Closed":
        return <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-full text-xs font-bold">Closed</span>;
      default:
        return <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-bold">{status}</span>;
    }
  };

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case "Urgent":
        return <span className="px-2.5 py-0.5 bg-rose-500 text-white rounded-md text-[10px] font-extrabold uppercase tracking-wide">Urgent</span>;
      case "High":
        return <span className="px-2.5 py-0.5 bg-orange-500 text-white rounded-md text-[10px] font-extrabold uppercase tracking-wide">High</span>;
      case "Normal":
        return <span className="px-2.5 py-0.5 bg-blue-500 text-white rounded-md text-[10px] font-extrabold uppercase tracking-wide">Normal</span>;
      default:
        return <span className="px-2.5 py-0.5 bg-slate-500 text-white rounded-md text-[10px] font-extrabold uppercase tracking-wide">Low</span>;
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center space-y-3">
        <RefreshCw className="h-8 w-8 text-blue-600 animate-spin mx-auto" />
        <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">Loading support ticket details & conversation timeline...</p>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="p-8 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-3xl text-center space-y-4">
        <AlertCircle className="h-10 w-10 text-rose-500 mx-auto" />
        <p className="text-sm font-bold text-rose-700 dark:text-rose-300">{error || "Ticket not found."}</p>
        <button onClick={onBack} className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl">
          Return to Support Center
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 rounded-xl transition-all cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to All Tickets</span>
        </button>

        <div className="flex items-center gap-3">
          {getStatusBadge(ticket.status)}
          {getPriorityBadge(ticket.priority)}
          <button
            onClick={fetchTicketDetails}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-xl transition-all cursor-pointer"
            title="Refresh Conversation"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Ticket Info Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
          <div className="space-y-1 max-w-2xl">
            <div className="flex items-center gap-2 font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
              <Ticket className="h-4 w-4" />
              <span>{ticket.ticketNumber}</span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="text-slate-500 dark:text-slate-400 font-normal">{ticket.category}</span>
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">{ticket.subject}</h1>
          </div>

          <div className="text-right text-xs text-slate-500 dark:text-slate-400 space-y-1 font-mono">
            <div>Created: <strong>{new Date(ticket.createdAt).toLocaleString()}</strong></div>
            <div>Assigned Staff: <strong className="text-blue-600 dark:text-blue-400">{ticket.assignedStaffName || "Support Officer"}</strong></div>
          </div>
        </div>

        {/* Metadata grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl text-xs">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Related Service</span>
            <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{ticket.relatedService || "General"}</p>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Transaction Reference</span>
            <p className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5">{ticket.relatedTransactionRef || "N/A"}</p>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Last Activity</span>
            <p className="font-mono text-slate-800 dark:text-slate-200 mt-0.5">{new Date(ticket.updatedAt).toLocaleString()}</p>
          </div>
        </div>

        {/* Initial Ticket Attachments if any */}
        {ticket.attachments && ticket.attachments.length > 0 && (
          <div className="space-y-2 pt-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Ticket Attachments ({ticket.attachments.length})</span>
            <div className="flex flex-wrap gap-2">
              {ticket.attachments.map((att: any, idx: number) => (
                <a
                  key={idx}
                  href={att.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/80 rounded-xl text-xs font-medium text-blue-700 dark:text-blue-300 hover:underline flex items-center gap-1.5"
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>{att.fileName}</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Conversation Messages Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span>Support Ticket Conversation History ({messages.length})</span>
          </h2>
          <span className="text-xs text-slate-400 font-mono">End-to-End Encrypted Support Channel</span>
        </div>

        {/* Chat Timeline */}
        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
          {messages.map((msg: any) => {
            const isMe = msg.senderType === "USER";
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isMe ? "flex-row-reverse" : "flex-row"}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-xs ${
                  isMe ? "bg-blue-600 text-white" : "bg-emerald-600 text-white"
                }`}>
                  {isMe ? <User className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                </div>

                <div className={`max-w-[80%] space-y-1 ${isMe ? "items-end text-right" : "items-start text-left"}`}>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 px-1 font-mono">
                    <span className="font-bold text-slate-700 dark:text-slate-300">{msg.senderName}</span>
                    <span>•</span>
                    <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>

                  <div className={`p-4 rounded-2xl text-xs space-y-2 ${
                    isMe
                      ? "bg-blue-600 text-white rounded-tr-none shadow-md shadow-blue-500/10"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-tl-none border border-slate-200 dark:border-slate-700"
                  }`}>
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.message}</p>

                    {/* Message Attachments */}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="pt-2 border-t border-white/20 dark:border-slate-700 flex flex-wrap gap-2">
                        {msg.attachments.map((att: any, idx: number) => (
                          <a
                            key={idx}
                            href={att.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 ${
                              isMe ? "bg-white/20 text-white hover:bg-white/30" : "bg-blue-50 dark:bg-slate-700 text-blue-700 dark:text-blue-300"
                            }`}
                          >
                            <Paperclip className="h-3 w-3" />
                            <span>{att.fileName}</span>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Reply Box */}
        {ticket.status === "Closed" ? (
          <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl text-center text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-2">
            <Lock className="h-4 w-4" />
            <span>This ticket is marked as Closed. Contact support if you need further assistance.</span>
          </div>
        ) : (
          <form onSubmit={handleSendReply} className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <div className="relative">
              <textarea
                rows={3}
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Type your reply here..."
                className="w-full p-4 pr-12 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
              ></textarea>

              <div className="absolute right-3 bottom-3 flex items-center gap-2">
                <input
                  type="file"
                  id="reply-file-input"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label
                  htmlFor="reply-file-input"
                  className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all cursor-pointer"
                  title="Attach screenshot or document"
                >
                  <Paperclip className="h-4 w-4" />
                </label>
              </div>
            </div>

            {/* Attachments preview before sending */}
            {replyAttachments.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {replyAttachments.map((att, idx) => (
                  <div key={idx} className="px-3 py-1 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 rounded-lg text-xs flex items-center gap-2">
                    <span>{att.fileName}</span>
                    <button type="button" onClick={() => removeReplyAttachment(idx)} className="hover:text-rose-500">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-end">
              <button
                type="submit"
                disabled={sending || !replyMessage.trim()}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-blue-600/20 disabled:opacity-50 transition-all cursor-pointer"
              >
                {sending ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                <span>Send Reply</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
