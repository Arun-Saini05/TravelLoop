import type { ReactNode } from "react";
import { cn } from "./cn";

interface FloatingActionBarProps {
  children: ReactNode;
  /** When true, renders an additional sub-line below the main pill (e.g. helper text). */
  helper?: ReactNode;
  className?: string;
  /** Set to `false` to hide on desktop too. Default: visible always. */
  visible?: boolean;
}

export function FloatingActionBar({
  children,
  helper,
  className,
  visible = true,
}: FloatingActionBarProps) {
  if (!visible) return null;
  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 bottom-4 z-40 flex flex-col items-center gap-2 px-4",
        className
      )}
    >
      <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-zinc-900/10 bg-white/95 px-3 py-2 shadow-lg backdrop-blur supports-backdrop-filter:bg-white/85">
        {children}
      </div>
      {helper && (
        <div className="pointer-events-auto rounded-full bg-zinc-900/85 px-3 py-1 text-[11px] font-medium text-white shadow-md">
          {helper}
        </div>
      )}
    </div>
  );
}
