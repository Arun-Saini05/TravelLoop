/**
 * Tiny class-name joiner. Filters out falsy values so call sites can
 * write `cn("base", isActive && "active", className)` without pulling
 * in clsx/tailwind-merge as a dependency.
 */
export function cn(
  ...values: Array<string | number | null | undefined | false>
): string {
  return values.filter(Boolean).join(" ");
}
