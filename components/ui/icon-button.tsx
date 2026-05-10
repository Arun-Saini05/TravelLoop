import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "./cn";

type IconButtonTone = "neutral" | "danger" | "brand";

const TONE_CLASSES: Record<IconButtonTone, string> = {
  neutral: "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
  danger: "text-red-600 hover:bg-red-50 hover:text-red-700",
  brand: "text-teal-700 hover:bg-teal-50 hover:text-teal-800",
};

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Required so that icon-only controls remain accessible. */
  "aria-label": string;
  tone?: IconButtonTone;
  size?: "sm" | "md";
}

const SIZE_CLASSES = {
  sm: "h-7 w-7 rounded-md",
  md: "h-9 w-9 rounded-lg",
} as const;

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton(
    { tone = "neutral", size = "md", className, type = "button", children, ...rest },
    ref
  ) {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          "inline-flex items-center justify-center transition-colors outline-hidden focus-visible:ring-4 focus-visible:ring-zinc-900/20 disabled:cursor-not-allowed disabled:opacity-50",
          SIZE_CLASSES[size],
          TONE_CLASSES[tone],
          className
        )}
        {...rest}
      >
        {children}
      </button>
    );
  }
);
