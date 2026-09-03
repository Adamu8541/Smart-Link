import React from "react";
import { FaviconLoader } from "./FaviconLoader";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function Skeleton({ className = "", ...props }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-md bg-[#E5E7EB]/80 dark:bg-[#4B5563]/50 ${className}`}
      {...props}
    />
  );
}

export function FaviconSkeleton({
  className = "",
  size = "md",
  label = "Loading...",
}: {
  className?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | number;
  label?: string;
}) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 bg-white dark:bg-[#1F2937] rounded-2xl border border-[#E5E7EB] dark:border-[#374151] shadow-xs ${className}`}>
      <FaviconLoader size={size} label={label} />
    </div>
  );
}

export function CardSkeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`p-6 bg-white rounded-2xl border border-[#E5E7EB] shadow-xs space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-1/3 rounded-lg" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
      <Skeleton className="h-10 w-2/3 rounded-xl" />
      <div className="space-y-2 pt-2">
        <Skeleton className="h-3 w-full rounded-md" />
        <Skeleton className="h-3 w-4/5 rounded-md" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="w-full bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden space-y-3 p-4">
      <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
        <Skeleton className="h-4 w-28 rounded-md" />
        <Skeleton className="h-4 w-16 rounded-md" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between py-2.5">
          <div className="flex items-center gap-3 w-1/2">
            <Skeleton className="h-9 w-9 rounded-full shrink-0" />
            <div className="space-y-1 w-full">
              <Skeleton className="h-3.5 w-3/4 rounded-md" />
              <Skeleton className="h-2.5 w-1/2 rounded-md" />
            </div>
          </div>
          <Skeleton className="h-4 w-20 rounded-md" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}
