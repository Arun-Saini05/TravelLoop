import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";

export type BadgeTone =
  | "neutral"
  | "brand"
  | "success"
  | "warn"
  | "danger"
  | "info";

export type BadgeSize = "xs" | "sm";

const TONE_CLASSES: Record<BadgeTone, string> = {
  neutral: "bg-zinc-100 text-zinc-700 ring-zinc-200/70",
  brand: "bg-teal-50 text-teal-700 ring-teal-200/70",
  success: "bg-emerald-50 text-emerald-700 ring-emerald-200/70",
  warn: "bg-amber-50 text-amber-700 ring-amber-200/70",
  danger: "bg-red-50 text-red-700 ring-red-200/70",
  info: "bg-indigo-50 text-indigo-700 ring-indigo-200/70",
};

const SIZE_CLASSES: Record<BadgeSize, string> = {
  xs: "h-5 px-2 text-[10px] gap-1",
  sm: "h-6 px-2.5 text-xs gap-1.5",
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  size?: BadgeSize;
  icon?: ReactNode;
  /** Show a left-aligned status dot (defaults off). */
  withDot?: boolean;
}

export function Badge({
  tone = "neutral",
  size = "sm",
  icon,
  withDot,
  className,
  children,
  ...rest
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-semibold uppercase tracking-wide ring-1 ring-inset",
        TONE_CLASSES[tone],
        SIZE_CLASSES[size],
        className
      )}
      {...rest}
    >
      {withDot && (
        <span
          aria-hidden="true"
          className={cn(
            "size-1.5 rounded-full bg-current opacity-80",
            size === "sm" && "size-2"
          )}
        />
      )}
      {icon}
      <span>{children}</span>
    </span>
  );
}
