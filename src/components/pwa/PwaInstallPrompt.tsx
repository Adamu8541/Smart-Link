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
  Globe,
  QrCode
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

  // Detect iOS Safari
  const isIos =
    typeof window !== "undefined" &&
    (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) &&
    !(window as any).MSStream;

  // Detect Android
  const isAndroid = typeof window !== "undefined" && /Android/.test(navigator.userAgent);

  useEffect(() => {
    // Check if already running in standalone mode (installed PWA)
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Check URL parameters for ?install=true or #install
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("install") === "true" || window.location.pathname === "/install" || window.location.hash === "#install") {
      setShowModal(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);

      // Only show top banner if not dismissed in this session
      const dismissed = sessionStorage.getItem("pwa_install_banner_dismissed");
      if (!dismissed && !isStandalone) {
        setShowBanner(true);
      }
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setShowModal(false);
      setShowBanner(false);
      setDeferredPrompt(null);
    };

    // Custom global event to open install modal from any button in the app
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
      }
    } else if (isIos) {
      setShowModal(true);
    } else {
      setShowModal(true);
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
      {/* Floating Bottom / Top Install Callout Banner */}
      {showBanner && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:w-96 z-50 bg-[#0F2D5C] text-white rounded-2xl p-3.5 shadow-2xl border border-white/20 animate-slideUp">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 border border-white/10">
                <Smartphone className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <h4 className="text-xs font-bold flex items-center gap-1.5 text-white">
                  <span>Install SmartLink App</span>
                  <span className="text-[10px] bg-amber-400/20 text-amber-300 px-1.5 py-0.2 rounded-full font-bold">Fast</span>
                </h4>
                <p className="text-[11px] text-slate-300">Add to Home Screen for instant 1-tap access</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleInstallClick}
                className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-900 font-extrabold text-xs shadow-xs transition-transform active:scale-95 cursor-pointer"
              >
                Install
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowBanner(false);
                  sessionStorage.setItem("pwa_install_banner_dismissed", "true");
                }}
                className="w-7 h-7 rounded-lg hover:bg-white/10 text-slate-300 flex items-center justify-center cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Install Modal Guide */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-left flex flex-col animate-scaleIn">
            {/* Header */}
            <div className="p-5 bg-gradient-to-r from-[#0F2D5C] to-[#1E4D8C] text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
                  <Smartphone className="w-6 h-6 text-amber-300" />
                </div>
                <div>
                  <h3 className="text-base font-black tracking-tight">Install SmartLink NG</h3>
                  <p className="text-xs text-slate-200">Official Mobile Web App on your Home Screen</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 space-y-4 overflow-y-auto max-h-[75vh]">
              {/* Direct Install Action Button if browser supports 1-click */}
              {deferredPrompt && (
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-center space-y-2">
                  <div className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                    Ready to install on this device!
                  </div>
                  <button
                    type="button"
                    onClick={handleInstallClick}
                    className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-black text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all"
                  >
                    <Download className="w-4 h-4" />
                    <span>Tap Here to Install App Now</span>
                  </button>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                    No App Store download required • 0MB storage used • Instant launch
                  </p>
                </div>
              )}

              {/* iOS Safari Step-by-Step Instructions */}
              {isIos && (
                <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <div className="text-xs font-black uppercase tracking-wider text-[#0F2D5C] dark:text-amber-400 flex items-center gap-1.5">
                    <span>How to Install on iPhone / iPad (Safari)</span>
                  </div>
                  <div className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-[#0F2D5C] text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                      <p>
                        Tap the <strong>Share button</strong> <Share2 className="w-3.5 h-3.5 inline mx-1 text-blue-600" /> at the bottom bar of Safari.
                      </p>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-[#0F2D5C] text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                      <p>
                        Scroll down the menu and tap <strong>"Add to Home Screen"</strong> <PlusSquare className="w-3.5 h-3.5 inline mx-1 text-slate-700" />.
                      </p>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-[#0F2D5C] text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                      <p>
                        Tap <strong>"Add"</strong> at the top right corner. Done!
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Android Manual Steps if prompt is not active */}
              {!isIos && !deferredPrompt && (
                <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <div className="text-xs font-black uppercase tracking-wider text-[#0F2D5C] dark:text-amber-400 flex items-center gap-1.5">
                    <span>How to Install on Android (Chrome / Edge)</span>
                  </div>
                  <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-[#0F2D5C] text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                      <p>Tap the <strong>three dots (⋮)</strong> at the top right corner of Chrome.</p>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-[#0F2D5C] text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                      <p>Select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</p>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-[#0F2D5C] text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                      <p>Tap <strong>Install</strong> to add SmartLink directly to your phone screen.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Shareable Link Box */}
              <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  Direct Installation Link:
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value="https://smartlinkng.com.ng/install"
                    className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 dark:text-slate-200 select-all"
                  />
                  <button
                    type="button"
                    onClick={handleCopyInstallLink}
                    className="px-3.5 py-2 rounded-xl bg-[#0F2D5C] hover:bg-[#17407E] text-white text-xs font-bold shrink-0 cursor-pointer transition-colors shadow-2xs"
                  >
                    {copiedLink ? "Copied! ✓" : "Copy Link"}
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  Send this link to customers via WhatsApp or SMS so they can install the app on their phone.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-medium">SmartLink NG PWA Engine</span>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 cursor-pointer"
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
