import type { HTMLAttributes } from "react";
import { cn } from "./cn";

export type ContainerWidth = "narrow" | "default" | "wide";

const WIDTH_CLASSES: Record<ContainerWidth, string> = {
  narrow: "max-w-3xl",
  default: "max-w-5xl",
  wide: "max-w-7xl",
};

interface PageContainerProps extends HTMLAttributes<HTMLDivElement> {
  width?: ContainerWidth;
  /** Adds extra bottom padding so a `FloatingActionBar` doesn't cover content. */
  withFloatingBar?: boolean;
  /** Removes default vertical padding (use when stacking sections that own their padding). */
  noVerticalPadding?: boolean;
}

export function PageContainer({
  width = "default",
  withFloatingBar = false,
  noVerticalPadding = false,
  className,
  children,
  ...rest
}: PageContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-4 sm:px-6 lg:px-8",
        WIDTH_CLASSES[width],
        !noVerticalPadding && "py-6 sm:py-8",
        withFloatingBar && "pb-28 sm:pb-32",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
