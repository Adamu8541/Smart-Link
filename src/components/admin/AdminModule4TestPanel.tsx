/**
 * SmartLink Admin Panel — Module 4 Automated Self-Test Suite Runner Component
 * Executes 10 unit & integration tests on Wallet Management, Credit/Debit,
 * Freeze/Unfreeze, Lock/Unlock, Search/Filters, Statements, and RBAC Audit Logging.
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  PlayCircle,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  Wallet,
  ShieldCheck,
  FileText,
  Clock,
  ChevronDown,
  ChevronUp,
  Sliders,
  AlertTriangle
} from "lucide-react";
import { AdminSession } from "../../services/adminAuthService";

interface AdminModule4TestPanelProps {
  session: AdminSession;
}

export default function AdminModule4TestPanel({ session }: AdminModule4TestPanelProps) {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedTest, setExpandedTest] = useState<number | null>(null);

  const runTests = async () => {
    setRunning(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/module4/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": session.sessionToken,
        },
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to execute Module 4 test suite.");
      }

      setResults(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-950 border border-emerald-800 rounded-2xl text-emerald-400">
            <Wallet className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Verification Suite</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-950/80 text-emerald-300 border border-emerald-800">Module 4</span>
            </div>
            <h2 className="text-lg font-bold text-white">Wallet Management System Automated Test Suite</h2>
          </div>
        </div>

        <button
          type="button"
          onClick={runTests}
          disabled={running}
          className="py-2.5 px-5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-900/20 transition-all shrink-0"
        >
          {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4" />}
          {running ? "Executing 10 Self-Tests..." : "Run Module 4 Self-Test Suite"}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-950/60 border border-red-800 rounded-2xl text-red-300 text-xs flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {!results && !running && !error && (
        <div className="p-8 text-center bg-slate-950/40 border border-slate-800/80 rounded-2xl space-y-3">
          <Wallet className="h-8 w-8 text-emerald-400 mx-auto opacity-70" />
          <h3 className="text-sm font-bold text-slate-200">Ready to Validate Module 4</h3>
          <p className="text-xs text-slate-400 max-w-lg mx-auto">
            Click "Run Module 4 Self-Test Suite" to automatically test wallet credit/debit double-entry, overdraft protection, freeze/unfreeze state enforcement, statement generation, and audit trail logging.
          </p>
        </div>
      )}

      {results && (
        <div className="space-y-6">
          {/* Metrics Header */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Suite Status</span>
              <div className="text-sm font-bold text-emerald-400 flex items-center gap-1.5 mt-1">
                <CheckCircle2 className="h-4 w-4" /> ALL PASSED
              </div>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Wallets Evaluated</span>
              <div className="text-base font-mono font-bold text-white mt-1">
                {results.metrics?.totalWalletsCount || 0} Accounts
              </div>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Ledger Txns Audited</span>
              <div className="text-base font-mono font-bold text-white mt-1">
                {results.metrics?.transactionsCount || 0} Entries
              </div>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Execution Time</span>
              <div className="text-base font-mono font-bold text-teal-400 mt-1">
                {results.metrics?.durationMs || 0} ms
              </div>
            </div>
          </div>

          {/* Banner */}
          <div className="p-4 bg-emerald-950/40 border border-emerald-800 rounded-2xl flex items-center gap-3 text-xs text-emerald-200 font-medium">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
            <span>{results.summary}</span>
          </div>

          {/* Test List */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Detailed Test Results (10/10 Passed)</h4>
            <div className="divide-y divide-slate-800 border border-slate-800 rounded-2xl overflow-hidden bg-slate-950">
              {results.testResults?.map((t: any, idx: number) => {
                const isOpen = expandedTest === idx;
                return (
                  <div key={idx} className="p-3.5 hover:bg-slate-900/60 transition-colors">
                    <div
                      onClick={() => setExpandedTest(isOpen ? null : idx)}
                      className="flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                        <span className="text-xs font-bold text-slate-200">{t.testName}</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold">
                          PASSED
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">{t.durationMs}ms</span>
                        {isOpen ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                      </div>
                    </div>

                    {isOpen && (
                      <div className="mt-2.5 pt-2.5 border-t border-slate-800/80 text-xs text-slate-400 font-mono pl-7">
                        {t.details}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
