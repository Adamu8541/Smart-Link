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
import { BvnDemographyView } from "./verification/BvnDemographyView";
import { BvnPhoneVerificationView } from "./verification/BvnPhoneVerificationView";
import { CacVerificationView } from "./verification/CacVerificationView";
import { TinVerificationView } from "./verification/TinVerificationView";
import { BankAccountVerificationView } from "./verification/BankAccountVerificationView";
import { WalletFundingView } from "./wallet/WalletFundingView";
import { BillPaymentView } from "./bills/BillPaymentView";
import { BillCategoryType } from "../types/bills";
import { VerificationType } from "../types/verification";
import { normalizePhotoUrl } from "../services/slipOptionsConfig";
import { formatNaira, formatSafeDateTime } from "../utils/formatUtils";
import { ManualServiceFormView } from "./common/ManualServiceFormView";
import { getManualServiceConfig, isManualService } from "../data/manualServicesConfig";
import { getAuthHeaders } from "../services/providerService";

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

  const referenceNumber = successResult
    ? successResult.transaction?.reference ||
      successResult.application?.id ||
      (successResult.verification?.idNumber ? `SML-VER-${successResult.verification.idNumber}` : null) ||
      successResult.id ||
      "SML-REF-" + Math.floor(100000 + Math.random() * 900000)
    : null;

  useEffect(() => {
    if (referenceNumber) {
      QRCode.toDataURL(
        referenceNumber,
        {
          width: 200,
          margin: 2,
          color: {
            dark:"#0F2D5C",
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

  const renderModalContainer = (content: React.ReactNode, maxWidth = "max-w-xl") => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-[#111827]/70 backdrop-blur-xs animate-fade-in overflow-hidden">
      <div className={`w-full ${maxWidth} max-h-[82dvh] sm:max-h-[86vh] flex flex-col overflow-hidden rounded-2xl sm:rounded-3xl bg-white shadow-2xl border border-slate-200`}>
        <div className="overflow-y-auto flex-1 w-full">
          {content}
        </div>
      </div>
    </div>
  );

  if ((service.id === "wallet_funding" || service.id === "fund_wallet") && currentUser) {
    return renderModalContainer(
      <WalletFundingView
        currentUser={currentUser}
        onBackToDashboard={onClose}
        onBalanceUpdate={() => onRefreshUser(currentUser.uid)}
      />,
      "max-w-4xl"
    );
  }

  // Intercept Manual Services (CAC Registrations, TIN Registration, NIN/BVN Modifications, Passport, ICT development)
  const manualServiceConfig = getManualServiceConfig(service.id);
  if (manualServiceConfig && currentUser) {
    return renderModalContainer(
      <ManualServiceFormView
        serviceConfig={manualServiceConfig}
        currentUser={currentUser}
        onClose={onClose}
        onBalanceUpdate={() => onRefreshUser(currentUser.uid)}
      />,
      "max-w-3xl"
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
    service.id.includes("nabteb") ||
    service.id.includes("exam") ||
    service.id.includes("internet");

  const getBillCategory = (svcId: string): BillCategoryType => {
    if (svcId.includes("airtime")) return "AIRTIME";
    if (svcId.includes("data")) return "DATA";
    if (svcId.includes("electricity") || svcId.includes("power")) return "ELECTRICITY";
    if (svcId.includes("cable") || svcId.includes("dstv") || svcId.includes("gotv")) return "CABLE_TV";
    if (svcId.includes("internet") || svcId.includes("wifi")) return "INTERNET";
    if (svcId.includes("waec") || svcId.includes("neco") || svcId.includes("jamb") || svcId.includes("nabteb") || svcId.includes("exam")) return "EDUCATION";
    if (svcId.includes("betting") || svcId.includes("bet")) return "BETTING";
    if (svcId.includes("water")) return "WATER";
    if (svcId.includes("waste") || svcId.includes("lawma")) return "WASTE";
    if (svcId.includes("tax") || svcId.includes("levy") || svcId.includes("govt")) return "GOVERNMENT";
    return "AIRTIME";
  };

  const getBillProviderCode = (svcId: string): string | undefined => {
    if (svcId.includes("waec")) return "WAEC";
    if (svcId.includes("neco")) return "NECO";
    if (svcId.includes("jamb")) return "JAMB";
    if (svcId.includes("nabteb")) return "NABTEB";
    return undefined;
  };

  if (isBillPaymentService && currentUser) {
    const initialCategory = getBillCategory(service.id);
    const initialProviderCode = getBillProviderCode(service.id);
    return renderModalContainer(
      <BillPaymentView
        currentUser={currentUser}
        initialCategory={initialCategory}
        initialProviderCode={initialProviderCode}
        onBackToDashboard={onClose}
        onBalanceUpdate={() => onRefreshUser(currentUser.uid)}
      />,
      "max-w-4xl"
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
    // 1. BVN Phone Verification
    if (
      service.id === "id_bvn_phone" ||
      (service.id.includes("bvn") && service.id.includes("phone")) ||
      (service.name.toLowerCase().includes("bvn") && service.name.toLowerCase().includes("phone"))
    ) {
      return renderModalContainer(
        <BvnPhoneVerificationView
          userId={currentUser.uid}
          userEmail={currentUser.email}
          serviceTitle={service.name}
          onBackToDashboard={onClose}
          onBalanceUpdate={() => onRefreshUser(currentUser.uid)}
        />,
        "max-w-xl"
      );
    }

    // 2. NIN Phone Verification
    if (
      service.id === "id_nin_phone" ||
      service.id.includes("nin_phone") ||
      service.name.toLowerCase().includes("nin with phone") ||
      (service.name.toLowerCase().includes("nin") && service.name.toLowerCase().includes("phone"))
    ) {
      return renderModalContainer(
        <NinPhoneVerificationView
          userId={currentUser.uid}
          userEmail={currentUser.email}
          serviceTitle={service.name}
          onBackToDashboard={onClose}
          onBalanceUpdate={() => onRefreshUser(currentUser.uid)}
        />,
        "max-w-xl"
      );
    }

    // 3. BVN Demographic Verification (Name & DOB)
    if (
      service.id === "id_bvn_demography" ||
      (service.id.includes("bvn") && (service.id.includes("demography") || service.name.toLowerCase().includes("demography") || service.name.toLowerCase().includes("dob") || service.name.toLowerCase().includes("name & dob"))) ||
      (service.name.toLowerCase().includes("bvn") && (service.name.toLowerCase().includes("demography") || service.name.toLowerCase().includes("name & dob") || service.name.toLowerCase().includes("dob")))
    ) {
      return renderModalContainer(
        <BvnDemographyView
          userId={currentUser.uid}
          userEmail={currentUser.email}
          serviceTitle={service.name}
          onBackToDashboard={onClose}
          onBalanceUpdate={() => onRefreshUser(currentUser.uid)}
        />,
        "max-w-xl"
      );
    }

    // 4. NIN Demographic Verification
    if (service.id.includes("demography") || service.name.toLowerCase().includes("demography") || service.name.toLowerCase().includes("name & dob")) {
      return renderModalContainer(
        <NinDemographyView
          userId={currentUser.uid}
          userEmail={currentUser.email}
          onBackToDashboard={onClose}
          onBalanceUpdate={() => onRefreshUser(currentUser.uid)}
        />,
        "max-w-xl"
      );
    }

    // 5. BVN Slip & ID Card Generation or other BVN services
    if (
      service.id === "id_premium_slip" ||
      service.id === "id_bvn_ver" ||
      service.id.includes("bvn") ||
      service.name.toLowerCase().includes("bvn")
    ) {
      return renderModalContainer(
        <BvnVerificationView
          userId={currentUser.uid}
          userEmail={currentUser.email}
          serviceTitle={service.name}
          onBackToDashboard={onClose}
          onBalanceUpdate={() => onRefreshUser(currentUser.uid)}
        />,
        "max-w-xl"
      );
    }

    const vType = getVerificationType(service.id);
    if (vType === "NIN") {
      return renderModalContainer(
        <NinVerificationView
          userId={currentUser.uid}
          userEmail={currentUser.email}
          serviceTitle={service.name}
          serviceId={service.id}
          onBackToDashboard={onClose}
          onBalanceUpdate={() => onRefreshUser(currentUser.uid)}
        />,
        "max-w-xl"
      );
    }
    if (vType === "BVN") {
      return renderModalContainer(
        <BvnVerificationView
          userId={currentUser.uid}
          userEmail={currentUser.email}
          onBackToDashboard={onClose}
          onBalanceUpdate={() => onRefreshUser(currentUser.uid)}
        />,
        "max-w-xl"
      );
    }
    if (vType === "CAC") {
      return renderModalContainer(
        <CacVerificationView
          userId={currentUser.uid}
          userEmail={currentUser.email}
          onBackToDashboard={onClose}
          onBalanceUpdate={() => onRefreshUser(currentUser.uid)}
        />,
        "max-w-xl"
      );
    }
    if (vType === "TIN") {
      return renderModalContainer(
        <TinVerificationView
          userId={currentUser.uid}
          userEmail={currentUser.email}
          onBackToDashboard={onClose}
          onBalanceUpdate={() => onRefreshUser(currentUser.uid)}
        />,
        "max-w-xl"
      );
    }
    if (vType === "BANK_ACCOUNT") {
      return renderModalContainer(
        <BankAccountVerificationView
          userId={currentUser.uid}
          userEmail={currentUser.email}
          onBackToDashboard={onClose}
          onBalanceUpdate={() => onRefreshUser(currentUser.uid)}
        />,
        "max-w-xl"
      );
    }
    return renderModalContainer(
      <VerificationEngine
        userId={currentUser.uid}
        userEmail={currentUser.email}
        initialServiceType={vType}
        onClose={onClose}
        onBalanceUpdate={() => onRefreshUser(currentUser.uid)}
      />,
      "max-w-xl"
    );
  }

  const handleInputChange = (fieldName: string, value: string) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
  };

  const calculateTotalCost = () => {
    if (!service.price) return 0;
    if (service.id.startsWith("edu_") || service.category === "EDUCATION") {
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

    if ((currentUser.walletBalance ?? 0) < totalCost) {
      setError(`Insufficient wallet balance. Total cost is ${formatNaira(totalCost)}, but your balance is ${formatNaira(currentUser.walletBalance)}. Please top up your wallet.`);
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
        const examCode = service.id === "edu_waec" ? "WAEC" : service.id === "edu_neco" ? "NECO" : service.id === "edu_nabteb" ? "NABTEB" : "JAMB";
        payload = {
          ...payload,
          cardType: examCode,
          quantity: parseInt(formData["quantity"]) || 1,
          amount: service.price,
          profileCode: formData["profileCode"] || formData["examNumber"] || formData["phoneNumber"],
          phoneNumber: formData["phoneNumber"] || currentUser?.phoneNumber,
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

      const authHeaders = await getAuthHeaders(currentUser.uid);
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
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
    <div className="fixed inset-0 bg-[#111827]/70 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 z-50 overflow-hidden animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-[#E5E7EB] flex flex-col max-h-[82dvh] sm:max-h-[86vh]">
        {/* Modal Header */}
        <div className="bg-[#0F2D5C] text-white px-3.5 py-2.5 sm:px-5 sm:py-3 flex justify-between items-center shrink-0">
          <div>
            <h3 className="text-[10px] font-mono text-slate-300 uppercase tracking-wider font-semibold">Smart Link Services</h3>
            <h2 className="text-sm sm:text-base font-bold text-white truncate max-w-[240px] sm:max-w-xs">{service.name}</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-3.5 sm:p-5 overflow-y-auto flex-1">
          {successResult ? (
            /* Digital Receipt Area */
            <div className="space-y-4 text-left">
              <div className="text-center space-y-1.5">
                <div className="h-10 w-10 rounded-full bg-[#E5E7EB] text-[#0F2D5C] flex items-center justify-center mx-auto border border-[#E5E7EB]">
                  <Check className="h-5 w-5" />
                </div>
                <h4 className="text-base font-bold text-[#111827]">Transaction Completed</h4>
                <p className="text-[11px] text-[#6B7280]">Receipt generated on {formatSafeDateTime(new Date(), "Recently")}</p>
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
                      <button onClick={() => copyToClipboard(pin)} > <Copy className="bg-[#0F2D5C] hover:bg-[#17407E] active:bg-[#0A1E3F] text-white h-3.5 w-3.5" />
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
                  <div><span className="text-[#6B7280] font-sans">Filing Fee / Cost:</span> <strong className="text-[#0F2D5C]">{formatNaira(successResult.transaction.amount)}</strong></div>
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
                    Scan this QR code with any mobile scanner to instantly verify the authenticity of this transaction on the Smart Link API Portal.
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
                  className="bg-[#0F2D5C] hover:bg-[#17407E] active:bg-[#0A1E3F] text-white px-4 py-2 rounded font-bold text-xs flex items-center gap-1.5"
                >
                  <Printer className="h-4 w-4" />
                  Print Receipt
                </button>
                <button
                  onClick={onClose}
                  className="bg-[#0F2D5C] hover:bg-[#17407E] active:bg-[#0A1E3F] text-white px-4 py-2 rounded font-bold text-xs"
                >
                  Close Panel
                </button>
              </div>
            </div>
          ) : (
            /* Service Entry Form */
            <form onSubmit={handleSubmit} autoComplete="off" className="space-y-3 sm:space-y-4 text-left">
              {!currentUser && (
                <div className="p-2.5 bg-[#F5F7FA] dark:bg-[#0F2D5C]/40 border border-[#E5E7EB] dark:border-[#0F2D5C] rounded-xl flex items-start gap-2 text-xs text-[#0F2D5C] dark:text-[#9CA3AF]">
                  <AlertTriangle className="h-4 w-4 text-[#0F2D5C] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-[11px] sm:text-xs">Account Sign In Required</strong>
                    <p className="mt-0.5 font-light leading-snug text-[10.5px] sm:text-[11px]">
                      You are not logged in. To buy scratch cards, purchase data/airtime, or perform identity verifications, please sign in or register an account.
                    </p>
                  </div>
                </div>
              )}

              {error && (
                <div className="p-2.5 bg-[#F5F7FA] border border-[#E5E7EB] rounded-xl text-[#0F2D5C] text-xs font-medium">
                  {error}
                </div>
              )}

              {/* Dynamic Form Fields */}
              <div className="space-y-2.5 sm:space-y-3">
                {service.fields.map((f) => {
                  const uniqueFieldId = `field-${service.id}-${f.name}`;
                  const isTaxOrCacService =
                    service.id.startsWith("cac_") ||
                    service.id.startsWith("tax_") ||
                    service.id === "id_tax_id_search" ||
                    service.id === "id_cac_registration";

                  return (
                    <div key={f.name} className="space-y-1">
                      <label htmlFor={uniqueFieldId} className="text-[11px] sm:text-xs font-semibold text-[#4B5563] flex justify-between">
                        {f.label}
                        {f.required && <span className="text-[#0F2D5C] text-[10px]">* Required</span>}
                      </label>

                      {f.type === "select" ? (
                        <select
                          id={uniqueFieldId}
                          value={formData[f.name] || ""}
                          onChange={(e) => handleInputChange(f.name, e.target.value)}
                          required={f.required}
                          className="w-full px-2.5 py-1.5 sm:py-2 rounded-lg border border-[#E5E7EB] text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-[#0F2D5C] focus:border-[#0F2D5C] bg-white"
                        >
                          <option value="">{isTaxOrCacService ? "-- Select --" : f.placeholder}</option>
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
                          placeholder={isTaxOrCacService ? undefined : f.placeholder}
                          autoComplete="off"
                          required={f.required}
                          rows={2}
                          className="w-full px-2.5 py-1.5 sm:py-2 rounded-lg border border-[#E5E7EB] text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-[#0F2D5C] focus:border-[#0F2D5C] bg-white"
                        />
                      ) : (
                        <input
                          type={f.type}
                          id={uniqueFieldId}
                          value={formData[f.name] || ""}
                          onChange={(e) => handleInputChange(f.name, e.target.value)}
                          placeholder={isTaxOrCacService ? undefined : f.placeholder}
                          autoComplete="off"
                          required={f.required}
                          className="w-full px-2.5 py-1.5 sm:py-2 rounded-lg border border-[#E5E7EB] text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-[#0F2D5C] focus:border-[#0F2D5C] bg-white"
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Order summary panel */}
              <div className="bg-[#F5F7FA] rounded-xl p-2.5 sm:p-3 border border-[#E5E7EB] space-y-1.5 text-xs">
                <div className="flex justify-between items-center text-[11px] sm:text-xs">
                  <span className="text-[#6B7280] font-mono">Platform Service Fee</span>
                  <span className="font-semibold text-[#111827]">
                    {service.price !== undefined && service.price !== null ? formatNaira(service.price) : "Provider Plan Cost"}
                  </span>
                </div>

                {(service.id.startsWith("edu_") || service.category === "EDUCATION") && (
                  <div className="flex justify-between items-center text-[11px] sm:text-xs border-t pt-1">
                    <span className="text-[#6B7280] font-mono">Quantity Requested</span>
                    <span className="font-semibold text-[#111827]">x{formData["quantity"] || 1}</span>
                  </div>
                )}

                <div className="flex justify-between items-center text-xs sm:text-sm font-bold border-t pt-1.5 text-[#111827]">
                  <span>Grand Total (Naira)</span>
                  <span className="text-[#0F2D5C] font-mono">{formatNaira(totalCost)}</span>
                </div>

                {currentUser && (
                  <div className="flex justify-between items-center text-[10.5px] sm:text-[11px] border-t pt-1 text-[#6B7280]">
                    <span>Your Current Wallet Balance</span>
                    <span className={(currentUser.walletBalance ?? 0) < totalCost ? "text-[#0F2D5C] font-bold" : "text-[#0F2D5C] font-bold"}>
                      {formatNaira(currentUser.walletBalance)}
                    </span>
                  </div>
                )}
              </div>

              {/* Submit / Cancel Actions */}
              <div className="flex gap-2 justify-end pt-2.5 border-t">
                <button
                  type="button"
                  onClick={onClose}
                  className="bg-[#0F2D5C] hover:bg-[#17407E] active:bg-[#0A1E3F] text-white px-3 py-1.5 border border-[#E5E7EB] rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="btn-confirm-transaction"
                  disabled={loading}
                  className="px-4 py-1.5 bg-[#0F2D5C] hover:bg-[#17407E] disabled:bg-[#E5E7EB] text-white font-bold rounded-lg text-xs transition-colors flex items-center gap-1 shadow-xs active:scale-95 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <SmartLinkLogoMark size="xs" color="#FFFFFF" animating={true} />
                      Validating...
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
