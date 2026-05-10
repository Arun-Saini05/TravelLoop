import Link from "next/link";
import type { TripStatus } from "@/app/generated/prisma/client";
import type { TripViewModel } from "@/app/dashboard/trips/types";
import {
  formatCurrency,
  formatRelativeDate,
  humanizeEnum,
} from "@/app/dashboard/trips/utils";

type TripCardProps = {
  trip: TripViewModel;
};

const statusBadgeStyles: Record<TripStatus, string> = {
  DRAFT: "bg-zinc-100 text-zinc-700",
  PLANNED: "bg-sky-100 text-sky-800",
  ONGOING: "bg-teal-100 text-teal-800",
  COMPLETED: "bg-emerald-100 text-emerald-800",
  ARCHIVED: "bg-zinc-200 text-zinc-700",
};

function roleBadgeClass(role: TripViewModel["role"]): string {
  if (role === "OWNER") return "bg-amber-100 text-amber-900";
  if (role === "EDITOR") return "bg-indigo-100 text-indigo-800";
  return "bg-purple-100 text-purple-800";
}

function visibilityBadgeClass(visibility: TripViewModel["visibility"]): string {
  if (visibility === "PUBLIC") return "bg-emerald-100 text-emerald-800";
  if (visibility === "FRIENDS") return "bg-blue-100 text-blue-800";
  return "bg-zinc-100 text-zinc-700";
}

export function TripCard({ trip }: TripCardProps) {
  const budgetProgress = Math.min(100, Math.max(0, trip.budgetUsedPercent ?? 0));
  const bookingProgress = Math.min(100, Math.max(0, trip.booking.score));

  const coverStyle = trip.coverPhotoUrl
    ? {
        backgroundImage: `linear-gradient(to top, rgba(24, 24, 27, 0.7), rgba(24, 24, 27, 0.25)), url(${trip.coverPhotoUrl})`,
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
      className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:shadow-md focus-within:ring-2 focus-within:ring-teal-700 focus-within:ring-offset-2"
    >
      <div className="h-28 w-full" style={coverStyle} aria-hidden="true" />

      <div className="p-4 sm:p-5">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-zinc-900">
              <Link
                href={`/dashboard/trips/${trip.id}`}
                className="rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2"
              >
                {trip.name}
              </Link>
            </h3>
            <p className="mt-1 text-sm text-zinc-600">{trip.destinationSummary}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadgeStyles[trip.status]}`}
            >
              {humanizeEnum(trip.status)}
            </span>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${roleBadgeClass(trip.role)}`}
            >
              {humanizeEnum(trip.role)}
            </span>
          </div>
        </header>

        {trip.description ? (
          <p className="mt-3 text-sm text-zinc-700">{trip.description}</p>
        ) : (
          <p className="mt-3 text-sm text-zinc-500">No description added yet.</p>
        )}

        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="font-medium text-zinc-500">Dates</dt>
            <dd className="mt-1 text-zinc-900">{trip.dateLabel}</dd>
          </div>
          <div>
            <dt className="font-medium text-zinc-500">Duration</dt>
            <dd className="mt-1 text-zinc-900">{trip.durationDays} days</dd>
          </div>
          <div>
            <dt className="font-medium text-zinc-500">Stops</dt>
            <dd className="mt-1 text-zinc-900">{trip.stopCount}</dd>
          </div>
          <div>
            <dt className="font-medium text-zinc-500">Visibility</dt>
            <dd className="mt-1">
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${visibilityBadgeClass(trip.visibility)}`}
              >
                {humanizeEnum(trip.visibility)}
              </span>
            </dd>
          </div>
          <div>
            <dt className="font-medium text-zinc-500">Collaborators</dt>
            <dd className="mt-1 text-zinc-900">{trip.meta.memberCount}</dd>
          </div>
          <div>
            <dt className="font-medium text-zinc-500">Updated</dt>
            <dd className="mt-1 text-zinc-900">{formatRelativeDate(trip.meta.updatedAt)}</dd>
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
              className="h-full rounded-full bg-gradient-to-r from-teal-600 to-cyan-600"
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
              <dt className="font-medium text-zinc-500">Total budget</dt>
              <dd className="mt-1 text-zinc-900">
                {trip.totalBudget
                  ? formatCurrency(trip.totalBudget, trip.currency)
                  : "Not set"}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-500">Estimated spend</dt>
              <dd className="mt-1 text-zinc-900">
                {formatCurrency(trip.estimatedSpend, trip.currency)}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-500">Actual booked spend</dt>
              <dd className="mt-1 text-zinc-900">
                {formatCurrency(trip.actualSpend, trip.currency)}
              </dd>
            </div>
          </dl>
        </div>

        <footer className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2 text-xs text-zinc-600">
            <span className="rounded-full bg-zinc-100 px-2.5 py-1">
              Notes: {trip.meta.notesCount}
            </span>
            <span className="rounded-full bg-zinc-100 px-2.5 py-1">
              Share links: {trip.meta.shareLinkCount}
            </span>
            <span className="rounded-full bg-zinc-100 px-2.5 py-1">
              Copies: {trip.meta.copyCount}
            </span>
          </div>

          <Link
            href={`/dashboard/trips/${trip.id}`}
            className="inline-flex items-center rounded-md bg-zinc-900 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2"
          >
            Open Trip
          </Link>
        </footer>
      </div>
    </article>
  );
}
