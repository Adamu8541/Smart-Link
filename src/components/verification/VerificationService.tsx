import React, { useState } from "react";
import {
  Search,
  Fingerprint,
  ShieldCheck,
  Phone,
  Mail,
  Building2,
  FileCheck2,
  Car,
  Globe,
  Vote,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Tag,
} from "lucide-react";
import { VerificationServiceConfig, VerificationType } from "../../types/verification";
import { VERIFICATION_SERVICES } from "../../services/verificationEngine";

interface VerificationServiceProps {
  onSelectService: (service: VerificationServiceConfig) => void;
  selectedCategory?: string;
}

export const VerificationService: React.FC<VerificationServiceProps> = ({
  onSelectService,
  selectedCategory: initialCategory = "ALL",
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case "Fingerprint":
        return <Fingerprint className="h-5 w-5 text-[#0F2D5C] dark:text-[#9CA3AF]" />;
      case "ShieldCheck":
        return <ShieldCheck className="h-5 w-5 text-[#0F2D5C] dark:text-[#9CA3AF]" />;
      case "Phone":
        return <Phone className="h-5 w-5 text-[#0F2D5C] dark:text-[#9CA3AF]" />;
      case "Mail":
        return <Mail className="h-5 w-5 text-[#0F2D5C] dark:text-[#9CA3AF]" />;
      case "Building2":
        return <Building2 className="h-5 w-5 text-[#0F2D5C] dark:text-[#9CA3AF]" />;
      case "FileCheck2":
        return <FileCheck2 className="h-5 w-5 text-[#0F2D5C] dark:text-[#9CA3AF]" />;
      case "Car":
        return <Car className="h-5 w-5 text-[#0F2D5C] dark:text-[#9CA3AF]" />;
      case "Globe":
        return <Globe className="h-5 w-5 text-[#0F2D5C]" />;
      case "Vote":
        return <Vote className="h-5 w-5 text-[#0F2D5C]" />;
      default:
        return <ShieldCheck className="h-5 w-5 text-[#0F2D5C] dark:text-[#9CA3AF]" />;
    }
  };

  const categories = ["ALL", "IDENTITY", "CORPORATE", "TAX", "CREDENTIAL"];

  const filteredServices = VERIFICATION_SERVICES.filter((service) => {
    const matchesCategory =
      selectedCategory === "ALL" || service.category === selectedCategory;
    const matchesQuery =
      !searchQuery ||
      service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.providerName.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesQuery;
  });

  return (
    <div className="space-y-5">
      {/* Header & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#111827] dark:text-white flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-[#0F2D5C] dark:text-[#9CA3AF]" />
            <span>Verification Services</span>
          </h2>
          <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
            Official central gateway for Federal Identity, Corporate, Tax & Credential Verifications
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#9CA3AF]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search NIN, BVN, CAC, TIN..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-[#F5F7FA] dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#4B5563] rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#0F2D5C]/20 text-[#111827] dark:text-white"
          />
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              selectedCategory === cat
                ? "bg-[#0F2D5C] text-white shadow-xs"
                : "bg-[#E5E7EB] dark:bg-[#111827] text-[#4B5563] dark:text-[#E5E7EB] hover:bg-[#E5E7EB] dark:hover:bg-[#4B5563]"
            }`}
          >
            {cat === "ALL" ? "All Services" : cat}
          </button>
        ))}
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredServices.map((service) => (
          <div
            key={service.id}
            onClick={() => onSelectService(service)}
            className="group relative bg-white dark:bg-[#111827] border border-[#E5E7EB]/80 dark:border-[#111827] rounded-2xl p-5 hover:border-[#0F2D5C]/50 hover:shadow-xl hover:shadow-blue-500/5 transition-all cursor-pointer flex flex-col justify-between space-y-4 overflow-hidden"
          >
            {/* Top Row: Icon + Fee Tag */}
            <div className="flex items-start justify-between gap-3">
              <div className="p-3 rounded-2xl bg-[#F5F7FA] dark:bg-[#0F2D5C]/60 border border-[#E5E7EB] dark:border-[#0F2D5C]/40 group-hover:scale-105 transition-transform">
                {getIconComponent(service.icon)}
              </div>

              <div className="text-right">
                <span className="font-mono text-xs font-extrabold text-[#0F2D5C] dark:text-[#9CA3AF] bg-[#F5F7FA] dark:bg-[#0F2D5C]/60 px-2.5 py-1 rounded-lg border border-[#E5E7EB]/60 dark:border-[#0F2D5C]/60">
                  ₦{service.fee.toLocaleString()}
                </span>
                <p className="text-[10px] text-[#9CA3AF] mt-1">{service.providerName}</p>
              </div>
            </div>

            {/* Title & Description */}
            <div className="space-y-1.5 flex-1">
              <h3 className="text-sm font-bold text-[#111827] dark:text-white group-hover:text-[#0F2D5C] dark:group-hover:text-[#9CA3AF] transition-colors">
                {service.title}
              </h3>
              <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] line-clamp-2 leading-relaxed">
                {service.description}
              </p>
            </div>

            {/* Bottom Action Indicator */}
            <div className="pt-3 border-t border-[#E5E7EB] dark:border-[#111827] flex items-center justify-between text-xs font-semibold text-[#0F2D5C] dark:text-[#9CA3AF]">
              <span>Verify Now</span>
              <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
