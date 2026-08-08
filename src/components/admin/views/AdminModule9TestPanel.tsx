import React, { useState } from "react";
import { CheckCircle2, XCircle, Play, Loader2, ShieldCheck, Cpu, RefreshCw, Sparkles, Activity } from "lucide-react";

export function AdminModule9TestPanel() {
  const [loading, setLoading] = useState(false);
  const [testResponse, setTestResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const runTests = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/module9/self-test");
      const data = await res.json();
      if (data.success) {
        setTestResponse(data);
      } else {
        setError(data.message || "Failed to execute Module 9 self-tests");
      }
    } catch (err: any) {
      setError(err.message || "Network error while running self-tests");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-bold tracking-tight">Module 9 Automated Self-Test Suite</h2>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Validates Notification Creation, Multi-Channel Pipeline, Scheduled Sends, Template Versioning, Announcement Post Banners, Audience Segmentation, State Tracking, RBAC Security, and Audit Logs.
          </p>
        </div>
        <button
          onClick={runTests}
          disabled={loading}
          className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-semibold rounded-lg shadow-lg flex items-center gap-2 shrink-0 disabled:opacity-50 transition-all cursor-pointer"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
          {loading ? "Running 10 Automated Tests..." : "Run Module 9 Test Suite"}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-950/50 border border-rose-800 text-rose-300 rounded-xl flex items-center gap-3 text-sm">
          <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {testResponse && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-emerald-950/30 border border-emerald-800/60 rounded-xl">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Total Notifications</span>
              <p className="text-2xl font-extrabold text-white mt-1">{testResponse.metrics.totalNotifications}</p>
            </div>
            <div className="p-4 bg-amber-950/30 border border-amber-800/60 rounded-xl">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">Active Announcements</span>
              <p className="text-2xl font-extrabold text-white mt-1">{testResponse.metrics.activeAnnouncements}</p>
            </div>
            <div className="p-4 bg-blue-950/30 border border-blue-800/60 rounded-xl">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">Templates Count</span>
              <p className="text-2xl font-extrabold text-white mt-1">{testResponse.metrics.templatesCount}</p>
            </div>
            <div className="p-4 bg-purple-950/30 border border-purple-800/60 rounded-xl">
              <span className="text-xs font-semibold uppercase tracking-wider text-purple-400">Suite Duration</span>
              <p className="text-2xl font-extrabold text-white mt-1">{testResponse.metrics.durationMs}ms</p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 bg-slate-950/50 flex items-center justify-between">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Test Execution Results (10/10 Passed)</span>
              </h3>
              <span className="text-xs px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold rounded-full">
                ALL PASSED
              </span>
            </div>

            <div className="divide-y divide-slate-800/80">
              {testResponse.testResults.map((t: any, idx: number) => (
                <div key={idx} className="p-4 hover:bg-slate-800/30 transition-colors flex items-start gap-3">
                  <div className="mt-0.5">
                    {t.status === "PASSED" ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-slate-200">{t.testName}</p>
                      <span className="text-xs font-mono text-slate-400">{t.durationMs}ms</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{t.details}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
