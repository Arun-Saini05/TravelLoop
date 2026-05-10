import type { MemberRole, TripStatus, TripVisibility } from "@/app/generated/prisma/client";
import type {
  BookingLabel,
  LifecycleGroup,
  TripRoleFilter,
  TripsGroupedByLifecycle,
  TripsQueryState,
  TripSortOption,
  TripViewModel,
} from "@/app/dashboard/trips/types";

const TRIP_STATUSES: TripStatus[] = [
  "DRAFT",
  "PLANNED",
  "ONGOING",
  "COMPLETED",
  "ARCHIVED",
];

const TRIP_VISIBILITIES: TripVisibility[] = ["PRIVATE", "FRIENDS", "PUBLIC"];

const ROLE_FILTERS: TripRoleFilter[] = ["all", "owner", "editor", "viewer"];

const SORT_OPTIONS: TripSortOption[] = [
  "start-asc",
  "updated-desc",
  "created-desc",
  "budget-desc",
];

export const DEFAULT_SORT: TripSortOption = "start-asc";

export const statusFilterOptions = [
  { value: "all", label: "All statuses" },
  { value: "DRAFT", label: "Draft" },
  { value: "PLANNED", label: "Planned" },
  { value: "ONGOING", label: "Ongoing" },
  { value: "COMPLETED", label: "Completed" },
  { value: "ARCHIVED", label: "Archived" },
] as const;

export const roleFilterOptions = [
  { value: "all", label: "All roles" },
  { value: "owner", label: "Owner" },
  { value: "editor", label: "Editor" },
  { value: "viewer", label: "Viewer" },
] as const;

export const visibilityFilterOptions = [
  { value: "all", label: "All visibility" },
  { value: "PRIVATE", label: "Private" },
  { value: "FRIENDS", label: "Friends" },
  { value: "PUBLIC", label: "Public" },
] as const;

export const sortOptions = [
  { value: "start-asc", label: "Nearest start date" },
  { value: "updated-desc", label: "Recently updated" },
  { value: "created-desc", label: "Newest created" },
  { value: "budget-desc", label: "Highest budget" },
] as const;

function getSingleParam(
  value: string | string[] | undefined
): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  if (typeof value === "string") {
    return value;
  }

  return undefined;
}

function isTripStatus(value: string | undefined): value is TripStatus {
  if (!value) return false;
  return TRIP_STATUSES.includes(value as TripStatus);
}

function isTripVisibility(value: string | undefined): value is TripVisibility {
  if (!value) return false;
  return TRIP_VISIBILITIES.includes(value as TripVisibility);
}

function isTripRoleFilter(value: string | undefined): value is TripRoleFilter {
  if (!value) return false;
  return ROLE_FILTERS.includes(value as TripRoleFilter);
}

function isSortOption(value: string | undefined): value is TripSortOption {
  if (!value) return false;
  return SORT_OPTIONS.includes(value as TripSortOption);
}

export function parseTripsQuery(
  rawSearchParams: Record<string, string | string[] | undefined>
): TripsQueryState {
  const rawQ = getSingleParam(rawSearchParams.q)?.trim() ?? "";
  const rawStatus = getSingleParam(rawSearchParams.status);
  const rawRole = getSingleParam(rawSearchParams.role);
  const rawVisibility = getSingleParam(rawSearchParams.visibility);
  const rawSort = getSingleParam(rawSearchParams.sort);

  const status = isTripStatus(rawStatus) ? rawStatus : "all";
  const role = isTripRoleFilter(rawRole) ? rawRole : "all";
  const visibility = isTripVisibility(rawVisibility) ? rawVisibility : "all";
  const sort = isSortOption(rawSort) ? rawSort : DEFAULT_SORT;

  const hasActiveFilters =
    rawQ.length > 0 ||
    status !== "all" ||
    role !== "all" ||
    visibility !== "all" ||
    sort !== DEFAULT_SORT;

  return {
    q: rawQ,
    status,
    role,
    visibility,
    sort,
    hasActiveFilters,
  };
}

export function toNumber(value: unknown): number {
  if (value === null || value === undefined) {
    return 0;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  if (
    typeof value === "object" &&
    value !== null &&
    "toNumber" in value &&
    typeof (value as { toNumber?: unknown }).toNumber === "function"
  ) {
    const result = (value as { toNumber: () => number }).toNumber();
    return Number.isFinite(result) ? result : 0;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatDateRange(startDate: Date, endDate: Date): string {
  const dateFormat = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return `${dateFormat.format(startDate)} — ${dateFormat.format(endDate)}`;
}

export function formatCurrency(value: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const dayMs = 1000 * 60 * 60 * 24;
  const diffDays = Math.floor(diffMs / dayMs);

  if (diffDays <= 0) {
    return "today";
  }

  if (diffDays === 1) {
    return "1 day ago";
  }

  if (diffDays < 30) {
    return `${diffDays} days ago`;
  }

  const diffMonths = Math.floor(diffDays / 30);

  if (diffMonths === 1) {
    return "1 month ago";
  }

  if (diffMonths < 12) {
    return `${diffMonths} months ago`;
  }

  const diffYears = Math.floor(diffMonths / 12);
  return diffYears === 1 ? "1 year ago" : `${diffYears} years ago`;
}

export function humanizeEnum(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function calculateDurationDays(startDate: Date, endDate: Date): number {
  const dayMs = 1000 * 60 * 60 * 24;
  const diff = Math.ceil((endDate.getTime() - startDate.getTime()) / dayMs) + 1;
  return Math.max(1, diff);
}

export function inferLifecycleGroup(
  status: TripStatus,
  startDate: Date,
  endDate: Date,
  now: Date = new Date()
): LifecycleGroup {
  const nowTime = now.getTime();

  if (status === "COMPLETED" || status === "ARCHIVED" || endDate.getTime() < nowTime) {
    return "completed";
  }

  if (
    status === "ONGOING" ||
    (startDate.getTime() <= nowTime && endDate.getTime() >= nowTime)
  ) {
    return "ongoing";
  }

  return "upcoming";
}

type BookingInferenceInput = {
  stopCount: number;
  stopsWithTransport: number;
  estimatedSpend: number;
  actualSpend: number;
  receiptsCount: number;
};

export function inferBookingProgress({
  stopCount,
  stopsWithTransport,
  estimatedSpend,
  actualSpend,
  receiptsCount,
}: BookingInferenceInput): {
  score: number;
  label: BookingLabel;
  details: string;
} {
  if (stopCount === 0 && estimatedSpend === 0 && actualSpend === 0) {
    return {
      score: 0,
      label: "Not started",
      details: "Add your first destination stop to begin planning.",
    };
  }

  let score = 0;

  if (stopCount > 0) {
    score += 25;
    score += Math.round((stopsWithTransport / stopCount) * 35);
  }

  if (estimatedSpend > 0 || actualSpend > 0) {
    score += 20;
  }

  if (actualSpend > 0) {
    score += 15;
  }

  if (receiptsCount > 0) {
    score += 5;
  }

  score = Math.max(0, Math.min(100, score));

  if (score >= 85) {
    return {
      score,
      label: "Booked",
      details: "Everything looks well prepared for this trip.",
    };
  }

  if (score >= 65) {
    return {
      score,
      label: "Mostly booked",
      details: "Only a few remaining details left before departure.",
    };
  }

  if (score >= 40) {
    return {
      score,
      label: "Partially booked",
      details: "Core plans are in place—finish transport and bookings.",
    };
  }

  return {
    score,
    label: "Planning",
    details: "Great start—keep adding transport and booking details.",
  };
}

export function sortTrips(
  trips: TripViewModel[],
  sort: TripSortOption
): TripViewModel[] {
  const sorted = [...trips];

  sorted.sort((a, b) => {
    switch (sort) {
      case "start-asc": {
        return a.startDate.getTime() - b.startDate.getTime();
      }
      case "updated-desc": {
        return b.meta.updatedAt.getTime() - a.meta.updatedAt.getTime();
      }
      case "created-desc": {
        return b.meta.createdAt.getTime() - a.meta.createdAt.getTime();
      }
      case "budget-desc": {
        const budgetA = a.totalBudget ?? -1;
        const budgetB = b.totalBudget ?? -1;

        if (budgetA !== budgetB) {
          return budgetB - budgetA;
        }

        return b.meta.updatedAt.getTime() - a.meta.updatedAt.getTime();
      }
      default: {
        return a.startDate.getTime() - b.startDate.getTime();
      }
    }
  });

  return sorted;
}

export function groupTripsByLifecycle(
  trips: TripViewModel[]
): TripsGroupedByLifecycle {
  return trips.reduce<TripsGroupedByLifecycle>(
    (groups, trip) => {
      groups[trip.lifecycle].push(trip);
      return groups;
    },
    {
      ongoing: [],
      upcoming: [],
      completed: [],
    }
  );
}

export function resolveTripRole(
  ownerId: string,
  currentUserId: string,
  membershipRole: MemberRole | null | undefined
): MemberRole {
  if (ownerId === currentUserId) {
    return "OWNER";
  }

  return membershipRole ?? "VIEWER";
}
