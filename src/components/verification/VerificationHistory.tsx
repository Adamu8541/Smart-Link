import React, { useState, useEffect } from "react";
import { Search, History, FileText, RefreshCw, CheckCircle2, AlertCircle, Download, X, Clock, ShieldCheck, Filter } from "lucide-react";
import { VerificationHistoryItem, StandardizedVerificationResult } from "../../types/verification";
import { VerificationEngine } from "../../services/verificationEngine";
import { VerificationReceipt } from "./VerificationReceipt";

interface VerificationHistoryProps {
  userId: string;
  onRepeatVerification?: (serviceType: string, targetId: string) => void;
}

export const VerificationHistory: React.FC<VerificationHistoryProps> = ({
  userId,
  onRepeatVerification,
}) => {
  const [historyItems, setHistoryItems] = useState<VerificationHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedServiceFilter, setSelectedServiceFilter] = useState<string>("ALL");
  const [selectedReceiptItem, setSelectedReceiptItem] = useState<VerificationHistoryItem | null>(null);

  const loadHistory = async () => {
    setIsLoading(true);
    const data = await VerificationEngine.getVerificationHistory(userId);
    setHistoryItems(data);
    setIsLoading(false);
  };

  useEffect(() => {
    if (userId) {
      loadHistory();
    }
  }, [userId]);

  const filteredItems = historyItems.filter((item) => {
    const matchesQuery =
      !searchQuery ||
      item.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.receiptNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.serviceTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.providerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.maskedId.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesService =
      selectedServiceFilter === "ALL" ||
      item.service.toUpperCase() === selectedServiceFilter.toUpperCase();

    return matchesQuery && matchesService;
  });

  const convertToStandardizedResult = (
    item: VerificationHistoryItem
  ): StandardizedVerificationResult => {
    return {
      status: item.status,
      reference: item.reference,
      message: `${item.serviceTitle} verified from ${item.providerName}`,
      data: item.data || null,
      timestamp: item.createdAt,
      providerName: item.providerName,
      responseTime: item.responseTime || 250,
      receiptNumber: item.receiptNumber,
      service: item.service,
      serviceTitle: item.serviceTitle,
      fee: item.fee,
      verifiedId: item.verifiedId,
      maskedId: item.maskedId,
      userId: item.userId,
    };
  };

  return (
    <div className="space-y-4">
      {/* Header & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
            <History className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Verification History Log</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              History log of identity, corporate, and credential verification checks
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-56">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reference or ID..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Service Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {["ALL", "NIN", "BVN", "CAC", "TIN", "PHONE", "EMAIL", "DRIVER_LICENSE", "PASSPORT", "VOTER_CARD"].map((svc) => (
          <button
            key={svc}
            type="button"
            onClick={() => setSelectedServiceFilter(svc)}
            className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer whitespace-nowrap ${
              selectedServiceFilter === svc
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            {svc === "ALL" ? "All History" : svc}
          </button>
        ))}
      </div>

      {/* History Items List */}
      {isLoading ? (
        <div className="space-y-2.5">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-16 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse"
            />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="p-8 text-center bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
          <FileText className="h-8 w-8 text-slate-400 mx-auto" />
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            No verification history found
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
            {searchQuery || selectedServiceFilter !== "ALL"
              ? "Try adjusting your search query or filter settings."
              : "Your official verification activity will appear here once you perform a NIN, BVN, or corporate check."}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl hover:border-blue-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shrink-0">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {item.serviceTitle}
                    </span>
                    <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md font-bold text-slate-600 dark:text-slate-400">
                      ID: {item.maskedId}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                    <span>{item.providerName}</span>
                    <span>•</span>
                    <span className="font-mono">#{item.reference}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-0 border-slate-100 dark:border-slate-800">
                <div className="text-left sm:text-right">
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    ₦{item.fee.toLocaleString()}
                  </span>
                  <p className="text-[10px] text-slate-400">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSelectedReceiptItem(item)}
                    className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                    title="View Receipt"
                  >
                    <FileText className="h-3.5 w-3.5" />
                  </button>

                  {onRepeatVerification && (
                    <button
                      type="button"
                      onClick={() => onRepeatVerification(item.service, item.verifiedId)}
                      className="px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-600 dark:text-blue-400 font-semibold text-[11px] transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <RefreshCw className="h-3 w-3" />
                      <span>Repeat</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Receipt Modal */}
      {selectedReceiptItem && (
        <VerificationReceipt
          result={convertToStandardizedResult(selectedReceiptItem)}
          onClose={() => setSelectedReceiptItem(null)}
        />
      )}
    </div>
  );
};
