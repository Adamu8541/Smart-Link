/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { X, Check, AlertTriangle, Printer, Copy, ShieldCheck, Download, QrCode } from "lucide-react";
import QRCode from "qrcode";
import { ServiceItem } from "./ServicesGrid";
import { UserProfile } from "../types";
import { SmartLinkLogoMark } from "./ui/SmartLinkLogoMark";
import { VerificationEngine } from "./verification/VerificationEngine";
import { NinVerificationView } from "./verification/NinVerificationView";
import { BvnVerificationView } from "./verification/BvnVerificationView";
import { CacVerificationView } from "./verification/CacVerificationView";
import { TinVerificationView } from "./verification/TinVerificationView";
import { BankAccountVerificationView } from "./verification/BankAccountVerificationView";
import { WalletFundingView } from "./wallet/WalletFundingView";
import { BillPaymentView } from "./bills/BillPaymentView";
import { BillCategoryType } from "../types/bills";
import { VerificationType } from "../types/verification";
import { normalizePhotoUrl } from "../services/slipOptionsConfig";

interface ServiceModalProps {
  service: ServiceItem | null;
  onClose: () => void;
  currentUser: UserProfile | null;
  onRefreshUser: (uid: string) => void;
}

export default function ServiceModal({ service, onClose, currentUser, onRefreshUser }: ServiceModalProps) {
  const [formData, setFormData] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<any | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");

  if (!service) return null;

  if ((service.id === "wallet_funding" || service.id === "fund_wallet") && currentUser) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
        <div className="w-full max-w-4xl my-8">
          <WalletFundingView
            currentUser={currentUser}
            onBackToDashboard={onClose}
            onBalanceUpdate={() => onRefreshUser(currentUser.uid)}
          />
        </div>
      </div>
    );
  }

  // Determine if this service belongs to Module 7 Bill Payment Engine
  const serviceCategoryStr = service.category as string;
  const isBillPaymentService =
    serviceCategoryStr === "VTU" ||
    serviceCategoryStr === "UTILITY" ||
    serviceCategoryStr === "EDUCATION" ||
    service.id.startsWith("vtu_") ||
    service.id.startsWith("bill_") ||
    service.id.includes("airtime") ||
    service.id.includes("data") ||
    service.id.includes("electricity") ||
    service.id.includes("cable") ||
    service.id.includes("betting") ||
    service.id.includes("waec") ||
    service.id.includes("neco") ||
    service.id.includes("jamb") ||
    service.id.includes("internet");

  const getBillCategory = (svcId: string): BillCategoryType => {
    if (svcId.includes("airtime")) return "AIRTIME";
    if (svcId.includes("data")) return "DATA";
    if (svcId.includes("electricity") || svcId.includes("power")) return "ELECTRICITY";
    if (svcId.includes("cable") || svcId.includes("dstv") || svcId.includes("gotv")) return "CABLE_TV";
    if (svcId.includes("internet") || svcId.includes("wifi")) return "INTERNET";
    if (svcId.includes("waec") || svcId.includes("neco") || svcId.includes("jamb") || svcId.includes("exam")) return "EDUCATION";
    if (svcId.includes("betting") || svcId.includes("bet")) return "BETTING";
    if (svcId.includes("water")) return "WATER";
    if (svcId.includes("waste") || svcId.includes("lawma")) return "WASTE";
    if (svcId.includes("tax") || svcId.includes("levy") || svcId.includes("govt")) return "GOVERNMENT";
    return "AIRTIME";
  };

  if (isBillPaymentService && currentUser) {
    const initialCategory = getBillCategory(service.id);
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
        <div className="w-full max-w-4xl my-8">
          <BillPaymentView
            currentUser={currentUser}
            initialCategory={initialCategory}
            onBackToDashboard={onClose}
            onBalanceUpdate={() => onRefreshUser(currentUser.uid)}
          />
        </div>
      </div>
    );
  }

  // Determine if this is a verification engine service
  const isVerificationService =
    service.category === "IDENTITY" ||
    service.id.startsWith("id_") ||
    service.id.includes("verification") ||
    service.id.includes("search");

  const getVerificationType = (svcId: string): VerificationType => {
    if (svcId.includes("bvn")) return "BVN";
    if (svcId.includes("nin")) return "NIN";
    if (svcId.includes("phone")) return "PHONE";
    if (svcId.includes("email")) return "EMAIL";
    if (svcId.includes("cac") || svcId.includes("biz")) return "CAC";
    if (svcId.includes("tax") || svcId.includes("tin")) return "TIN";
    if (svcId.includes("bank") || svcId.includes("account")) return "BANK_ACCOUNT";
    if (svcId.includes("license") || svcId.includes("driver")) return "DRIVER_LICENSE";
    if (svcId.includes("passport")) return "PASSPORT";
    if (svcId.includes("voter") || svcId.includes("vin")) return "VOTER_CARD";
    return "NIN";
  };

  if (isVerificationService && currentUser) {
    const vType = getVerificationType(service.id);
    if (vType === "NIN") {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
          <div className="w-full max-w-5xl my-8">
            <NinVerificationView
              userId={currentUser.uid}
              userEmail={currentUser.email}
              onBackToDashboard={onClose}
              onBalanceUpdate={() => onRefreshUser(currentUser.uid)}
            />
          </div>
        </div>
      );
    }
    if (vType === "BVN") {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
          <div className="w-full max-w-5xl my-8">
            <BvnVerificationView
              userId={currentUser.uid}
              userEmail={currentUser.email}
              onBackToDashboard={onClose}
              onBalanceUpdate={() => onRefreshUser(currentUser.uid)}
            />
          </div>
        </div>
      );
    }
    if (vType === "CAC") {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
          <div className="w-full max-w-3xl my-8">
            <CacVerificationView
              userId={currentUser.uid}
              onBackToDashboard={onClose}
              onBalanceUpdate={() => onRefreshUser(currentUser.uid)}
            />
          </div>
        </div>
      );
    }
    if (vType === "TIN") {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
          <div className="w-full max-w-3xl my-8">
            <TinVerificationView
              userId={currentUser.uid}
              onBackToDashboard={onClose}
              onBalanceUpdate={() => onRefreshUser(currentUser.uid)}
            />
          </div>
        </div>
      );
    }
    if (vType === "BANK_ACCOUNT") {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
          <div className="w-full max-w-3xl my-8">
            <BankAccountVerificationView
              userId={currentUser.uid}
              onBackToDashboard={onClose}
              onBalanceUpdate={() => onRefreshUser(currentUser.uid)}
            />
          </div>
        </div>
      );
    }
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
        <div className="w-full max-w-2xl my-8">
          <VerificationEngine
            userId={currentUser.uid}
            initialServiceType={vType}
            onClose={onClose}
            onBalanceUpdate={() => onRefreshUser(currentUser.uid)}
          />
        </div>
      </div>
    );
  }

  const getReferenceNumber = () => {
    if (!successResult) return null;
    if (successResult.transaction && successResult.transaction.reference) {
      return successResult.transaction.reference;
    }
    if (successResult.application && successResult.application.id) {
      return successResult.application.id;
    }
    if (successResult.verification && successResult.verification.idNumber) {
      return `SML-VER-${successResult.verification.idNumber}`;
    }
    if (successResult.id) {
      return successResult.id;
    }
    return "SML-REF-" + Math.floor(100000 + Math.random() * 900000);
  };

  const referenceNumber = successResult ? getReferenceNumber() : null;

  useEffect(() => {
    if (referenceNumber) {
      QRCode.toDataURL(
        referenceNumber,
        {
          width: 200,
          margin: 2,
          color: {
            dark: "#0f172a", // slate-900
            light: "#ffffff",
          },
        },
        (err, url) => {
          if (err) {
            console.error("QR Code generation error", err);
            return;
          }
          setQrCodeUrl(url);
        }
      );
    } else {
      setQrCodeUrl("");
    }
  }, [referenceNumber]);

  if (!service) return null;

  const handleInputChange = (fieldName: string, value: string) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
  };

  const calculateTotalCost = () => {
    if (!service.price) return 0;
    if (service.id === "edu_waec" || service.id === "edu_neco") {
      const qty = parseInt(formData["quantity"]) || 1;
      return service.price * qty;
    }
    const amt = parseFloat(formData["amount"]);
    if (!isNaN(amt)) return amt;
    return service.price;
  };

  const totalCost = calculateTotalCost();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!currentUser) {
      setError("Please sign in to your account to perform transactions.");
      return;
    }

    if (currentUser.walletBalance < totalCost) {
      setError(`Insufficient wallet balance. Total cost is ₦${totalCost.toLocaleString()}, but your balance is ₦${currentUser.walletBalance.toLocaleString()}. Please top up your wallet.`);
      return;
    }

    setLoading(true);

    try {
      let endpoint = "";
      let payload: any = { userId: currentUser.uid };

      // Route to correct API endpoint based on category
      if (service.category === "IDENTITY") {
        endpoint = "/api/verify/identity";
        payload = {
          ...payload,
          type: service.id === "id_nin_ver" ? "NIN" : "BVN",
          idNumber: formData["idNumber"] || formData["nin"] || formData["bvn"],
          fullName: formData["fullName"],
        };
      } else if (service.category === "CAC") {
        endpoint = "/api/cac/apply";
        payload = {
          ...payload,
          type: service.id === "cac_biz_name" ? "BUSINESS_NAME" : "COMPANY",
          proposedNames: [formData["proposedName1"], formData["proposedName2"]].filter(Boolean),
          businessType: formData["businessType"] || "Private Company",
          objective: formData["objective"],
          address: "No. 12 Biu Road, City Center",
          proprietors: [
            {
              name: formData["proprietorName"] || formData["directorName"],
              phone: formData["proprietorPhone"] || "+2348000000000",
              address: "Nigeria",
            },
          ],
        };
      } else if (service.category === "EDUCATION") {
        endpoint = "/api/services/education";
        payload = {
          ...payload,
          cardType: service.id === "edu_waec" ? "WAEC" : service.id === "edu_neco" ? "NECO" : "JAMB",
          quantity: parseInt(formData["quantity"]) || 1,
          amount: service.price,
        };
      } else if (service.category === "VTU") {
        endpoint = "/api/services/vtu";
        payload = {
          ...payload,
          type: service.id === "vtu_airtime" ? "AIRTIME" : "DATA",
          provider: formData["provider"],
          phoneNumber: formData["phoneNumber"],
          amount: totalCost,
          extra: formData["extra"] || "1GB SME",
        };
      } else {
        // Fallback simulation
        endpoint = "/api/services/vtu";
        payload = { ...payload, provider: "ICT Design Hub", phoneNumber: "Consultation", amount: totalCost };
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Something went wrong during transaction processing.");
      }

      setSuccessResult(data);
      onRefreshUser(currentUser.uid); // Refresh profile balance in main UI
    } catch (err: any) {
      setError(err.message || "Connection failure to NIMC/CAC API servers.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 flex flex-col my-8">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 flex justify-between items-center">
          <div>
            <h3 className="text-sm font-mono text-indigo-400 uppercase tracking-wider font-semibold">Smart Link Digital Node</h3>
            <h2 className="text-lg font-extrabold">{service.name}</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-800 transition-colors">
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          {successResult ? (
            /* Digital Receipt Area */
            <div className="space-y-6 text-left">
              <div className="text-center space-y-2">
                <div className="h-12 w-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto border border-indigo-300">
                  <Check className="h-6 w-6" />
                </div>
                <h4 className="text-lg font-bold text-slate-900">Transaction Completed</h4>
                <p className="text-xs text-slate-500">Receipt generated on {new Date().toLocaleString()}</p>
              </div>

              {/* Verified Identity Profile Sheet */}
              {successResult.verification && (
                <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 space-y-4">
                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="text-[10px] font-bold font-mono text-slate-500">NIMC-CBN JOINT VERIFIED MATCH</span>
                    <ShieldCheck className="h-4.5 w-4.5 text-indigo-500" />
                  </div>
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-4 text-center">
                      {normalizePhotoUrl(successResult.verification.photoUrl) ? (
                        <img
                          referrerPolicy="no-referrer"
                          src={normalizePhotoUrl(successResult.verification.photoUrl)}
                          alt="KYC Profile"
                          className="h-20 w-20 rounded-md border object-cover mx-auto shadow-sm"
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="h-20 w-20 rounded-md border border-slate-200 bg-slate-100 flex items-center justify-center mx-auto text-slate-400 text-xs font-bold">
                          NO PHOTO
                        </div>
                      )}
                      <span className="inline-block mt-2 px-1.5 py-0.5 rounded bg-indigo-50 text-[9px] font-bold text-indigo-600 border border-indigo-200">
                        {successResult.verification.status}
                      </span>
                    </div>
                    <div className="col-span-8 text-xs space-y-1.5 font-mono">
                      <div><span className="text-slate-500 font-sans">FULL NAME:</span> <strong className="text-slate-900">{successResult.verification.fullName}</strong></div>
                      <div><span className="text-slate-500 font-sans">ID NO ({service.id.includes("nin") ? "NIN" : "BVN"}):</span> <strong>{successResult.verification.idNumber}</strong></div>
                      <div><span className="text-slate-500 font-sans">GENDER:</span> <strong>{successResult.verification.gender}</strong></div>
                      <div><span className="text-slate-500 font-sans">DOB:</span> <strong>{successResult.verification.dob}</strong></div>
                      <div><span className="text-slate-500 font-sans">STATE/LGA:</span> <strong>{successResult.verification.stateOfOrigin} ({successResult.verification.localGov})</strong></div>
                    </div>
                  </div>
                </div>
              )}

              {/* WAEC/NECO pins output */}
              {successResult.pins && (
                <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 space-y-3 font-mono text-xs">
                  <span className="text-[10px] font-bold text-slate-500 block uppercase border-b pb-1">DELIVERED ePIN TOKENS</span>
                  {successResult.pins.map((pin: string, idx: number) => (
                    <div key={idx} className="flex justify-between items-center bg-white p-2 rounded border border-slate-100 shadow-2xs">
                      <span>{pin}</span>
                      <button onClick={() => copyToClipboard(pin)} className="text-indigo-600 hover:text-indigo-700">
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* CAC File details */}
              {successResult.application && (
                <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 space-y-2 font-mono text-xs">
                  <span className="text-[10px] font-bold text-slate-500 block uppercase border-b pb-1">CAC FILING METADATA</span>
                  <div><span className="text-slate-500 font-sans">Filing ID:</span> <strong>{successResult.application.id}</strong></div>
                  <div><span className="text-slate-500 font-sans">Proposed Name Choice 1:</span> <strong>{successResult.application.proposedNames[0]}</strong></div>
                  <div><span className="text-slate-500 font-sans">Corporate Status:</span> <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 font-bold border border-amber-200">PENDING_REVIEW</span></div>
                  <p className="text-[11px] font-sans text-slate-500 mt-2">Our corporate compliance staff are reviewing your filing documents. Approvals are typically generated under 72 hours.</p>
                </div>
              )}

              {/* VTU transaction details */}
              {successResult.transaction && (
                <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 space-y-2 font-mono text-xs">
                  <span className="text-[10px] font-bold text-slate-500 block uppercase border-b pb-1">TELECOM VTU RECEIPT</span>
                  <div><span className="text-slate-500 font-sans">Reference:</span> <strong>{successResult.transaction.reference}</strong></div>
                  <div><span className="text-slate-500 font-sans">Description:</span> <strong>{successResult.transaction.description}</strong></div>
                  <div><span className="text-slate-500 font-sans">Filing Fee / Cost:</span> <strong className="text-indigo-600">₦{successResult.transaction.amount.toLocaleString()}</strong></div>
                  <div><span className="text-slate-500 font-sans">Status:</span> <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">SUCCESS</span></div>
                </div>
              )}

              {/* QR Verification Card */}
              {qrCodeUrl && (
                <div className="border border-indigo-100 dark:border-slate-800 rounded-lg p-4 bg-indigo-50/30 dark:bg-slate-900/40 text-center space-y-3">
                  <div className="flex items-center justify-between border-b border-indigo-100/50 dark:border-slate-800 pb-2">
                    <span className="text-[10px] font-bold font-mono text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 uppercase">
                      <QrCode className="h-4 w-4" />
                      Secure Digital Verification QR
                    </span>
                    <span className="text-[10px] font-bold font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded border border-emerald-100 dark:border-emerald-900/30 uppercase">
                      Gate Verified
                    </span>
                  </div>

                  <div className="keep-white-bg p-3 rounded-lg border border-indigo-100 inline-block shadow-xs">
                    <img
                      src={qrCodeUrl}
                      alt="Transaction Verification QR"
                      className="h-32 w-32 object-contain mx-auto"
                    />
                  </div>

                  <div className="space-y-1">
                    <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Verification Reference</p>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 font-mono select-all">{referenceNumber}</p>
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
                    Scan this QR code with any mobile scanner to instantly verify the authenticity of this transaction on the Smart Link API Gateway.
                  </p>

                  <div className="pt-1 flex justify-center gap-2">
                    <a
                      href={qrCodeUrl}
                      download={`verification-qr-${referenceNumber}.png`}
                      className="inline-flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-bold keep-white-bg dark:bg-slate-800 px-2.5 py-1.5 rounded border border-indigo-100 dark:border-slate-700 shadow-3xs hover:bg-indigo-50 dark:hover:bg-slate-750 transition-colors cursor-pointer"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download QR Code
                    </a>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 justify-end pt-4 border-t">
                <button
                  onClick={() => {
                    window.print();
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-bold text-xs flex items-center gap-1.5"
                >
                  <Printer className="h-4 w-4" />
                  Print Receipt
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded font-bold text-xs"
                >
                  Close Panel
                </button>
              </div>
            </div>
          ) : (
            /* Service Entry Form */
            <form onSubmit={handleSubmit} className="space-y-5 text-left">
              {!currentUser && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-lg flex items-start gap-2.5 text-xs text-blue-800 dark:text-blue-300">
                  <AlertTriangle className="h-4.5 w-4.5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Account Sign In Required</strong>
                    <p className="mt-1 font-light leading-relaxed">
                      You are not logged in. To buy scratch cards, purchase data/airtime, or perform identity verifications, please sign in or register an account.
                    </p>
                  </div>
                </div>
              )}

              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs font-medium">
                  {error}
                </div>
              )}

              {/* Dynamic Form Fields */}
              <div className="space-y-4">
                {service.fields.map((f) => {
                  const uniqueFieldId = `field-${service.id}-${f.name}`;
                  return (
                    <div key={f.name} className="space-y-1.5">
                      <label htmlFor={uniqueFieldId} className="text-xs font-bold text-slate-700 flex justify-between">
                        {f.label}
                        {f.required && <span className="text-rose-500">* Required</span>}
                      </label>

                      {f.type === "select" ? (
                        <select
                          id={uniqueFieldId}
                          value={formData[f.name] || ""}
                          onChange={(e) => handleInputChange(f.name, e.target.value)}
                          required={f.required}
                          className="w-full px-3 py-2 rounded border border-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                        >
                          <option value="">{f.placeholder}</option>
                          {f.options?.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : f.type === "textarea" ? (
                        <textarea
                          id={uniqueFieldId}
                          value={formData[f.name] || ""}
                          onChange={(e) => handleInputChange(f.name, e.target.value)}
                          placeholder={f.placeholder}
                          required={f.required}
                          rows={3}
                          className="w-full px-3 py-2 rounded border border-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                        />
                      ) : (
                        <input
                          type={f.type}
                          id={uniqueFieldId}
                          value={formData[f.name] || ""}
                          onChange={(e) => handleInputChange(f.name, e.target.value)}
                          placeholder={f.placeholder}
                          required={f.required}
                          className="w-full px-3 py-2 rounded border border-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Order summary panel */}
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-mono">Platform Service Fee</span>
                  <span className="font-semibold text-slate-800">
                    {service.price ? `₦${service.price.toLocaleString()}` : "Provider Plan Cost"}
                  </span>
                </div>

                {(service.id === "edu_waec" || service.id === "edu_neco") && (
                  <div className="flex justify-between items-center text-xs border-t pt-1">
                    <span className="text-slate-500 font-mono">Quantity Requested</span>
                    <span className="font-semibold text-slate-800">x{formData["quantity"] || 1}</span>
                  </div>
                )}

                <div className="flex justify-between items-center text-sm font-bold border-t pt-2 text-slate-900">
                  <span>Grand Total (Naira)</span>
                  <span className="text-indigo-600 font-mono">₦{totalCost.toLocaleString()}</span>
                </div>

                {currentUser && (
                  <div className="flex justify-between items-center text-[11px] border-t pt-1 text-slate-500">
                    <span>Your Current Wallet Balance</span>
                    <span className={currentUser.walletBalance < totalCost ? "text-rose-500 font-bold" : "text-indigo-600 font-bold"}>
                      ₦{currentUser.walletBalance.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Submit / Cancel Actions */}
              <div className="flex gap-3 justify-end pt-4 border-t">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded text-xs font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="btn-confirm-transaction"
                  disabled={loading}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold rounded text-xs transition-colors flex items-center gap-1 shadow-md shadow-indigo-500/10 active:scale-95"
                >
                  {loading ? (
                    <>
                      <SmartLinkLogoMark size="xs" color="#FFFFFF" animating={true} />
                      Validating Secure Node...
                    </>
                  ) : (
                    "Authorize Transaction"
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
