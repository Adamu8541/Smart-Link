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
import { NinDemographyView } from "./verification/NinDemographyView";
import { NinPhoneVerificationView } from "./verification/NinPhoneVerificationView";
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

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    document.documentElement.scrollTop = 0;
  }, [service?.id]);

  if (!service) return null;

  if ((service.id === "wallet_funding" || service.id === "fund_wallet") && currentUser) {
    return (
      <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-4 sm:pt-8 pb-12 bg-[#111827]/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
        <div className="w-full max-w-4xl mb-8">
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
      <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-4 sm:pt-8 pb-12 bg-[#111827]/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
        <div className="w-full max-w-4xl mb-8">
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
    if (
      service.id === "id_nin_phone" ||
      service.id.includes("nin_phone") ||
      service.name.toLowerCase().includes("nin with phone")
    ) {
      return (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-4 sm:pt-8 pb-12 bg-[#111827]/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
          <div className="w-full max-w-xl mb-8">
            <NinPhoneVerificationView
              userId={currentUser.uid}
              userEmail={currentUser.email}
              serviceTitle={service.name}
              onBackToDashboard={onClose}
              onBalanceUpdate={() => onRefreshUser(currentUser.uid)}
            />
          </div>
        </div>
      );
    }
    if (service.id.includes("demography") || service.name.toLowerCase().includes("demography")) {
      return (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-4 sm:pt-8 pb-12 bg-[#111827]/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
          <div className="w-full max-w-xl mb-8">
            <NinDemographyView
              userId={currentUser.uid}
              userEmail={currentUser.email}
              onBackToDashboard={onClose}
              onBalanceUpdate={() => onRefreshUser(currentUser.uid)}
            />
          </div>
        </div>
      );
    }
    const vType = getVerificationType(service.id);
    if (vType === "NIN") {
      return (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-4 sm:pt-8 pb-12 bg-[#111827]/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
          <div className="w-full max-w-xl mb-8">
            <NinVerificationView
              userId={currentUser.uid}
              userEmail={currentUser.email}
              serviceTitle={service.name}
              serviceId={service.id}
              onBackToDashboard={onClose}
              onBalanceUpdate={() => onRefreshUser(currentUser.uid)}
            />
          </div>
        </div>
      );
    }
    if (vType === "BVN") {
      return (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-4 sm:pt-8 pb-12 bg-[#111827]/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
          <div className="w-full max-w-5xl mb-8">
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
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-4 sm:pt-8 pb-12 bg-[#111827]/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
          <div className="w-full max-w-3xl mb-8">
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
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-4 sm:pt-8 pb-12 bg-[#111827]/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
          <div className="w-full max-w-3xl mb-8">
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
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-4 sm:pt-8 pb-12 bg-[#111827]/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
          <div className="w-full max-w-3xl mb-8">
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
      <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-4 sm:pt-8 pb-12 bg-[#111827]/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
        <div className="w-full max-w-2xl mb-8">
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
            dark: "#0F2D5C", // slate-900
            light: "#0F2D5C",
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
      setError(err.message || "Connection failure to third-party verification servers.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  return (
    <div className="fixed inset-0 bg-[#111827]/60 backdrop-blur-xs flex items-start justify-center p-4 pt-4 sm:pt-8 pb-12 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-[#E5E7EB] flex flex-col mb-8">
        {/* Modal Header */}
        <div className="bg-[#111827] text-white p-5 flex justify-between items-center">
          <div>
            <h3 className="text-sm font-mono text-[#9CA3AF] uppercase tracking-wider font-semibold">Smart Link Digital Node</h3>
            <h2 className="text-lg font-extrabold">{service.name}</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-[#111827] transition-colors">
            <X className="h-5 w-5 text-[#9CA3AF]" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          {successResult ? (
            /* Digital Receipt Area */
            <div className="space-y-6 text-left">
              <div className="text-center space-y-2">
                <div className="h-12 w-12 rounded-full bg-[#E5E7EB] text-[#0F2D5C] flex items-center justify-center mx-auto border border-[#E5E7EB]">
                  <Check className="h-6 w-6" />
                </div>
                <h4 className="text-lg font-bold text-[#111827]">Transaction Completed</h4>
                <p className="text-xs text-[#6B7280]">Receipt generated on {new Date().toLocaleString()}</p>
              </div>

              {/* Verified Identity Profile Sheet */}
              {successResult.verification && (
                <div className="border border-[#E5E7EB] rounded-lg p-4 bg-[#F5F7FA] space-y-4">
                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="text-[10px] font-bold font-mono text-[#6B7280]">THIRD-PARTY VERIFIED MATCH</span>
                    <ShieldCheck className="h-4.5 w-4.5 text-[#0F2D5C]" />
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
                        <div className="h-20 w-20 rounded-md border border-[#E5E7EB] bg-[#E5E7EB] flex items-center justify-center mx-auto text-[#9CA3AF] text-xs font-bold">
                          NO PHOTO
                        </div>
                      )}
                      <span className="inline-block mt-2 px-1.5 py-0.5 rounded bg-[#F5F7FA] text-[9px] font-bold text-[#0F2D5C] border border-[#E5E7EB]">
                        {successResult.verification.status}
                      </span>
                    </div>
                    <div className="col-span-8 text-xs space-y-1.5 font-mono">
                      <div><span className="text-[#6B7280] font-sans">FULL NAME:</span> <strong className="text-[#111827]">{successResult.verification.fullName}</strong></div>
                      <div><span className="text-[#6B7280] font-sans">ID NO ({service.id.includes("nin") ? "NIN" : "BVN"}):</span> <strong>{successResult.verification.idNumber}</strong></div>
                      <div><span className="text-[#6B7280] font-sans">GENDER:</span> <strong>{successResult.verification.gender}</strong></div>
                      <div><span className="text-[#6B7280] font-sans">DOB:</span> <strong>{successResult.verification.dob}</strong></div>
                      <div><span className="text-[#6B7280] font-sans">STATE/LGA:</span> <strong>{successResult.verification.stateOfOrigin} ({successResult.verification.localGov})</strong></div>
                    </div>
                  </div>
                </div>
              )}

              {/* WAEC/NECO pins output */}
              {successResult.pins && (
                <div className="border border-[#E5E7EB] rounded-lg p-4 bg-[#F5F7FA] space-y-3 font-mono text-xs">
                  <span className="text-[10px] font-bold text-[#6B7280] block uppercase border-b pb-1">DELIVERED ePIN TOKENS</span>
                  {successResult.pins.map((pin: string, idx: number) => (
                    <div key={idx} className="flex justify-between items-center bg-white p-2 rounded border border-[#E5E7EB] shadow-2xs">
                      <span>{pin}</span>
                      <button onClick={() => copyToClipboard(pin)} className="text-[#0F2D5C] hover:text-[#0F2D5C]">
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* CAC File details */}
              {successResult.application && (
                <div className="border border-[#E5E7EB] rounded-lg p-4 bg-[#F5F7FA] space-y-2 font-mono text-xs">
                  <span className="text-[10px] font-bold text-[#6B7280] block uppercase border-b pb-1">CAC FILING METADATA</span>
                  <div><span className="text-[#6B7280] font-sans">Filing ID:</span> <strong>{successResult.application.id}</strong></div>
                  <div><span className="text-[#6B7280] font-sans">Proposed Name Choice 1:</span> <strong>{successResult.application.proposedNames[0]}</strong></div>
                  <div><span className="text-[#6B7280] font-sans">Corporate Status:</span> <span className="px-1.5 py-0.5 rounded bg-[#F5F7FA] text-[#0F2D5C] font-bold border border-[#E5E7EB]">PENDING_REVIEW</span></div>
                  <p className="text-[11px] font-sans text-[#6B7280] mt-2">Our corporate compliance staff are reviewing your filing documents. Approvals are typically generated under 72 hours.</p>
                </div>
              )}

              {/* VTU transaction details */}
              {successResult.transaction && (
                <div className="border border-[#E5E7EB] rounded-lg p-4 bg-[#F5F7FA] space-y-2 font-mono text-xs">
                  <span className="text-[10px] font-bold text-[#6B7280] block uppercase border-b pb-1">TELECOM VTU RECEIPT</span>
                  <div><span className="text-[#6B7280] font-sans">Reference:</span> <strong>{successResult.transaction.reference}</strong></div>
                  <div><span className="text-[#6B7280] font-sans">Description:</span> <strong>{successResult.transaction.description}</strong></div>
                  <div><span className="text-[#6B7280] font-sans">Filing Fee / Cost:</span> <strong className="text-[#0F2D5C]">₦{successResult.transaction.amount.toLocaleString()}</strong></div>
                  <div><span className="text-[#6B7280] font-sans">Status:</span> <span className="px-1.5 py-0.5 rounded bg-[#F5F7FA] text-[#0F2D5C] border border-[#E5E7EB]">SUCCESS</span></div>
                </div>
              )}

              {/* QR Verification Card */}
              {qrCodeUrl && (
                <div className="border border-[#E5E7EB] dark:border-[#111827] rounded-lg p-4 bg-[#F5F7FA]/30 dark:bg-[#111827]/40 text-center space-y-3">
                  <div className="flex items-center justify-between border-b border-[#E5E7EB]/50 dark:border-[#111827] pb-2">
                    <span className="text-[10px] font-bold font-mono text-[#0F2D5C] dark:text-[#9CA3AF] flex items-center gap-1.5 uppercase">
                      <QrCode className="h-4 w-4" />
                      Secure Digital Verification QR
                    </span>
                    <span className="text-[10px] font-bold font-mono text-[#0F2D5C] dark:text-[#9CA3AF] bg-[#F5F7FA] dark:bg-[#0F2D5C]/30 px-1.5 py-0.5 rounded border border-[#E5E7EB] dark:border-[#0F2D5C]/30 uppercase">
                      Gate Verified
                    </span>
                  </div>

                  <div className="keep-white-bg p-3 rounded-lg border border-[#E5E7EB] inline-block shadow-xs">
                    <img
                      src={qrCodeUrl}
                      alt="Transaction Verification QR"
                      className="h-32 w-32 object-contain mx-auto"
                    />
                  </div>

                  <div className="space-y-1">
                    <p className="text-[10px] font-mono text-[#6B7280] uppercase tracking-wider">Verification Reference</p>
                    <p className="text-xs font-bold text-[#111827] dark:text-[#E5E7EB] font-mono select-all">{referenceNumber}</p>
                  </div>

                  <p className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF] leading-relaxed max-w-xs mx-auto">
                    Scan this QR code with any mobile scanner to instantly verify the authenticity of this transaction on the Smart Link API Gateway.
                  </p>

                  <div className="pt-1 flex justify-center gap-2">
                    <a
                      href={qrCodeUrl}
                      download={`verification-qr-${referenceNumber}.png`}
                      className="inline-flex items-center gap-1 text-[11px] text-[#0F2D5C] dark:text-[#9CA3AF] hover:text-[#0F2D5C] dark:hover:text-[#9CA3AF] font-bold bg-[#FFFFFF] dark:bg-[#111827] px-2.5 py-1.5 rounded border border-[#E5E7EB] dark:border-[#4B5563] shadow-3xs hover:bg-[#F5F7FA] dark:hover:bg-[#4B5563] transition-colors cursor-pointer"
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
                  className="px-4 py-2 bg-[#E5E7EB] hover:bg-[#E5E7EB] text-[#111827] rounded font-bold text-xs flex items-center gap-1.5"
                >
                  <Printer className="h-4 w-4" />
                  Print Receipt
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-[#111827] hover:bg-[#111827] text-white rounded font-bold text-xs"
                >
                  Close Panel
                </button>
              </div>
            </div>
          ) : (
            /* Service Entry Form */
            <form onSubmit={handleSubmit} className="space-y-5 text-left">
              {!currentUser && (
                <div className="p-3 bg-[#F5F7FA] dark:bg-[#0F2D5C]/40 border border-[#E5E7EB] dark:border-[#0F2D5C] rounded-lg flex items-start gap-2.5 text-xs text-[#0F2D5C] dark:text-[#9CA3AF]">
                  <AlertTriangle className="h-4.5 w-4.5 text-[#0F2D5C] shrink-0 mt-0.5" />
                  <div>
                    <strong>Account Sign In Required</strong>
                    <p className="mt-1 font-light leading-relaxed">
                      You are not logged in. To buy scratch cards, purchase data/airtime, or perform identity verifications, please sign in or register an account.
                    </p>
                  </div>
                </div>
              )}

              {error && (
                <div className="p-3 bg-[#F5F7FA] border border-[#E5E7EB] rounded-lg text-[#0F2D5C] text-xs font-medium">
                  {error}
                </div>
              )}

              {/* Dynamic Form Fields */}
              <div className="space-y-4">
                {service.fields.map((f) => {
                  const uniqueFieldId = `field-${service.id}-${f.name}`;
                  return (
                    <div key={f.name} className="space-y-1.5">
                      <label htmlFor={uniqueFieldId} className="text-xs font-bold text-[#4B5563] flex justify-between">
                        {f.label}
                        {f.required && <span className="text-[#0F2D5C]">* Required</span>}
                      </label>

                      {f.type === "select" ? (
                        <select
                          id={uniqueFieldId}
                          value={formData[f.name] || ""}
                          onChange={(e) => handleInputChange(f.name, e.target.value)}
                          required={f.required}
                          className="w-full px-3 py-2 rounded border border-[#E5E7EB] text-sm focus:outline-none focus:ring-1 focus:ring-[#0F2D5C] focus:border-[#0F2D5C] bg-white"
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
                          className="w-full px-3 py-2 rounded border border-[#E5E7EB] text-sm focus:outline-none focus:ring-1 focus:ring-[#0F2D5C] focus:border-[#0F2D5C] bg-white"
                        />
                      ) : (
                        <input
                          type={f.type}
                          id={uniqueFieldId}
                          value={formData[f.name] || ""}
                          onChange={(e) => handleInputChange(f.name, e.target.value)}
                          placeholder={f.placeholder}
                          required={f.required}
                          className="w-full px-3 py-2 rounded border border-[#E5E7EB] text-sm focus:outline-none focus:ring-1 focus:ring-[#0F2D5C] focus:border-[#0F2D5C] bg-white"
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Order summary panel */}
              <div className="bg-[#F5F7FA] rounded-lg p-4 border border-[#E5E7EB] space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#6B7280] font-mono">Platform Service Fee</span>
                  <span className="font-semibold text-[#111827]">
                    {service.price ? `₦${service.price.toLocaleString()}` : "Provider Plan Cost"}
                  </span>
                </div>

                {(service.id === "edu_waec" || service.id === "edu_neco") && (
                  <div className="flex justify-between items-center text-xs border-t pt-1">
                    <span className="text-[#6B7280] font-mono">Quantity Requested</span>
                    <span className="font-semibold text-[#111827]">x{formData["quantity"] || 1}</span>
                  </div>
                )}

                <div className="flex justify-between items-center text-sm font-bold border-t pt-2 text-[#111827]">
                  <span>Grand Total (Naira)</span>
                  <span className="text-[#0F2D5C] font-mono">₦{totalCost.toLocaleString()}</span>
                </div>

                {currentUser && (
                  <div className="flex justify-between items-center text-[11px] border-t pt-1 text-[#6B7280]">
                    <span>Your Current Wallet Balance</span>
                    <span className={currentUser.walletBalance < totalCost ? "text-[#0F2D5C] font-bold" : "text-[#0F2D5C] font-bold"}>
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
                  className="px-4 py-2 border border-[#E5E7EB] text-[#4B5563] rounded text-xs font-semibold hover:bg-[#F5F7FA] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="btn-confirm-transaction"
                  disabled={loading}
                  className="px-6 py-2 bg-[#0F2D5C] hover:bg-[#0F2D5C] disabled:bg-[#E5E7EB] text-white font-bold rounded text-xs transition-colors flex items-center gap-1 shadow-md shadow-none active:scale-95"
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
