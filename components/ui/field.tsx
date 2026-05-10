import type { ReactNode } from "react";
import { cn } from "./cn";

interface FieldProps {
  /** Stable id used to wire the label to the control. */
  id?: string;
  label?: ReactNode;
  helpText?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  /** Optional content rendered to the right of the label (counter, badge…). */
  trailing?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Field({
  id,
  label,
  helpText,
  error,
  required,
  trailing,
  children,
  className,
}: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <div className="flex items-baseline justify-between gap-2">
          <label
            htmlFor={id}
            className="text-xs font-semibold uppercase tracking-wide text-zinc-700"
          >
            {label}
            {required && <span className="ml-0.5 text-red-500">*</span>}
          </label>
          {trailing && (
            <span className="text-[11px] text-zinc-500">{trailing}</span>
          )}
        </div>
      )}
      {children}
      {error ? (
        <p className="text-xs font-medium text-red-600">{error}</p>
      ) : helpText ? (
        <p className="text-xs text-zinc-500">{helpText}</p>
      ) : null}
    </div>
  );
}
