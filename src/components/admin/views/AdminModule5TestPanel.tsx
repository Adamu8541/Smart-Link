import React, { useState } from "react";
import { Play, CheckCircle2, XCircle, RefreshCw, ChevronDown, ChevronUp, ShieldCheck, Terminal, Cpu } from "lucide-react";

export function AdminModule5TestPanel() {
  const [running, setRunning] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);

  const runTests = async () => {
    setRunning(true);
    setError(null);
    try {
      const token = localStorage.getItem("smartlink_admin_token") || "";
      const res = await fetch("/api/admin/module5/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": token
        }
      });
      const json = await res.json();
      if (json.success) {
        setTestResults(json);
      } else {
        setError(json.message || "Module 5 test suite execution failed.");
      }
    } catch (err: any) {
      setError("Network or server connection error during automated test run.");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
      <div
        onClick={() => setExpanded(!expanded)}
        className="p-5 bg-slate-950/80 border-b border-slate-800/80 flex items-center justify-between cursor-pointer select-none"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-950 border border-purple-800 rounded-2xl text-purple-400">
            <Terminal className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">Automated Self-Test Engine</span>
              <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded-full text-[10px] font-mono font-bold">10/10 MODULE 5 TESTS</span>
            </div>
            <h3 className="text-sm font-bold text-white mt-0.5">Module 5 — Transaction Management System Suite</h3>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              runTests();
            }}
            disabled={running}
            className="py-2 px-4 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer shadow-lg shadow-purple-600/20 transition-all"
          >
            {running ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            <span>{running ? "Executing Suite..." : "Run Module 5 Self-Tests"}</span>
          </button>
          {expanded ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
        </div>
      </div>

      {expanded && (
        <div className="p-6 space-y-5 bg-slate-900">
          {error && (
            <div className="p-4 bg-rose-950/80 border border-rose-800 text-xs text-rose-300 rounded-2xl flex items-center gap-3">
              <XCircle className="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!testResults && !running && (
            <div className="p-8 border border-dashed border-slate-800 rounded-2xl text-center space-y-2">
              <Cpu className="h-8 w-8 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-400 font-medium">Click "Run Module 5 Self-Tests" to trigger automated validation across Search, Filters, Export, Read-Only Protection, Audit Trail & Metrics.</p>
            </div>
          )}

          {running && (
            <div className="p-8 border border-slate-800 rounded-2xl bg-slate-950/50 text-center space-y-3">
              <RefreshCw className="h-8 w-8 text-purple-400 animate-spin mx-auto" />
              <p className="text-xs text-slate-300 font-mono">Executing 10 automated self-test cases in backend container...</p>
            </div>
          )}

          {testResults && (
            <div className="space-y-4">
              {/* Summary Card */}
              <div className="p-4 bg-slate-950 border border-purple-800/60 rounded-2xl flex flex-wrap items-center justify-between gap-4 text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">Status Summary</span>
                  <p className="font-bold text-white text-sm mt-0.5">{testResults.summary}</p>
                </div>
                <div className="flex gap-4 font-mono text-slate-300">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">Transactions</span>
                    <span className="font-bold text-emerald-400">{testResults.metrics?.totalTransactionsCount}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">Notes</span>
                    <span className="font-bold text-cyan-400">{testResults.metrics?.notesCount}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">Audit Entries</span>
                    <span className="font-bold text-amber-400">{testResults.metrics?.auditLogsCount}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">Duration</span>
                    <span className="font-bold text-purple-400">{testResults.metrics?.durationMs}ms</span>
                  </div>
                </div>
              </div>

              {/* 10 Test Items Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {testResults.testResults?.map((t: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-1.5 transition-all hover:border-slate-700"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {t.status === "PASSED" ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                        ) : (
                          <XCircle className="h-4 w-4 text-rose-400 shrink-0" />
                        )}
                        <span className="font-bold text-white text-xs truncate max-w-[240px]">{t.testName}</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500">{t.durationMs}ms</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{t.details}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
