import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";

type CardVariant = "default" | "subtle" | "dashed";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padded?: boolean;
  interactive?: boolean;
}

const VARIANT_CLASSES: Record<CardVariant, string> = {
  default: "border border-zinc-200 bg-white shadow-sm",
  subtle: "border border-zinc-200/70 bg-white",
  dashed:
    "border border-dashed border-zinc-300 bg-white/60 text-zinc-600",
};

export function Card({
  variant = "default",
  padded = true,
  interactive = false,
  className,
  children,
  ...rest
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl",
        VARIANT_CLASSES[variant],
        padded && "p-5",
        interactive &&
          "transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-zinc-300",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

interface CardSlotProps {
  children: ReactNode;
  className?: string;
}

export function CardHeader({ children, className }: CardSlotProps) {
  return (
    <div className={cn("flex items-start justify-between gap-3", className)}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className }: CardSlotProps) {
  return (
    <h3
      className={cn(
        "text-base font-semibold tracking-tight text-zinc-900",
        className
      )}
    >
      {children}
    </h3>
  );
}

export function CardDescription({ children, className }: CardSlotProps) {
  return (
    <p className={cn("mt-1 text-sm text-zinc-600", className)}>{children}</p>
  );
}

export function CardBody({ children, className }: CardSlotProps) {
  return <div className={cn("mt-3", className)}>{children}</div>;
}

export function CardFooter({ children, className }: CardSlotProps) {
  return (
    <div
      className={cn(
        "mt-4 flex flex-wrap items-center justify-between gap-3",
        className
      )}
    >
      {children}
    </div>
  );
}
