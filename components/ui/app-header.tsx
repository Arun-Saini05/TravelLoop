import type { ReactNode } from "react";
import { BrandMark } from "./brand-mark";
import { Breadcrumb, type BreadcrumbItem } from "./breadcrumb";
import { cn } from "./cn";
import type { ContainerWidth } from "./page-container";

const WIDTH_CLASSES: Record<ContainerWidth, string> = {
  narrow: "max-w-3xl",
  default: "max-w-5xl",
  wide: "max-w-7xl",
};

interface AppHeaderProps {
  /** Optional breadcrumbs shown to the right of the brand mark. */
  crumbs?: BreadcrumbItem[];
  /** Right-aligned action slot — typically buttons/links. */
  actions?: ReactNode;
  /** Match the page container width so the bar lines up with content. */
  width?: ContainerWidth;
  /** When true, keeps the brand mark only (no wordmark). */
  compact?: boolean;
  /** Override the brand href (default `/`). */
  brandHref?: string;
  className?: string;
}

export function AppHeader({
  crumbs,
  actions,
  width = "default",
  compact = false,
  brandHref = "/",
  className,
}: AppHeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-30 border-b border-zinc-200/80 bg-white/85 backdrop-blur supports-backdrop-filter:bg-white/70",
        className
      )}
    >
      <div
        className={cn(
          "mx-auto flex h-14 w-full items-center gap-4 px-4 sm:h-16 sm:px-6 lg:px-8",
          WIDTH_CLASSES[width]
        )}
      >
        <BrandMark href={brandHref} size="md" withWordmark={!compact} />

        {crumbs && crumbs.length > 0 && (
          <>
            <span aria-hidden="true" className="text-zinc-300">
              /
            </span>
            <div className="min-w-0 flex-1">
              <Breadcrumb items={crumbs} />
            </div>
          </>
        )}

        {(!crumbs || crumbs.length === 0) && <div className="flex-1" />}

        {actions && (
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        )}
      </div>
    </header>
  );
}
