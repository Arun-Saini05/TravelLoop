import Link from "next/link";
import { cn } from "./cn";

interface BrandMarkProps {
  href?: string;
  size?: "sm" | "md" | "lg";
  withWordmark?: boolean;
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<BrandMarkProps["size"]>, string> = {
  sm: "h-7 text-base",
  md: "h-8 text-lg",
  lg: "h-10 text-xl",
};

const ICON_SIZE_CLASSES = {
  sm: "h-7 w-7",
  md: "h-8 w-8",
  lg: "h-10 w-10",
} as const;

export function BrandMark({
  href = "/",
  size = "md",
  withWordmark = true,
  className,
}: BrandMarkProps) {
  const content = (
    <span
      className={cn(
        "inline-flex items-center gap-2 font-semibold tracking-tight text-zinc-900",
        SIZE_CLASSES[size],
        className
      )}
    >
      <BrandIcon className={ICON_SIZE_CLASSES[size]} />
      {withWordmark && <span>Traveloop</span>}
    </span>
  );

  if (!href) return content;
  return (
    <Link href={href} className="inline-flex items-center" aria-label="Traveloop home">
      {content}
    </Link>
  );
}

function BrandIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={cn("shrink-0", className)}
    >
      <defs>
        <linearGradient id="tl-brand-gradient" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0f766e" />
          <stop offset="100%" stopColor="#14b8a6" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="28" height="28" rx="9" fill="url(#tl-brand-gradient)" />
      <path
        d="M11 21c2.5-2 4-5.5 4-9 0 3.5 1.5 7 4 9-2 .8-4 1.2-4 1.2S13 21.8 11 21Z"
        fill="white"
        fillOpacity="0.95"
      />
      <circle cx="22.5" cy="11" r="1.5" fill="white" fillOpacity="0.95" />
    </svg>
  );
}
