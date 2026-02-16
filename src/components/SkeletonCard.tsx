import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Card-shaped skeleton placeholder (h-32, full width) with shimmer animation.
 */
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'h-32 w-full animate-pulse rounded-lg border border-gray-800 bg-gray-800 p-4',
        className
      )}
    >
      <div className="h-4 w-2/3 rounded bg-gray-700" />
      <div className="mt-3 h-3 w-full rounded bg-gray-700" />
      <div className="mt-2 h-3 w-4/5 rounded bg-gray-700" />
    </div>
  );
}

/**
 * Stat card skeleton - small card with a circle indicator and value bars.
 */
export function SkeletonStatCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-lg border border-gray-800 bg-gray-800 p-4',
        className
      )}
    >
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 shrink-0 rounded-full bg-gray-700" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-20 rounded bg-gray-700" />
          <div className="h-5 w-16 rounded bg-gray-700" />
        </div>
      </div>
    </div>
  );
}

/**
 * Table row skeleton with 4 columns of placeholder bars.
 */
export function SkeletonTableRow({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex animate-pulse items-center gap-4 rounded-lg border border-gray-800 bg-gray-800 px-4 py-3',
        className
      )}
    >
      <div className="h-3 w-1/4 rounded bg-gray-700" />
      <div className="h-3 w-1/4 rounded bg-gray-700" />
      <div className="h-3 w-1/4 rounded bg-gray-700" />
      <div className="h-3 w-1/4 rounded bg-gray-700" />
    </div>
  );
}

/**
 * Chart placeholder skeleton (h-64 with gradient bars).
 */
export function SkeletonChart({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'h-64 w-full animate-pulse rounded-lg border border-gray-800 bg-gray-800 p-4',
        className
      )}
    >
      <div className="flex h-full items-end gap-2">
        <div className="h-[30%] flex-1 rounded-t bg-gray-700" />
        <div className="h-[55%] flex-1 rounded-t bg-gray-700" />
        <div className="h-[40%] flex-1 rounded-t bg-gray-700" />
        <div className="h-[70%] flex-1 rounded-t bg-gray-700" />
        <div className="h-[50%] flex-1 rounded-t bg-gray-700" />
        <div className="h-[80%] flex-1 rounded-t bg-gray-700" />
        <div className="h-[45%] flex-1 rounded-t bg-gray-700" />
        <div className="h-[65%] flex-1 rounded-t bg-gray-700" />
      </div>
    </div>
  );
}
