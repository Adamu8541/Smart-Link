/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  Fingerprint,
  FileText,
  GraduationCap,
  Wifi,
  Building,
  HelpCircle,
  Sparkles,
  Search,
  CheckCircle,
  Tag,
  X
} from "lucide-react";
import { motion } from "motion/react";
import { formatNaira } from "../utils/formatUtils";
import { useSiteConfig } from "../context/SiteConfigContext";
import { getRealServiceIcon } from "./common/ServiceIcons";
import { SMART_LINK_SERVICES, ServiceItem } from "../data/servicesData";
export type { ServiceItem };
export { SMART_LINK_SERVICES };

interface ServicesGridProps {
  onSelectService: (service: ServiceItem) => void;
}

export default function ServicesGrid({ onSelectService }: ServicesGridProps) {
  const { getServicePrice } = useSiteConfig();
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const categories = [
    { id: "ALL", label: "All Solutions", icon: HelpCircle },
    { id: "IDENTITY", label: "KYC & NIN Biometrics", icon: Fingerprint },
    { id: "CAC", label: "CAC Registrations", icon: Building },
    { id: "EDUCATION", label: "School Cards (WAEC/JAMB)", icon: GraduationCap },
    { id: "VTU", label: "VTU Airtime & Utilities", icon: Wifi },
    { id: "GOVERNMENT", label: "E-Gov & Passports", icon: FileText },
    { id: "ICT", label: "ICT Portal Building", icon: Sparkles }
  ];

  const filteredServices = SMART_LINK_SERVICES.filter((srv) => {
    const matchesTab = activeTab === "ALL" || srv.category === activeTab;
    const matchesSearch =
      srv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      srv.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="py-12 bg-[#F5F7FA]" id="services-grid-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Title Block */}
        <div className="text-center space-y-3 max-w-3xl mx-auto mb-10">
          <span className="px-3 py-1 rounded-full bg-[#F5F7FA] text-[#0F2D5C] text-xs font-bold tracking-wider uppercase border border-[#E5E7EB]">
            Product Portfolio
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#111827] tracking-tight">
            Our Elite Digital Enterprise Services
          </h2>
          <p className="text-[#4B5563] font-normal">
            Providing Nigerians and corporations with instantaneous API identity verifications, Corporate CAC filings, VTU top ups, and official government application assistances.
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-xl mx-auto mb-10 space-y-3">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search className="h-4.5 w-4.5 text-[#0F2D5C]" />
            </div>
            <input
              type="text"
              id="search-services-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search registrations, airtime, scratch cards..."
              className="w-full pl-10 pr-10 py-3 rounded-xl border border-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-[#0F2D5C]/20 focus:border-[#0F2D5C] text-sm shadow-xs transition-all bg-white font-medium text-[#111827]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#6B7280] hover:text-[#0F2D5C] transition-colors"
                title="Clear Search"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            )}
          </div>

          {/* Quick-tap Tag Shortcuts */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 text-xs">
            <span className="text-[#6B7280] font-medium">Try searching:</span>
            {[
              { label: "NIN Biometrics", query: "NIN" },
              { label: "CAC Filings", query: "CAC" },
              { label: "WAEC Pins", query: "WAEC" },
              { label: "Airtime Top-up", query: "Airtime" },
              { label: "Prepaid Electricity", query: "Electricity" },
              { label: "Passport Booking", query: "Passport" }
            ].map((tag) => (
              <button
                key={tag.query}
                onClick={() => {
                  setSearchQuery(tag.query);
                  setActiveTab("ALL");
                }}
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all ${
                  searchQuery.toLowerCase() === tag.query.toLowerCase()
                    ? "bg-[#0F2D5C] text-white shadow-xs"
                    : "bg-white border border-[#E5E7EB] text-[#4B5563] hover:bg-[#F5F7FA] hover:text-[#0F2D5C]"
                }`}
              >
                {tag.label}
              </button>
            ))}
          </div>

          {/* Matches Counter */}
          {searchQuery && (
            <p className="text-center text-xs font-bold text-[#0F2D5C]">
              Found {filteredServices.length} {filteredServices.length === 1 ? "solution" : "solutions"} matching &quot;{searchQuery}&quot;
            </p>
          )}
        </div>

        {/* Category Tab List */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-thin border-b border-[#E5E7EB]">
          {categories.map((cat) => {
            const IconComp = cat.icon;
            const isSelected = activeTab === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveTab(cat.id)}
                id={`tab-service-${cat.id}`}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  isSelected
                    ? "bg-[#0F2D5C] text-white shadow-xs border border-[#0F2D5C]"
                    : "bg-white text-[#4B5563] border border-[#E5E7EB] hover:border-[#0F2D5C]"
                }`}
              >
                <IconComp className="h-3.5 w-3.5" />
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Services Cards Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((srv) => {
            const livePrice = srv.price !== undefined ? getServicePrice(srv.id, srv.price) : undefined;
            return (
              <motion.div
                layout
                key={srv.id}
                className="group flex flex-col justify-between p-6 rounded-2xl border border-[#E5E7EB] hover:border-[#0F2D5C] shadow-[0_4px_12px_rgba(15,23,42,0.06)] hover:shadow-md transition-all bg-white relative overflow-hidden"
              >
                <div className="space-y-4">
                  {/* Category Indicator */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase bg-[#F5F7FA] text-[#0F2D5C] px-2.5 py-0.5 rounded font-bold tracking-wider">
                      {srv.category}
                    </span>
                    {livePrice !== undefined && (
                      <span className="text-xs font-bold text-[#0F2D5C] bg-[#F5F7FA] px-2.5 py-0.5 rounded-full flex items-center gap-1 font-mono border border-[#E5E7EB]">
                        <Tag className="h-3 w-3" />
                        {formatNaira(livePrice)}
                      </span>
                    )}
                    {srv.priceLabel && (
                      <span className="text-[10px] text-[#6B7280] italic bg-[#F5F7FA] px-2 py-0.5 rounded">
                        {srv.priceLabel}
                      </span>
                    )}
                  </div>

                  {/* Icon & Name */}
                  <div className="flex items-center gap-3">
                    <div className="shrink-0">
                      {getRealServiceIcon(srv.id, "h-11 w-11")}
                    </div>
                    <h3 className="text-base font-bold text-[#111827] group-hover:text-[#0F2D5C] transition-colors leading-tight">
                      {srv.name}
                    </h3>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-[#4B5563] leading-relaxed">
                    {srv.description}
                  </p>
                </div>

                {/* Action Button */}
                <div className="mt-6 pt-4 border-t border-[#E5E7EB] flex items-center justify-between">
                  <span className="flex items-center gap-1 text-[11px] text-[#6B7280]">
                    <CheckCircle className="h-3.5 w-3.5 text-[#0F2D5C]" />
                    Instant processing
                  </span>
                  <button
                    onClick={() => onSelectService({ ...srv, price: livePrice ?? srv.price })}
                    id={`btn-order-${srv.id}`}
                    className="px-4 py-2 bg-[#0F2D5C] hover:bg-[#17407E] text-white rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-xs"
                  >
                    {srv.actionLabel}
                  </button>
                </div>
              </motion.div>
            );
          })}

          {filteredServices.length === 0 && (
            <div className="col-span-full py-12 text-center space-y-3">
              <p className="text-[#6B7280] text-sm font-medium">No digital solutions found matching your search criteria.</p>
              <button
                onClick={() => {
                  setActiveTab("ALL");
                  setSearchQuery("");
                }}
                className="px-4 py-2 bg-white border border-[#E5E7EB] text-[#111827] hover:border-[#0F2D5C] rounded-xl text-xs font-bold"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
