import React, { useState, useEffect } from "react";
import { ArrowLeft, Search, Filter, Ticket, Plus, ChevronRight, Clock, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";

interface UserTicketHistoryViewProps {
  onBack: () => void;
  onCreateNew: () => void;
  onSelectTicket: (ticketId: string) => void;
  userEmail?: string;
}

export function UserTicketHistoryView({ onBack, onCreateNew, onSelectTicket, userEmail = "adamuamuhammad8541@gmail.com" }: UserTicketHistoryViewProps) {
  const [tickets, setTickets] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        email: userEmail,
        search,
        status: statusFilter,
        category: categoryFilter,
        priority: priorityFilter,
      });
      const res = await fetch(`/api/support/tickets?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setTickets(data.tickets || []);
        if (data.categories) setCategories(data.categories);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [userEmail, search, statusFilter, categoryFilter, priorityFilter]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Open":
        return <span className="px-2.5 py-0.5 bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-full text-[11px] font-bold">Open</span>;
      case "In Progress":
        return <span className="px-2.5 py-0.5 bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-full text-[11px] font-bold">In Progress</span>;
      case "Waiting for Customer":
        return <span className="px-2.5 py-0.5 bg-purple-50 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 rounded-full text-[11px] font-bold">Waiting for You</span>;
      case "Escalated":
        return <span className="px-2.5 py-0.5 bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-full text-[11px] font-bold">Escalated</span>;
      case "Resolved":
        return <span className="px-2.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-full text-[11px] font-bold">Resolved</span>;
      case "Closed":
        return <span className="px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-full text-[11px] font-bold">Closed</span>;
      default:
        return <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-full text-[11px] font-bold">{status}</span>;
    }
  };

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case "Urgent":
        return <span className="px-2 py-0.5 bg-rose-500 text-white rounded text-[10px] font-extrabold uppercase tracking-wider">Urgent</span>;
      case "High":
        return <span className="px-2 py-0.5 bg-orange-500 text-white rounded text-[10px] font-extrabold uppercase tracking-wider">High</span>;
      case "Normal":
        return <span className="px-2 py-0.5 bg-blue-500 text-white rounded text-[10px] font-extrabold uppercase tracking-wider">Normal</span>;
      default:
        return <span className="px-2 py-0.5 bg-slate-500 text-white rounded text-[10px] font-extrabold uppercase tracking-wider">Low</span>;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 rounded-xl transition-all cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Support Overview</span>
        </button>

        <button
          onClick={onCreateNew}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Create Ticket</span>
        </button>
      </div>

      {/* Main Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">Support Ticket History</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Track resolution progress, conversation logs, and officer replies across all your submitted support tickets.
            </p>
          </div>
          <span className="px-3 py-1 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/80 rounded-full text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
            {tickets.length} Tickets Found
          </span>
        </div>

        {/* Search & Combined Filter Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Ticket #, Subject..."
              className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Waiting for Customer">Waiting for Customer</option>
              <option value="Escalated">Escalated</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all cursor-pointer"
            >
              <option value="ALL">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id || cat.name} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all cursor-pointer"
            >
              <option value="ALL">All Priorities</option>
              <option value="Low">Low</option>
              <option value="Normal">Normal</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </select>
          </div>
        </div>

        {/* Tickets List */}
        {loading ? (
          <div className="p-12 text-center space-y-2">
            <RefreshCw className="h-6 w-6 text-blue-600 animate-spin mx-auto" />
            <p className="text-xs text-slate-400 font-mono">Fetching support tickets...</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-12 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-center space-y-3 bg-slate-50/50 dark:bg-slate-950/30">
            <Ticket className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto" />
            <div>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No support tickets found</p>
              <p className="text-xs text-slate-400 mt-1">Try adjusting your search query or create a new support ticket.</p>
            </div>
            <button
              onClick={onCreateNew}
              className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
            >
              Create Support Ticket
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map((t) => (
              <div
                key={t.id}
                onClick={() => onSelectTicket(t.id)}
                className="p-5 bg-slate-50/80 dark:bg-slate-800/50 hover:bg-blue-50/50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 hover:border-blue-300 dark:hover:border-blue-700 rounded-2xl transition-all cursor-pointer space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">{t.ticketNumber}</span>
                    {getPriorityBadge(t.priority)}
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(t.status)}
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t.subject}</h3>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">
                    <span>Category: <strong>{t.category}</strong></span>
                    <span>•</span>
                    <span>Service: <strong>{t.relatedService || "General"}</strong></span>
                    {t.relatedTransactionRef && (
                      <>
                        <span>•</span>
                        <span>Ref: <strong>{t.relatedTransactionRef}</strong></span>
                      </>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>Assigned Staff: <strong className="text-slate-700 dark:text-slate-300">{t.assignedStaffName || "Support Officer"}</strong></span>
                  <span>Updated {new Date(t.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
