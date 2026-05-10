import type { ActivityType } from "@/app/generated/prisma";

// Approximate USD baseline per Google Places `priceLevel` (0..4).
// 0 = Free, 1 = Inexpensive, 2 = Moderate, 3 = Expensive, 4 = Very Expensive.
// These are rough averages for an "experience" (admission, meal, etc.) and are
// scaled per-country via Country.costMultiplier.
export const PRICE_LEVEL_BASE_USD: readonly number[] = [0, 10, 30, 70, 150];

export const PRICE_LEVEL_LABELS: readonly string[] = [
  "Free",
  "Inexpensive",
  "Moderate",
  "Expensive",
  "Very Expensive",
];

/**
 * Sensible default Google `price_level` per ActivityType. Used when Google's
 * Places API didn't return a `price_level` for a result so we can still make
 * a country-aware estimate (price level still flows through `priceLevelToUsd`,
 * which applies the country multiplier).
 *
 * Tuned for "what a typical traveller expects to pay for one of these":
 *   - Browsing a market or a free park       → level 0 (Free)
 *   - A small entry / sight / transport hop  → level 1 (~$10 base)
 *   - A meal, museum, casual outing          → level 2 (~$30 base)
 *   - A guided adventure / spa session       → level 3 (~$70 base)
 */
const DEFAULT_PRICE_LEVEL_BY_TYPE: Record<ActivityType, number> = {
  SIGHTSEEING: 1,
  FOOD:        2,
  ADVENTURE:   3,
  CULTURE:     1,
  NATURE:      0,
  NIGHTLIFE:   2,
  SHOPPING:    0,
  WELLNESS:    3,
  TRANSPORT:   1,
  OTHER:       1,
};

export function defaultPriceLevelFor(type: ActivityType | null | undefined): number {
  if (!type) return DEFAULT_PRICE_LEVEL_BY_TYPE.OTHER;
  return DEFAULT_PRICE_LEVEL_BY_TYPE[type] ?? DEFAULT_PRICE_LEVEL_BY_TYPE.OTHER;
}

/**
 * Best-effort mapping from a Google Places "primary type" / category string
 * (e.g. "museum_of_art", "tourist_attraction", "ramen_restaurant") to one of
 * our `ActivityType` enums. Mirrors `mapCategoryToType` in
 * `app/actions/activities.ts` so both client and server land on the same type.
 */
export function categoryToActivityType(category: string | null | undefined): ActivityType {
  if (!category) return "OTHER";
  const lower = category.toLowerCase();
  if (lower.includes("food") || lower.includes("restaurant") || lower.includes("cafe")) return "FOOD";
  if (lower.includes("museum") || lower.includes("art") || lower.includes("historic")) return "CULTURE";
  if (lower.includes("park") || lower.includes("garden") || lower.includes("nature")) return "NATURE";
  if (lower.includes("shop")) return "SHOPPING";
  if (lower.includes("spa") || lower.includes("wellness")) return "WELLNESS";
  if (lower.includes("bar") || lower.includes("night")) return "NIGHTLIFE";
  if (lower.includes("adventure") || lower.includes("sport")) return "ADVENTURE";
  return "SIGHTSEEING";
}

function clampLevel(level: number): number {
  if (!Number.isFinite(level)) return 0;
  if (level < 0) return 0;
  if (level > 4) return 4;
  return Math.round(level);
}

/**
 * Convert a Google Places `priceLevel` (0..4) into an approximate USD price,
 * scaled by the destination country's cost-of-living multiplier.
 *
 * - When `priceLevel` is null/undefined, returns `0` (caller decides how to display).
 * - When `countryMultiplier` is null/undefined, defaults to 1.0 (USA baseline).
 */
export function priceLevelToUsd(
  priceLevel: number | null | undefined,
  countryMultiplier: number | null | undefined
): number {
  if (priceLevel == null) return 0;

  const level = clampLevel(priceLevel);
  const base = PRICE_LEVEL_BASE_USD[level] ?? 0;
  const multiplier = countryMultiplier ?? 1;
  return Math.round(base * multiplier);
}

/**
 * Same as `priceLevelToUsd` but with a guaranteed type-based fallback when
 * Google didn't return a `price_level`. Returns the USD figure plus a flag the
 * caller can use to render an "est." indicator.
 */
export function estimatedUsd(
  priceLevel: number | null | undefined,
  type: ActivityType | null | undefined,
  countryMultiplier: number | null | undefined
): { usd: number; isEstimated: boolean; effectiveLevel: number } {
  if (priceLevel != null) {
    return {
      usd: priceLevelToUsd(priceLevel, countryMultiplier),
      isEstimated: false,
      effectiveLevel: clampLevel(priceLevel),
    };
  }
  const level = defaultPriceLevelFor(type);
  return {
    usd: priceLevelToUsd(level, countryMultiplier),
    isEstimated: true,
    effectiveLevel: level,
  };
}

/**
 * Convert a price level to a `$ / $$ / $$$ / $$$$` style chip.
 *  - `0` → `"Free"`
 *  - `null` → `"—"`
 */
export function priceLevelToSymbol(priceLevel: number | null | undefined): string {
  if (priceLevel == null) return "—";

  const level = clampLevel(priceLevel);
  if (level === 0) return "Free";
  return "$".repeat(level);
}

/**
 * Map Google's `priceLevel` enum string to an integer 0..4. Returns null if
 * unknown/unset.
 */
export function googlePriceLevelEnumToInt(value: string | null | undefined): number | null {
  if (!value) return null;
  switch (value) {
    case "PRICE_LEVEL_FREE":
      return 0;
    case "PRICE_LEVEL_INEXPENSIVE":
      return 1;
    case "PRICE_LEVEL_MODERATE":
      return 2;
    case "PRICE_LEVEL_EXPENSIVE":
      return 3;
    case "PRICE_LEVEL_VERY_EXPENSIVE":
      return 4;
    default:
      return null;
  }
}
