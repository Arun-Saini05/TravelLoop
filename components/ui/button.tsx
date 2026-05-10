import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "./cn";

export type ButtonVariant =
  | "primary"
  | "brand"
  | "secondary"
  | "ghost"
  | "danger"
  | "link";

export type ButtonSize = "sm" | "md" | "lg";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-zinc-900 text-white hover:bg-zinc-800 active:bg-zinc-950 shadow-sm focus-visible:ring-zinc-900/40",
  brand:
    "bg-[linear-gradient(135deg,#0f766e_0%,#14b8a6_100%)] text-white hover:brightness-110 shadow-sm focus-visible:ring-teal-500/40",
  secondary:
    "border border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-50 hover:border-zinc-400 focus-visible:ring-zinc-900/20",
  ghost:
    "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 focus-visible:ring-zinc-900/20",
  danger:
    "border border-red-200 bg-white text-red-700 hover:bg-red-50 hover:border-red-300 focus-visible:ring-red-500/30",
  link: "text-teal-700 hover:text-teal-800 underline-offset-4 hover:underline focus-visible:ring-teal-500/30 px-0 py-0 h-auto shadow-none rounded-none bg-transparent",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs gap-1.5 rounded-lg",
  md: "h-10 px-4 text-sm gap-2 rounded-xl",
  lg: "h-12 px-5 text-sm gap-2 rounded-xl",
};

const BASE =
  "inline-flex items-center justify-center font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 outline-hidden focus-visible:ring-4 select-none whitespace-nowrap";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    fullWidth,
    iconLeft,
    iconRight,
    loading,
    disabled,
    className,
    children,
    type = "button",
    ...rest
  },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={cn(
        BASE,
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        fullWidth && "w-full",
        className
      )}
      {...rest}
    >
      {loading ? <Spinner /> : iconLeft}
      <span>{children}</span>
      {!loading && iconRight}
    </button>
  );
});

function Spinner() {
  return (
    <span
      aria-hidden="true"
      className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
    />
  );
}

/**
 * Style helper for rendering an `<a>` or `<Link>` with the same look as
 * `<Button>`. Use with Next.js `<Link>` components since this codebase
 * doesn't bundle Radix Slot.
 */
export function buttonClasses(opts: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
} = {}): string {
  const { variant = "primary", size = "md", fullWidth, className } = opts;
  return cn(
    BASE,
    VARIANT_CLASSES[variant],
    SIZE_CLASSES[size],
    fullWidth && "w-full",
    className
  );
}
