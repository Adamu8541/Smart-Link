/**
 * SmartLink Admin Panel — Module 1 Automated Self-Test Panel
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ShieldCheck,
  PlayCircle,
  CheckCircle2,
  XCircle,
  Loader2,
  X,
  RefreshCw,
  Activity,
  Layers,
  Database,
  Lock
} from "lucide-react";
import { AdminSession } from "../../services/adminAuthService";

interface AdminModule1TestPanelProps {
  onClose: () => void;
  session: AdminSession;
}

export default function AdminModule1TestPanel({ onClose, session }: AdminModule1TestPanelProps) {
  const [running, setRunning] = useState(false);
  const [testResponse, setTestResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const runTests = async () => {
    setRunning(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/module1/test", { method: "POST" });
      const data = await res.json();
      setTestResponse(data);
    } catch (err: any) {
      setError("Failed to execute Module 1 test suite: " + err.message);
    } finally {
      setRunning(false);
    }
  };

  useEffect(() => {
    runTests();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative max-h-[90vh] flex flex-col space-y-5"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-950/80 border border-blue-800/80 rounded-2xl text-blue-400">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
              Module 1 Automated Test Runner
            </span>
            <h2 className="text-base md:text-lg font-bold text-white">
              Admin Authentication & RBAC Verification
            </h2>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {running && (
            <div className="py-12 flex flex-col items-center justify-center space-y-3 text-slate-400">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              <p className="text-xs font-medium">Executing Module 1 Automated Self-Tests...</p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-rose-950/80 border border-rose-800/80 rounded-2xl text-rose-300 text-xs">
              {error}
            </div>
          )}

          {!running && testResponse && (
            <div className="space-y-4">
              {/* Overall Banner */}
              <div
                className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${
                  testResponse.success
                    ? "bg-emerald-950/80 border-emerald-800 text-emerald-200"
                    : "bg-rose-950/80 border-rose-800 text-rose-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  {testResponse.success ? (
                    <CheckCircle2 className="h-6 w-6 text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="h-6 w-6 text-rose-400 shrink-0" />
                  )}
                  <div>
                    <p className="font-bold text-sm">
                      {testResponse.success ? "All Module 1 Tests PASSED!" : "Module 1 Test Failures Detected"}
                    </p>
                    <p className="text-xs opacity-90">{testResponse.summary}</p>
                  </div>
                </div>
              </div>

              {/* Metrics Box */}
              {testResponse.testResults?.metrics && (
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-center">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Admin Directory</p>
                    <p className="text-base font-extrabold text-white mt-0.5">
                      {testResponse.testResults.metrics.totalAdminUsers} Users
                    </p>
                  </div>

                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-center">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Active Sessions</p>
                    <p className="text-base font-extrabold text-blue-400 mt-0.5">
                      {testResponse.testResults.metrics.activeSessions} Sessions
                    </p>
                  </div>

                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-center">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Audit Logs</p>
                    <p className="text-base font-extrabold text-emerald-400 mt-0.5">
                      {testResponse.testResults.metrics.totalActivityLogs} Records
                    </p>
                  </div>
                </div>
              )}

              {/* Individual Test Cases */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Individual Test Cases ({testResponse.testResults?.results?.length || 0}):
                </p>
                <div className="space-y-2">
                  {testResponse.testResults?.results?.map((res: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {res.status === "PASSED" ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                          ) : (
                            <XCircle className="h-4 w-4 text-rose-400 shrink-0" />
                          )}
                          <p className="font-bold text-white">{res.testName}</p>
                        </div>
                        <p className="text-slate-400 pl-6 leading-relaxed">{res.details}</p>
                      </div>

                      <div className="shrink-0 text-right">
                        <span
                          className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold ${
                            res.status === "PASSED"
                              ? "bg-emerald-950 border border-emerald-800 text-emerald-400"
                              : "bg-rose-950 border border-rose-800 text-rose-400"
                          }`}
                        >
                          {res.status}
                        </span>
                        <p className="text-[10px] text-slate-500 font-mono mt-1">{res.durationMs}ms</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={runTests}
            disabled={running}
            className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${running ? "animate-spin" : ""}`} />
            Re-run Self-Test
          </button>

          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
}
