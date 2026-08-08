/**
 * SmartLink Admin Panel — Module 3 Automated Self-Test Suite Runner Component
 * Executes real-time validation for User Management search, filters, status transitions,
 * wallet adjustments, audit logs, bulk actions, and RBAC guards.
 */

import React, { useState } from "react";
import { motion } from "motion/react";
import {
  X,
  PlayCircle,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Terminal,
  Users,
  Shield,
  Wallet,
  FileText
} from "lucide-react";
import { AdminSession } from "../../services/adminAuthService";

interface AdminModule3TestPanelProps {
  onClose: () => void;
  session: AdminSession;
}

interface TestItem {
  testName: string;
  status: "PASSED" | "FAILED";
  durationMs: number;
  details: string;
}

export default function AdminModule3TestPanel({ onClose, session }: AdminModule3TestPanelProps) {
  const [running, setRunning] = useState(false);
  const [testResults, setTestResults] = useState<{
    success: boolean;
    module: string;
    summary: string;
    testResults: TestItem[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRunTests = async () => {
    setRunning(true);
    setError(null);
    setTestResults(null);

    try {
      const res = await fetch("/api/admin/module3/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": session.sessionToken,
        },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.message || "Module 3 test execution failed.");
      }

      setTestResults(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative flex flex-col max-h-[90vh]"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3 border-b border-slate-800 pb-4 mb-5">
          <div className="p-3 bg-purple-950 border border-purple-800 rounded-2xl text-purple-400">
            <Terminal className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">Automated Test Verification Suite</span>
            <h3 className="text-base font-bold text-white">Module 3 — User Management System</h3>
            <p className="text-xs text-slate-400">Validates Search, Filters, RBAC, Status Transitions, Wallet Ledger & Audit Logs.</p>
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between bg-slate-950 p-4 border border-slate-800 rounded-2xl">
          <div>
            <p className="text-xs font-bold text-white">Self-Test Diagnostic Suite</p>
            <p className="text-[11px] text-slate-400">Runs 10 automated test scenarios directly against live backend API handlers.</p>
          </div>

          <button
            type="button"
            onClick={handleRunTests}
            disabled={running}
            className="py-2.5 px-5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
          >
            {running ? <RefreshCw className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4" />}
            {running ? "Executing Tests..." : "Run All Module 3 Tests"}
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-950 border border-rose-800 rounded-xl text-xs text-rose-300 mb-4">
            {error}
          </div>
        )}

        {/* Results Stream */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-slate-800">
          {!testResults && !running && (
            <div className="py-16 text-center text-slate-500 text-xs">
              <Users className="h-10 w-10 text-slate-700 mx-auto mb-2" />
              Click "Run All Module 3 Tests" above to execute the automated verification suite.
            </div>
          )}

          {running && (
            <div className="py-16 text-center text-slate-400 text-xs space-y-3">
              <RefreshCw className="h-8 w-8 animate-spin text-purple-400 mx-auto" />
              <p className="font-bold text-white">Executing User Management Test Suite...</p>
              <p className="text-[11px] text-slate-500">Testing RBAC enforcement, wallet credit/debit double-entry, status locks & audit records...</p>
            </div>
          )}

          {testResults && (
            <div className="space-y-4 text-xs">
              <div
                className={`p-4 rounded-2xl border ${
                  testResults.success
                    ? "bg-emerald-950/70 border-emerald-800 text-emerald-200"
                    : "bg-rose-950/70 border-rose-800 text-rose-200"
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-sm">
                  {testResults.success ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-rose-400" />
                  )}
                  <span>{testResults.summary}</span>
                </div>
              </div>

              <div className="space-y-2">
                {testResults.testResults.map((t, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl flex items-start justify-between gap-3"
                  >
                    <div className="flex items-start gap-2.5">
                      {t.status === "PASSED" ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <p className="font-bold text-white text-xs">{t.testName}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{t.details}</p>
                      </div>
                    </div>
                    <span className="font-mono text-[10px] text-slate-500 shrink-0">{t.durationMs}ms</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-slate-800 flex justify-end mt-4">
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs cursor-pointer"
          >
            Close Diagnostics
          </button>
        </div>
      </motion.div>
    </div>
  );
}
