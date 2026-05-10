import { forwardRef, type SelectHTMLAttributes } from "react";
import { cn } from "./cn";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
  size?: "sm" | "md";
}

const SIZE_CLASSES = {
  sm: "h-9 pl-3 pr-8 text-xs",
  md: "h-11 pl-3.5 pr-9 text-sm",
} as const;

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { invalid, size = "md", className, children, ...rest },
  ref
) {
  return (
    <div className="relative inline-block w-full">
      <select
        ref={ref}
        className={cn(
          "block w-full appearance-none rounded-xl border border-zinc-300 bg-white text-zinc-900 transition-colors outline-hidden focus:border-teal-600 focus:ring-4 focus:ring-teal-500/20 disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-500",
          SIZE_CLASSES[size],
          invalid &&
            "border-red-300 focus:border-red-500 focus:ring-red-500/20",
          className
        )}
        {...rest}
      >
        {children}
      </select>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-zinc-500"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m4 6 4 4 4-4" />
        </svg>
      </span>
    </div>
  );
});
