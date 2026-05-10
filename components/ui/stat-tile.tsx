import type { ReactNode } from "react";
import { cn } from "./cn";

interface StatTileProps {
  eyebrow: string;
  value: ReactNode;
  helper?: ReactNode;
  /** Optional small icon shown in the top-right corner. */
  icon?: ReactNode;
  /** Tone of the eyebrow + icon accent. */
  tone?: "neutral" | "brand" | "success" | "warn" | "danger";
  className?: string;
}

const TONE_TEXT: Record<NonNullable<StatTileProps["tone"]>, string> = {
  neutral: "text-zinc-500",
  brand: "text-teal-700",
  success: "text-emerald-700",
  warn: "text-amber-700",
  danger: "text-red-700",
};

export function StatTile({
  eyebrow,
  value,
  helper,
  icon,
  tone = "neutral",
  className,
}: StatTileProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm",
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div
          className={cn(
            "text-[10px] font-semibold uppercase tracking-[0.12em]",
            TONE_TEXT[tone]
          )}
        >
          {eyebrow}
        </div>
        {icon && (
          <span aria-hidden="true" className={cn("opacity-70", TONE_TEXT[tone])}>
            {icon}
          </span>
        )}
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">
        {value}
      </div>
      {helper && (
        <div className="mt-1 text-xs text-zinc-500">{helper}</div>
      )}
    </div>
  );
}
