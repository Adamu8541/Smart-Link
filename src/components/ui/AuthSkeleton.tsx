import React from "react";
import { Skeleton } from "./Skeleton";
import { FaviconLoader } from "./FaviconLoader";

export function AuthFormSkeleton() {
  return (
    <div className="space-y-6 w-full max-w-md mx-auto p-2 animate-fadeIn" role="status" aria-label="Loading login portal">
      {/* Brand logo & header skeleton using FaviconLoader */}
      <div className="flex flex-col items-center justify-center py-2 space-y-3">
        <FaviconLoader size="lg" label="Loading portal..." />
      </div>

      {/* Google button skeleton */}
      <Skeleton className="h-12 w-full rounded-xl" />

      {/* Divider */}
      <div className="flex items-center justify-center gap-2 py-1">
        <Skeleton className="h-px flex-1" />
        <Skeleton className="h-3 w-32 rounded-md" />
        <Skeleton className="h-px flex-1" />
      </div>

      {/* Inputs skeleton */}
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Skeleton className="h-3.5 w-24 rounded-md" />
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>
        <div className="space-y-1.5">
          <Skeleton className="h-3.5 w-20 rounded-md" />
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>
        <div className="flex items-center justify-between pt-1">
          <Skeleton className="h-4 w-32 rounded-md" />
          <Skeleton className="h-4 w-28 rounded-md" />
        </div>
      </div>

      {/* Primary Submit Button Skeleton */}
      <Skeleton className="h-12 w-full rounded-xl" />

      {/* Bottom Switch Link Skeleton */}
      <div className="flex justify-center pt-2">
        <Skeleton className="h-4 w-44 rounded-md" />
      </div>
    </div>
  );
}
