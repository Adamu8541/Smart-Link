import React from "react";
import { Skeleton } from "./Skeleton";

export function AuthFormSkeleton() {
  return (
    <div className="space-y-6 w-full max-w-md mx-auto p-2 animate-fadeIn" role="status" aria-label="Loading login portal">
      {/* Brand logo & header skeleton */}
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <Skeleton className="h-12 w-12 rounded-xl" />
          <Skeleton className="h-7 w-36 rounded-lg" />
        </div>
        <div className="space-y-1.5 text-center w-full flex flex-col items-center">
          <Skeleton className="h-5 w-48 rounded-md" />
          <Skeleton className="h-3.5 w-64 rounded-md" />
        </div>
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
