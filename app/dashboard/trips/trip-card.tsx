import Link from "next/link";
import type { TripStatus } from "@/app/generated/prisma/client";
import type { TripViewModel } from "@/app/dashboard/trips/types";
import {
  formatCurrency,
  formatRelativeDate,
  humanizeEnum,
} from "@/app/dashboard/trips/utils";
import { Badge, buttonClasses, type BadgeTone } from "@/components/ui";

type TripCardProps = {
  trip: TripViewModel;
};

const STATUS_TONE: Record<TripStatus, BadgeTone> = {
  DRAFT: "neutral",
  PLANNED: "info",
  ONGOING: "brand",
  COMPLETED: "success",
  ARCHIVED: "neutral",
};

const ROLE_TONE: Record<TripViewModel["role"], BadgeTone> = {
  OWNER: "warn",
  EDITOR: "info",
  VIEWER: "neutral",
};

const VISIBILITY_TONE: Record<TripViewModel["visibility"], BadgeTone> = {
  PUBLIC: "success",
  FRIENDS: "info",
  PRIVATE: "neutral",
};

export function TripCard({ trip }: TripCardProps) {
  const budgetProgress = Math.min(100, Math.max(0, trip.budgetUsedPercent ?? 0));
  const bookingProgress = Math.min(100, Math.max(0, trip.booking.score));

  const coverStyle = trip.coverPhotoUrl
    ? {
        backgroundImage: `linear-gradient(to top, rgba(15, 23, 42, 0.7), rgba(15, 23, 42, 0.25)), url(${trip.coverPhotoUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : {
        backgroundImage:
          "linear-gradient(135deg, rgba(15, 118, 110, 0.95), rgba(8, 145, 178, 0.95))",
      };

  return (
    <article
      id={`trip-${trip.id}`}
      className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-teal-500 hover:shadow-md focus-within:ring-4 focus-within:ring-teal-500/20"
    >
      <div className="h-28 w-full" style={coverStyle} aria-hidden="true" />

      <div className="p-4 sm:p-5">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold tracking-tight text-zinc-900">
              <Link
                href={`/trips/${trip.id}`}
                className="rounded-sm outline-hidden hover:text-teal-700"
              >
                {trip.name}
              </Link>
            </h3>
            <p className="mt-1 text-sm text-zinc-600">{trip.destinationSummary}</p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            <Badge tone={STATUS_TONE[trip.status]} size="sm">
              {humanizeEnum(trip.status)}
            </Badge>
            <Badge tone={ROLE_TONE[trip.role]} size="sm">
              {humanizeEnum(trip.role)}
            </Badge>
          </div>
        </header>

        {trip.description ? (
          <p className="mt-3 text-sm text-zinc-700">{trip.description}</p>
        ) : (
          <p className="mt-3 text-sm text-zinc-500">No description added yet.</p>
        )}

        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
              Dates
            </dt>
            <dd className="mt-1 text-zinc-900">{trip.dateLabel}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
              Duration
            </dt>
            <dd className="mt-1 text-zinc-900">{trip.durationDays} days</dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
              Stops
            </dt>
            <dd className="mt-1 text-zinc-900">{trip.stopCount}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
              Visibility
            </dt>
            <dd className="mt-1">
              <Badge tone={VISIBILITY_TONE[trip.visibility]} size="xs">
                {humanizeEnum(trip.visibility)}
              </Badge>
            </dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
              Collaborators
            </dt>
            <dd className="mt-1 text-zinc-900">{trip.meta.memberCount}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
              Updated
            </dt>
            <dd className="mt-1 text-zinc-900">
              {formatRelativeDate(trip.meta.updatedAt)}
            </dd>
          </div>
        </dl>

        <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-3">
          <div className="flex items-center justify-between gap-3 text-sm">
            <p className="font-medium text-zinc-800">Booking progress</p>
            <p className="font-semibold text-zinc-900">{trip.booking.label}</p>
          </div>
          <div
            className="mt-2 h-2.5 overflow-hidden rounded-full bg-zinc-200"
            role="progressbar"
            aria-label={`Booking progress for ${trip.name}`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={bookingProgress}
          >
            <div
              className="h-full rounded-full bg-linear-to-r from-teal-600 to-cyan-600"
              style={{ width: `${bookingProgress}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-zinc-600">{trip.booking.details}</p>
        </div>

        <div className="mt-4 rounded-xl border border-zinc-200 p-3">
          <div className="flex items-center justify-between gap-3 text-sm">
            <p className="font-medium text-zinc-800">Budget overview</p>
            <p className="font-semibold text-zinc-900">
              {trip.totalBudget
                ? `${Math.round(budgetProgress)}% used`
                : "No total budget set"}
            </p>
          </div>

          <div
            className="mt-2 h-2.5 overflow-hidden rounded-full bg-zinc-200"
            role="progressbar"
            aria-label={`Budget usage for ${trip.name}`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(budgetProgress)}
          >
            <div
              className="h-full rounded-full bg-amber-500"
              style={{ width: `${budgetProgress}%` }}
            />
          </div>

          <dl className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                Total budget
              </dt>
              <dd className="mt-1 text-zinc-900">
                {trip.totalBudget
                  ? formatCurrency(trip.totalBudget, trip.currency)
                  : "Not set"}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                Estimated spend
              </dt>
              <dd className="mt-1 text-zinc-900">
                {formatCurrency(trip.estimatedSpend, trip.currency)}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                Actual booked spend
              </dt>
              <dd className="mt-1 text-zinc-900">
                {formatCurrency(trip.actualSpend, trip.currency)}
              </dd>
            </div>
          </dl>
        </div>

        <footer className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            <Badge tone="neutral" size="xs">
              Notes: {trip.meta.notesCount}
            </Badge>
            <Badge tone="neutral" size="xs">
              Share: {trip.meta.shareLinkCount}
            </Badge>
            <Badge tone="neutral" size="xs">
              Copies: {trip.meta.copyCount}
            </Badge>
          </div>

          <Link
            href={`/trips/${trip.id}`}
            className={buttonClasses({ variant: "primary", size: "sm" })}
          >
            Open trip →
          </Link>
        </footer>
      </div>
    </article>
  );
}
