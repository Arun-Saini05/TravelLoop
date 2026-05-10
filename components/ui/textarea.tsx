import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "./cn";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ invalid, className, ...rest }, ref) {
    return (
      <textarea
        ref={ref}
        className={cn(
          "block w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 transition-colors outline-hidden focus:border-teal-600 focus:ring-4 focus:ring-teal-500/20 disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-500",
          invalid &&
            "border-red-300 focus:border-red-500 focus:ring-red-500/20",
          className
        )}
        {...rest}
      />
    );
  }
);
