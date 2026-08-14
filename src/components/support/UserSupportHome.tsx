import React, { useState, useEffect } from "react";
import { MessageSquare, Plus, History, HelpCircle, Ticket, Search, ChevronRight, ShieldCheck, Zap, AlertTriangle, LifeBuoy, FileText, ArrowUpRight } from "lucide-react";

interface UserSupportHomeProps {
  onCreateNew: () => void;
  onViewHistory: () => void;
  onSelectTicket: (ticketId: string) => void;
  userEmail?: string;
}

export function UserSupportHome({ onCreateNew, onViewHistory, onSelectTicket, userEmail = "adamuamuhammad8541@gmail.com" }: UserSupportHomeProps) {
  const [recentTickets, setRecentTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFaq, setActiveFaq] = useState<number | null>(0);

  useEffect(() => {
    fetch(`/api/support/tickets?email=${encodeURIComponent(userEmail)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.tickets) {
          setRecentTickets(data.tickets.slice(0, 3));
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [userEmail]);

  const faqs = [
    {
      q: "My wallet funding via bank transfer is not reflecting. What should I do?",
      a: "Bank transfers usually credit instantly. If your account was debited but your wallet balance is unchanged after 15 minutes, please create a ticket with category 'Wallet Issues' and attach your transfer reference or receipt.",
    },
    {
      q: "How long does NIN slip verification or IPE clearance take?",
      a: "NIN slip verification and IPE clearance queries are submitted directly to NIMC gateway servers. Average response time is 2 to 10 minutes. In cases of NIMC API maintenance, queries are queued for automatic re-processing.",
    },
    {
      q: "I purchased VTU Data or Airtime but didn't receive it. How is this resolved?",
      a: "Network providers (MTN, Glo, Airtel, 9mobile) occasionally experience delivery lag. If topup status remains pending after 10 minutes, our auto-query system verifies with the telco. If failed, funds are immediately reversed to your SmartLink wallet.",
    },
    {
      q: "What are the SmartLink customer support operating hours?",
      a: "Our customer support team operates 24 hours a day, 7 days a week, 365 days a year. Priority tickets marked 'Urgent' or 'High' receive fast-track officer assignment.",
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Support Hero Header */}
      <div className="relative p-8 md:p-10 bg-[#0F2D5C] rounded-[16px] text-white overflow-hidden shadow-[0_4px_12px_rgba(15,23,42,0.08)] border border-[#0F2D5C]">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative space-y-4 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 border border-white/20 rounded-full text-[11px] font-bold text-blue-100 uppercase tracking-wider">
            <LifeBuoy className="h-3.5 w-3.5 text-blue-200" />
            <span>SmartLink Customer Support Center</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">How can we assist you today?</h1>
          <p className="text-sm text-blue-100/80 leading-relaxed">
            Search our knowledge base or create a support ticket for wallet funding, identity verification, VTU data, and account assistance.
          </p>

          <div className="pt-2 flex flex-wrap gap-3">
            <button
              onClick={onCreateNew}
              className="px-5 py-3 bg-white text-[#0F2D5C] hover:bg-blue-50 text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Create New Ticket</span>
            </button>
            <button
              onClick={onViewHistory}
              className="px-5 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer"
            >
              <History className="h-4 w-4" />
              <span>View Ticket History</span>
            </button>
          </div>
        </div>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div
          onClick={onCreateNew}
          className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 rounded-3xl space-y-3 cursor-pointer shadow-sm hover:shadow-md transition-all group"
        >
          <div className="p-3 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-2xl w-12 h-12 flex items-center justify-center">
            <Plus className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex items-center justify-between">
            <span>Create New Ticket</span>
            <ChevronRight className="h-4 w-4 text-slate-400" />
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Submit an inquiry or issue regarding wallet, identity, VTU, or CAC transactions.
          </p>
        </div>

        <div
          onClick={onViewHistory}
          className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 rounded-3xl space-y-3 cursor-pointer shadow-sm hover:shadow-md transition-all group"
        >
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-2xl w-12 h-12 flex items-center justify-center">
            <History className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors flex items-center justify-between">
            <span>Ticket History</span>
            <ChevronRight className="h-4 w-4 text-slate-400" />
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Track status updates, staff assignments, and officer conversation replies.
          </p>
        </div>

        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-3 shadow-sm">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-2xl w-12 h-12 flex items-center justify-center">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            24/7 SLA Guarantee
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Average officer response time: <strong>18 Minutes</strong>. Priority issues are escalated directly to Tier 3 engineers.
          </p>
        </div>
      </div>

      {/* Recent Support Tickets Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 space-y-5 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Ticket className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <span>Your Active Support Tickets</span>
          </h2>
          <button
            onClick={onViewHistory}
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>View All</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {recentTickets.length === 0 ? (
          <div className="p-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-center space-y-2">
            <LifeBuoy className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto" />
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">You currently have no active support tickets.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentTickets.map((ticket) => (
              <div
                key={ticket.id}
                onClick={() => onSelectTicket(ticket.id)}
                className="p-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-blue-50/50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-2xl flex items-center justify-between gap-4 transition-all cursor-pointer"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">{ticket.ticketNumber}</span>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <span className="text-xs text-slate-500 font-medium">{ticket.category}</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">{ticket.subject}</h4>
                </div>

                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded-full text-[10px] font-bold">
                    {ticket.status}
                  </span>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Frequently Asked Questions */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 space-y-5 shadow-sm">
        <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          <span>Frequently Asked Questions (FAQ)</span>
        </h2>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
              className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 rounded-2xl cursor-pointer transition-all space-y-2"
            >
              <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
                <span>{faq.q}</span>
                <ChevronRight className={`h-4 w-4 text-slate-400 transition-transform ${activeFaq === idx ? "rotate-90" : ""}`} />
              </div>

              {activeFaq === idx && (
                <p className="text-xs text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 leading-relaxed">
                  {faq.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
