import type {
  MemberRole,
  TripStatus,
  TripVisibility,
} from "@/app/generated/prisma/client";

export type TripRoleFilter = "all" | "owner" | "editor" | "viewer";

export type TripSortOption =
  | "start-asc"
  | "updated-desc"
  | "created-desc"
  | "budget-desc";

export type LifecycleGroup = "ongoing" | "upcoming" | "completed";

export type BookingLabel =
  | "Not started"
  | "Planning"
  | "Partially booked"
  | "Mostly booked"
  | "Booked";

export type TripsQueryState = {
  q: string;
  status: "all" | TripStatus;
  role: TripRoleFilter;
  visibility: "all" | TripVisibility;
  sort: TripSortOption;
  hasActiveFilters: boolean;
};

export type TripViewModel = {
  id: string;
  name: string;
  description: string | null;
  coverPhotoUrl: string | null;
  status: TripStatus;
  visibility: TripVisibility;
  role: MemberRole;
  lifecycle: LifecycleGroup;
  destinationSummary: string;
  destinationPreview: string[];
  stopCount: number;
  countrySummary: string;
  startDate: Date;
  endDate: Date;
  dateLabel: string;
  durationDays: number;
  currency: string;
  totalBudget: number | null;
  estimatedSpend: number;
  actualSpend: number;
  budgetUsedPercent: number | null;
  booking: {
    score: number;
    label: BookingLabel;
    details: string;
  };
  meta: {
    updatedAt: Date;
    createdAt: Date;
    copyCount: number;
    notesCount: number;
    shareLinkCount: number;
    memberCount: number;
  };
};

export type TripsGroupedByLifecycle = Record<LifecycleGroup, TripViewModel[]>;
