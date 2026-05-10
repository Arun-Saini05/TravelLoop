import type { ReactNode } from "react";
import { cn } from "./cn";

interface EmptyStateProps {
  /** Emoji or small icon shown above the title. */
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  /** Render any CTA button(s) here. */
  action?: ReactNode;
  /** Visual treatment. `dashed` is the default empty-state look. */
  variant?: "dashed" | "solid";
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  variant = "dashed",
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-2xl px-6 py-10 text-center",
        variant === "dashed"
          ? "border border-dashed border-zinc-300 bg-white/40"
          : "border border-zinc-200 bg-white shadow-sm",
        className
      )}
    >
      {icon !== undefined && (
        <div className="text-3xl" aria-hidden="true">
          {icon}
        </div>
      )}
      <div className="space-y-1">
        <h3 className="text-base font-semibold tracking-tight text-zinc-900">
          {title}
        </h3>
        {description && (
          <p className="mx-auto max-w-md text-sm text-zinc-600">
            {description}
          </p>
        )}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
