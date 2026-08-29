/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
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
  if (!isOpen || !targetDocId) return null;

  const doc = getLegalDocumentById(targetDocId) || LEGAL_DOCUMENTS[0];
  const handleFullView = onOpenFullPage || onOpenFullView;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {doc.categoryLabel}
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                {doc.title}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {handleFullView && (
              <button
                onClick={() => {
                  onClose();
                  handleFullView(doc.id);
                }}
                className="p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-xs font-semibold flex items-center gap-1 border-none bg-transparent cursor-pointer"
                title="Open in dedicated page"
              >
                <ExternalLink className="h-4 w-4" />
                <span className="hidden sm:inline">Open Full Page</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border-none bg-transparent cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-left text-xs sm:text-sm text-slate-700 dark:text-slate-300">
          
          {/* Metadata Banner */}
          <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
              <span>Effective: <strong>{doc.effectiveDate}</strong></span>
              <span>Last Updated: <strong>{doc.lastUpdated}</strong></span>
              <span>Version: <strong>{doc.version}</strong></span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {doc.summary}
            </p>
          </div>

          {/* Document Sections */}
          <div className="space-y-6">
            {doc.sections.map((sec) => (
              <div key={sec.id} className="space-y-2">
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white pb-1 border-b border-slate-100 dark:border-slate-800">
                  {sec.title}
                </h4>
                <div className="space-y-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                  {sec.content.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>

                {sec.subsections?.map((sub, i) => (
                  <div key={i} className="pl-3 py-1 space-y-1">
                    <span className="font-bold text-[11px] text-slate-800 dark:text-slate-200 block">
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
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex items-center justify-between text-xs">
          <span className="text-[11px] text-slate-500">
            Smart Link Nigeria (CAC RC 9347502)
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-semibold transition-colors cursor-pointer border-none"
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
