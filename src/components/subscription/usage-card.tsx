"use client";

import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface UsageCardProps {
  icon: LucideIcon;
  label: string;
  current: number;
  limit: number;
  unlimited?: boolean;
  showUpgrade?: boolean;
  onUpgrade?: () => void;
}

export function UsageCard({
  icon: Icon,
  label,
  current,
  limit,
  unlimited = false,
  showUpgrade = false,
  onUpgrade,
}: UsageCardProps) {
  // Calculate percentage - if unlimited, show 0% (or some visual indicator)
  const percentage = unlimited ? 0 : Math.min((current / limit) * 100, 100);

  // Determine color based on percentage
  const getColorClass = () => {
    if (unlimited) return "bg-primary";
    if (percentage >= 90) return "bg-red-500";
    if (percentage >= 70) return "bg-amber-500";
    return "bg-emerald-500";
  };

  // Determine status text
  const getStatusColor = () => {
    if (unlimited) return "text-primary";
    if (percentage >= 90) return "text-red-500";
    if (percentage >= 70) return "text-amber-500";
    return "text-emerald-500";
  };

  const displayLimit = unlimited ? "∞" : limit.toLocaleString();
  const isNearLimit = !unlimited && percentage >= 70;

  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-card p-4 transition-all duration-200 hover:border-primary/30 hover:shadow-sm">
      {/* Background gradient on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="relative flex flex-col gap-3">
        {/* Header: Icon + Label */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </div>
          <span className="text-sm font-medium text-foreground">{label}</span>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500 ease-out",
                getColorClass()
              )}
              style={{
                width: unlimited ? "100%" : `${percentage}%`,
              }}
            />
          </div>

          {/* Usage Text */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              {current.toLocaleString()} / {displayLimit}
            </span>
            {unlimited ? (
              <span className="font-medium text-primary">Ilimitado</span>
            ) : (
              <span className={cn("font-medium", getStatusColor())}>
                {percentage.toFixed(0)}%
              </span>
            )}
          </div>
        </div>

        {/* Upgrade CTA - shown when near limit */}
        {showUpgrade && isNearLimit && (
          <button
            onClick={onUpgrade}
            className="mt-1 inline-flex items-center justify-center gap-1.5 rounded-md bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-600 transition-colors hover:bg-amber-500/20 dark:text-amber-400"
          >
            <span>¡Actualiza tu plan!</span>
            <svg
              className="h-3 w-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Compact version for sidebar widget
 */
interface MiniUsageBarProps {
  label: string;
  current: number;
  limit: number;
  unlimited?: boolean;
}

export function MiniUsageBar({
  label,
  current,
  limit,
  unlimited = false,
}: MiniUsageBarProps) {
  const percentage = unlimited ? 0 : Math.min((current / limit) * 100, 100);

  const getColorClass = () => {
    if (unlimited) return "bg-primary";
    if (percentage >= 90) return "bg-red-500";
    if (percentage >= 70) return "bg-amber-500";
    return "bg-emerald-500";
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground truncate">{label}</span>
        <span className="text-muted-foreground">
          {current}/{unlimited ? "∞" : limit}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300",
            getColorClass()
          )}
          style={{
            width: unlimited ? "100%" : `${percentage}%`,
          }}
        />
      </div>
    </div>
  );
}
