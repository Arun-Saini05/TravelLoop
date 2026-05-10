import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";

interface SectionProps extends HTMLAttributes<HTMLElement> {
  eyebrow?: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  /** Right-aligned action slot in the header. */
  action?: ReactNode;
}

export function Section({
  eyebrow,
  title,
  description,
  action,
  className,
  children,
  ...rest
}: SectionProps) {
  const hasHeader = !!(eyebrow || title || description || action);
  return (
    <section className={cn("space-y-4", className)} {...rest}>
      {hasHeader && (
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-1">
            {eyebrow && (
              <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-teal-700">
                {eyebrow}
              </div>
            )}
            {title && (
              <h2 className="text-xl font-semibold tracking-tight text-zinc-900">
                {title}
              </h2>
            )}
            {description && (
              <p className="text-sm text-zinc-600">{description}</p>
            )}
          </div>
          {action && <div className="flex items-center gap-2">{action}</div>}
        </header>
      )}
      {children}
    </section>
  );
}
