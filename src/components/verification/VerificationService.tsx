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
        return <Fingerprint className="h-5 w-5 text-blue-600 dark:text-blue-400" />;
      case "ShieldCheck":
        return <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />;
      case "Phone":
        return <Phone className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />;
      case "Mail":
        return <Mail className="h-5 w-5 text-amber-600 dark:text-amber-400" />;
      case "Building2":
        return <Building2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />;
      case "FileCheck2":
        return <FileCheck2 className="h-5 w-5 text-rose-600 dark:text-rose-400" />;
      case "Car":
        return <Car className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />;
      case "Globe":
        return <Globe className="h-5 w-5 text-blue-500" />;
      case "Vote":
        return <Vote className="h-5 w-5 text-emerald-500" />;
      default:
        return <ShieldCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />;
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
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <span>Verification Services</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Official central gateway for Federal Identity, Corporate, Tax & Credential Verifications
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search NIN, BVN, CAC, TIN..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-white"
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
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
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
            className="group relative bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/5 transition-all cursor-pointer flex flex-col justify-between space-y-4 overflow-hidden"
          >
            {/* Top Row: Icon + Fee Tag */}
            <div className="flex items-start justify-between gap-3">
              <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/40 group-hover:scale-105 transition-transform">
                {getIconComponent(service.icon)}
              </div>

              <div className="text-right">
                <span className="font-mono text-xs font-extrabold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-lg border border-blue-200/60 dark:border-blue-800/60">
                  ₦{service.fee.toLocaleString()}
                </span>
                <p className="text-[10px] text-slate-400 mt-1">{service.providerName}</p>
              </div>
            </div>

            {/* Title & Description */}
            <div className="space-y-1.5 flex-1">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {service.title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                {service.description}
              </p>
            </div>

            {/* Bottom Action Indicator */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-blue-600 dark:text-blue-400">
              <span>Verify Now</span>
              <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
