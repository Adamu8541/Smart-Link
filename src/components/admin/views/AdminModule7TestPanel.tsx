import React, { useState } from "react";
import { Play, CheckCircle2, XCircle, RefreshCw, ChevronDown, ChevronUp, Terminal, Cpu } from "lucide-react";

export function AdminModule7TestPanel() {
  const [running, setRunning] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);

  const runTests = async () => {
    setRunning(true);
    setError(null);
    try {
      const token = localStorage.getItem("smartlink_admin_token") || "";
      const res = await fetch("/api/admin/module7/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": token,
        },
      });
      const json = await res.json();
      if (json.success) {
        setTestResults(json);
      } else {
        setError(json.message || "Module 7 test suite execution failed.");
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
          <div className="p-2.5 bg-emerald-950 border border-emerald-800 rounded-2xl text-emerald-400">
            <Terminal className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Automated Self-Test Engine</span>
              <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded-full text-[10px] font-mono font-bold">10/10 MODULE 7 TESTS</span>
            </div>
            <h3 className="text-sm font-bold text-white mt-0.5">Module 7 — System Settings & Platform Configuration</h3>
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
            className="py-2 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/20 transition-all"
          >
            {running ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            <span>{running ? "Executing Suite..." : "Run Module 7 Self-Tests"}</span>
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
              <p className="text-xs text-slate-400 font-medium">
                Click "Run Module 7 Self-Tests" to trigger automated validation across RBAC, Branding, Maintenance Mode, Backup Export & Audit Logging.
              </p>
            </div>
          )}

          {running && (
            <div className="p-8 border border-slate-800 rounded-2xl bg-slate-950/50 text-center space-y-3">
              <RefreshCw className="h-8 w-8 text-emerald-400 animate-spin mx-auto" />
              <p className="text-xs text-slate-300 font-mono">Executing 10 automated self-test cases in backend container...</p>
            </div>
          )}

          {testResults && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-950 border border-emerald-800/60 rounded-2xl flex flex-wrap items-center justify-between gap-4 text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Status Summary</span>
                  <p className="font-bold text-white text-sm mt-0.5">{testResults.summary}</p>
                </div>
                <div className="flex items-center gap-4 text-slate-300 font-mono text-[11px]">
                  <div>Categories: <strong className="text-emerald-400">{testResults.metrics?.categoriesConfigured}</strong></div>
                  <div>Maintenance: <strong className="text-emerald-400">{testResults.metrics?.maintenanceActive ? "ON" : "OFF"}</strong></div>
                  <div>Duration: <strong className="text-emerald-400">{testResults.metrics?.durationMs}ms</strong></div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {testResults.testResults?.map((test: any, idx: number) => (
                  <div key={idx} className="p-3 bg-slate-950/90 border border-slate-800/80 rounded-xl space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white truncate max-w-[280px]">{test.testName}</span>
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 border border-emerald-800 px-2 py-0.5 rounded-full shrink-0">
                        {test.status} ({test.durationMs}ms)
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono">{test.details}</p>
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
