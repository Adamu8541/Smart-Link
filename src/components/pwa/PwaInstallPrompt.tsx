import React, { useState, useEffect } from "react";
import {
  Download,
  Share2,
  PlusSquare,
  Smartphone,
  CheckCircle2,
  X,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Globe,
  Zap,
  Check
} from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export const PwaInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [installStatus, setInstallStatus] = useState<"idle" | "installing" | "installed" | "manual_guide">("idle");

  // Detect iOS Safari
  const isIos =
    typeof window !== "undefined" &&
    (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) &&
    !(window as any).MSStream;

  // Detect Android
  const isAndroid = typeof window !== "undefined" && /Android/.test(navigator.userAgent);

  useEffect(() => {
    // Check if running as installed standalone app
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Automatically trigger if URL contains install parameter or path
    const urlParams = new URLSearchParams(window.location.search);
    if (
      urlParams.get("install") === "true" ||
      window.location.pathname === "/install" ||
      window.location.hash === "#install"
    ) {
      setShowModal(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
      setShowBanner(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setShowModal(false);
      setShowBanner(false);
      setDeferredPrompt(null);
      setInstallStatus("installed");
    };

    const handleOpenInstallModal = () => {
      setShowModal(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    window.addEventListener("open_pwa_install_modal", handleOpenInstallModal);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      window.removeEventListener("open_pwa_install_modal", handleOpenInstallModal);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        setInstallStatus("installing");
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === "accepted") {
          setIsInstalled(true);
          setShowModal(false);
          setShowBanner(false);
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.error("Install prompt error:", err);
        setInstallStatus("manual_guide");
      }
    } else {
      // If browser hasn't fired beforeinstallprompt yet (or iOS/desktop), switch to interactive guide
      setInstallStatus("manual_guide");
    }
  };

  const handleCopyInstallLink = () => {
    const installUrl = "https://smartlinkng.com.ng/install";
    navigator.clipboard.writeText(installUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  if (isInstalled) return null;

  return (
    <>
      {/* Main Install Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/75 backdrop-blur-xs animate-fadeIn overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-left flex flex-col animate-scaleIn my-auto">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-[#0F2D5C] via-[#17407E] to-[#0F2D5C] text-white flex items-center justify-between relative">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white p-1 flex items-center justify-center shadow-md border border-white/30 shrink-0">
                  <img
                    src="/favicon.webp"
                    alt="Smart Link NG"
                    className="w-full h-full object-contain rounded-xl"
                    onError={(e) => {
                      (e.currentTarget as any).src = "/logo.png";
                    }}
                  />
                </div>
                <div>
                  <h3 className="text-base font-black tracking-tight text-white flex items-center gap-1.5">
                    <span>Install Smart Link NG</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  </h3>
                  <p className="text-[11px] text-slate-200">Official Mobile &amp; Desktop Application</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 sm:p-6 space-y-4">
              {/* PRIMARY 1-TAP INSTALL BUTTON (ALWAYS SHOWN) */}
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-500/30 text-center space-y-3 shadow-inner">
                <div className="space-y-1">
                  <div className="text-xs font-black uppercase tracking-wider text-emerald-900 dark:text-emerald-200 flex items-center justify-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span>Instant 1-Tap Mobile Installation</span>
                  </div>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                    Works offline • 0MB storage used • Launches like a native app
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleInstallClick}
                  className="w-full py-3.5 px-4 rounded-xl bg-[#0F2D5C] hover:bg-[#17407E] active:scale-98 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-900/30 cursor-pointer transition-all border border-blue-400/30"
                >
                  <Download className="w-5 h-5 text-amber-300 animate-bounce" />
                  <span className="text-amber-300">Install Smart Link NG Now</span>
                </button>
              </div>

              {/* Step-by-Step Device Guides */}
              <div className="space-y-3">
                {/* iOS Instructions */}
                {isIos && (
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
                    <span className="text-[11px] font-black uppercase text-[#0F2D5C] dark:text-amber-400 block">
                      iPhone &amp; iPad (Apple Safari):
                    </span>
                    <div className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full bg-[#0F2D5C] text-white text-[9px] font-bold flex items-center justify-center shrink-0">1</span>
                        <span>Tap the <strong>Share button</strong> <Share2 className="w-3.5 h-3.5 inline mx-0.5 text-blue-600" /> at the bottom of Safari</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full bg-[#0F2D5C] text-white text-[9px] font-bold flex items-center justify-center shrink-0">2</span>
                        <span>Select <strong>"Add to Home Screen"</strong> <PlusSquare className="w-3.5 h-3.5 inline mx-0.5 text-slate-700 dark:text-slate-300" /></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full bg-[#0F2D5C] text-white text-[9px] font-bold flex items-center justify-center shrink-0">3</span>
                        <span>Tap <strong>"Add"</strong> at the top right. Done!</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Android / Chrome Manual Steps */}
                {!isIos && (
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
                    <span className="text-[11px] font-black uppercase text-[#0F2D5C] dark:text-amber-400 block">
                      Android / Chrome / Edge Instructions:
                    </span>
                    <div className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full bg-[#0F2D5C] text-white text-[9px] font-bold flex items-center justify-center shrink-0">1</span>
                        <span>Tap the <strong>three dots (⋮)</strong> in your browser menu</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full bg-[#0F2D5C] text-white text-[9px] font-bold flex items-center justify-center shrink-0">2</span>
                        <span>Tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong></span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Copyable Share Link */}
                <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1.5">
                  <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 block">
                    Direct Customer Share Link:
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value="https://smartlinkng.com.ng/install"
                      className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-slate-800 dark:text-slate-200 select-all"
                    />
                    <button
                      type="button"
                      onClick={handleCopyInstallLink}
                      className="px-3 py-1.5 rounded-lg bg-[#0F2D5C] hover:bg-[#17407E] text-white text-xs font-bold shrink-0 cursor-pointer shadow-2xs"
                    >
                      {copiedLink ? "Copied! ✓" : "Copy Link"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <span className="text-[10px] text-slate-500 flex items-center gap-1 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Verified Progressive Web App
              </span>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-1.5 rounded-xl text-xs font-bold bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
