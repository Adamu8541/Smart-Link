import React from "react";
import { SmartLinkLogoMark } from "../ui/SmartLinkLogoMark";

export const RouteLoadingFallback: React.FC<{ message?: string }> = ({
  message = "Loading experience..."
}) => {
  return (
    <div className="min-h-[400px] w-full flex flex-col items-center justify-center p-8 text-center space-y-4 animate-fadeIn">
      <div className="relative">
        <div className="h-16 w-16 rounded-2xl bg-[#F5F7FA] dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#374151] flex items-center justify-center shadow-xs">
          <SmartLinkLogoMark size="md" animating={true} />
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-sm font-black text-[#111827] dark:text-white uppercase tracking-wider font-mono">
          SmartLink Gateway
        </p>
        <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] font-medium">
          {message}
        </p>
      </div>
    </div>
  );
};

export default RouteLoadingFallback;
