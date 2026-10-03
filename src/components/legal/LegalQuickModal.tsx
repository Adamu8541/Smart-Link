/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from "react";
import {
  X,
  ShieldCheck,
  FileText,
  ExternalLink,
  Printer,
  ChevronRight,
  Shield
} from "lucide-react";
import { getLegalDocumentById, LEGAL_DOCUMENTS } from "./legalData";

interface LegalQuickModalProps {
  docId?: string | null;
  documentId?: string | null;
  isOpen?: boolean;
  onClose: () => void;
  onOpenFullPage?: (docId: string) => void;
  onOpenFullView?: (docId: string) => void;
}

export const LegalQuickModal: React.FC<LegalQuickModalProps> = ({
  docId,
  documentId,
  isOpen = true,
  onClose,
  onOpenFullPage,
  onOpenFullView,
}) => {
  const targetDocId = docId || documentId;

  useEffect(() => {
    if (isOpen && targetDocId) {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      document.documentElement.scrollTop = 0;
    }
  }, [isOpen, targetDocId]);

  if (!isOpen || !targetDocId) return null;

  const doc = getLegalDocumentById(targetDocId) || LEGAL_DOCUMENTS[0];
  const handleFullView = onOpenFullPage || onOpenFullView;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200 overflow-hidden">
      <div
        className="bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-slate-800 rounded-2xl sm:rounded-3xl w-full max-w-2xl max-h-[82dvh] sm:max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-3.5 py-2.5 sm:px-6 sm:py-3.5 border-b border-[#E5E7EB] dark:border-slate-800 flex items-center justify-between bg-[#F5F7FA] dark:bg-[#111827]/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-[#F5F7FA] dark:bg-[#0F2D5C]/80 text-[#0F2D5C] dark:text-[#9CA3AF]">
              <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div>
              <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">
                {doc.categoryLabel}
              </div>
              <h3 className="text-xs sm:text-base font-bold text-[#111827] dark:text-white truncate max-w-[200px] sm:max-w-none">
                {doc.title}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {handleFullView && (
              <button
                onClick={() => {
                  onClose();
                  handleFullView(doc.id);
                }}
                className="p-1.5 rounded-lg text-[#6B7280] hover:text-[#0F2D5C] hover:bg-[#E5E7EB] dark:hover:bg-[#111827] transition-colors text-[11px] font-semibold flex items-center gap-1 border-none bg-transparent cursor-pointer"
                title="Open in dedicated page"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Open Full Page</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#9CA3AF] hover:text-[#4B5563] dark:hover:text-white hover:bg-[#E5E7EB] dark:hover:bg-[#111827] transition-colors border-none bg-transparent cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-3.5 sm:p-5 overflow-y-auto space-y-3.5 sm:space-y-4 text-left text-xs sm:text-sm text-[#4B5563] dark:text-[#E5E7EB] flex-1">
          
          {/* Metadata Banner */}
          <div className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-[#F5F7FA]/60 dark:bg-[#0F2D5C]/40 border border-[#E5E7EB] dark:border-[#0F2D5C]/60 space-y-1.5">
            <div className="flex flex-wrap items-center justify-between gap-1.5 text-[10px] sm:text-[11px] text-[#6B7280] dark:text-[#9CA3AF]">
              <span>Effective: <strong>{doc.effectiveDate}</strong></span>
              <span>Last Updated: <strong>{doc.lastUpdated}</strong></span>
              <span>Version: <strong>{doc.version}</strong></span>
            </div>
            <p className="text-[11px] sm:text-xs text-[#4B5563] dark:text-[#E5E7EB] leading-relaxed">
              {doc.summary}
            </p>
          </div>

          {/* Document Sections */}
          <div className="space-y-3 sm:space-y-4">
            {doc.sections.map((sec) => (
              <div key={sec.id} className="space-y-2">
                <h4 className="text-xs sm:text-sm font-bold text-[#111827] dark:text-white pb-1 border-b border-[#E5E7EB] dark:border-[#111827]">
                  {sec.title}
                </h4>
                <div className="space-y-2 text-xs leading-relaxed text-[#4B5563] dark:text-[#E5E7EB]">
                  {sec.content.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>

                {sec.subsections?.map((sub, i) => (
                  <div key={i} className="pl-3 py-1 space-y-1">
                    <span className="font-bold text-[11px] text-[#111827] dark:text-[#E5E7EB] block">
                      {sub.subtitle}
                    </span>
                    <ul className="list-disc pl-4 space-y-1 text-[11px]">
                      {sub.points.map((pt, ptIdx) => (
                        <li key={ptIdx}>{pt}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ))}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-[#E5E7EB] dark:border-[#111827] bg-[#F5F7FA] dark:bg-[#111827]/60 flex items-center justify-between text-xs">
          <span className="text-[11px] text-[#6B7280]">
            Smart Link Computer Business (RC 9347502)
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#E5E7EB] dark:bg-[#111827] hover:bg-[#E5E7EB] dark:hover:bg-[#4B5563] text-[#111827] dark:text-white font-semibold transition-colors cursor-pointer border-none"
            >
              Close
            </button>
            {handleFullView && (
              <button
                onClick={() => {
                  onClose();
                  handleFullView(doc.id);
                }}
                className="px-4 py-2 rounded-xl bg-[#071C35] hover:bg-[#0A264A] text-white font-bold transition-colors cursor-pointer border-none flex items-center gap-1.5"
              >
                <span>Read Full Document</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
