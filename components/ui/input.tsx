import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "./cn";

const BASE =
  "block w-full rounded-xl border border-zinc-300 bg-white px-3.5 text-sm text-zinc-900 placeholder:text-zinc-400 transition-colors outline-hidden focus:border-teal-600 focus:ring-4 focus:ring-teal-500/20 disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-500";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
  size?: "sm" | "md";
}

const SIZE_CLASSES = {
  sm: "h-9",
  md: "h-11",
} as const;

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { invalid, size = "md", className, ...rest },
  ref
) {
  return (
    <input
      ref={ref}
      className={cn(
        BASE,
        SIZE_CLASSES[size],
        invalid &&
          "border-red-300 focus:border-red-500 focus:ring-red-500/20",
        className
      )}
      {...rest}
    />
  );
});
