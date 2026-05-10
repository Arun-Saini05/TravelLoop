import type { CSSProperties } from "react";
import Link from "next/link";
import type { TripStatus } from "@/app/generated/prisma/client";
import { UserMenu } from "@/app/dashboard/user-menu";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import {
  AppHeader,
  Badge,
  Button,
  buttonClasses,
  Card,
  EmptyState,
  PageContainer,
  Section,
  type BadgeTone,
} from "@/components/ui";
import { PhotoUpload } from './photo-upload';
import { EditProfileModal } from './edit-profile-modal';
import styles from './Profile.module.css';

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatDateRange(startDate: Date, endDate: Date): string {
  return `${formatDate(startDate)} — ${formatDate(endDate)}`;
}

function toStatusLabel(status: TripStatus): string {
  return status
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

const STATUS_TONE: Record<TripStatus, BadgeTone> = {
  DRAFT: "neutral",
  PLANNED: "info",
  ONGOING: "brand",
  COMPLETED: "success",
  ARCHIVED: "neutral",
};

function getDurationDays(startDate: Date, endDate: Date): number {
  const dayMs = 1000 * 60 * 60 * 24;
  return Math.max(
    1,
    Math.ceil((endDate.getTime() - startDate.getTime()) / dayMs) + 1
  );
}

function getDestinationSummary(
  stops: {
    city: {
      name: string;
    };
  }[]
): string {
  const uniqueCities = Array.from(new Set(stops.map((stop) => stop.city.name)));

  if (uniqueCities.length === 0) {
    return "No destination added yet";
  }

  if (uniqueCities.length === 1) {
    return uniqueCities[0];
  }

  if (uniqueCities.length === 2) {
    return `${uniqueCities[0]} & ${uniqueCities[1]}`;
  }

  return `${uniqueCities[0]}, ${uniqueCities[1]} +${uniqueCities.length - 2} more`;
}

function isPreplannedTrip(
  trip: {
    status: TripStatus;
    endDate: Date;
  },
  now: Date
): boolean {
  if (trip.status === "COMPLETED" || trip.status === "ARCHIVED") {
    return false;
  }

  if (trip.status === "DRAFT" || trip.status === "PLANNED" || trip.status === "ONGOING") {
    return true;
  }

  return trip.endDate.getTime() >= now.getTime();
}

type TripCardData = {
  id: string;
  name: string;
  status: TripStatus;
  startDate: Date;
  endDate: Date;
  coverPhotoUrl: string | null;
  stops: {
    city: { name: string };
  }[];
};

function TripGridCard({ trip }: { trip: TripCardData }) {
  const coverStyle: CSSProperties | undefined = trip.coverPhotoUrl
    ? {
        backgroundImage: `linear-gradient(to top, rgba(15, 23, 42, 0.65), rgba(15, 23, 42, 0.15)), url(${trip.coverPhotoUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : {
        backgroundImage:
          "linear-gradient(135deg, rgba(15, 118, 110, 0.85) 0%, rgba(20, 184, 166, 0.85) 100%)",
      };

  return (
    <Card padded={false} className="overflow-hidden">
      <div
        className="relative flex h-32 items-end justify-start p-3"
        style={coverStyle}
      >
        <Badge tone={STATUS_TONE[trip.status]} size="sm">
          {toStatusLabel(trip.status)}
        </Badge>
      </div>
      <div className="flex flex-col gap-1 p-4">
        <h3 className="text-sm font-semibold tracking-tight text-zinc-900">
          {trip.name}
        </h3>
        <p className="text-xs text-zinc-500">{getDestinationSummary(trip.stops)}</p>
        <p className="text-xs text-zinc-500">
          {formatDateRange(trip.startDate, trip.endDate)} ·{" "}
          {getDurationDays(trip.startDate, trip.endDate)} days
        </p>
        <div className="mt-3">
          <Link
            href={`/trips/${trip.id}`}
            className={buttonClasses({ variant: "primary", size: "sm" })}
          >
            View →
          </Link>
        </div>
      </div>
    </Card>
  );
}

export default async function ProfilePage() {
  const session = await requireSession();
  const now = new Date();

  const [user, ownedTrips] = await Promise.all([
    db.user.findUnique({
      where: { id: session.userId },
      select: {
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        profilePhotoUrl: true,
        createdAt: true,
      },
    }),
    db.trip.findMany({
      where: { ownerId: session.userId },
      select: {
        id: true,
        name: true,
        status: true,
        startDate: true,
        endDate: true,
        coverPhotoUrl: true,
        stops: {
          orderBy: { sortOrder: "asc" },
          select: {
            city: {
              select: { name: true },
            },
          },
        },
      },
    }),
  ]);

  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") || session.username;
  const userEmail = user?.email ?? session.email;
  const avatarInitial = displayName.charAt(0).toUpperCase() || "U";
  const memberSince = formatDate(user?.createdAt ?? now);

  const preplannedTrips = ownedTrips
    .filter((trip) => isPreplannedTrip(trip, now))
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

  const previousTrips = ownedTrips
    .filter((trip) => !isPreplannedTrip(trip, now))
    .sort((a, b) => b.endDate.getTime() - a.endDate.getTime());

  return (
    <main className="min-h-screen bg-app">
      <AppHeader
        width="default"
        crumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Profile" }]}
        actions={<UserMenu userInitial={avatarInitial} username={session.username} />}
      />

      <PageContainer width="default">
        <Card padded className="mb-6 sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-teal-700">
                User profile
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
                {displayName}
              </h1>
              <p className="mt-1 max-w-md text-sm text-zinc-500">
                Manage your details and quickly jump into planned adventures.
              </p>
            </div>
            <Link
              href="/dashboard"
              className={buttonClasses({ variant: "secondary", size: "sm" })}
            >
              ← Back to Dashboard
            </Link>
          </div>

          <div className={styles.profileLayout}>
            <PhotoUpload
              currentPhotoUrl={user?.profilePhotoUrl}
              displayName={displayName}
              avatarInitial={avatarInitial}
            />

            <div>
              <h2 className="text-sm font-semibold tracking-tight text-zinc-900">
                User details
              </h2>
              <p className="mt-1 text-xs text-zinc-500">
                Keep your account details up to date and continue planning with confidence.
              </p>

              <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
                    Display name
                  </dt>
                  <dd className="mt-0.5 text-sm font-medium text-zinc-900">
                    {displayName}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
                    Username
                  </dt>
                  <dd className="mt-0.5 text-sm font-medium text-zinc-900">
                    {session.username}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
                    Email
                  </dt>
                  <dd className="mt-0.5 text-sm font-medium text-zinc-900">
                    {userEmail}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
                    Member since
                  </dt>
                  <dd className="mt-0.5 text-sm font-medium text-zinc-900">
                    {memberSince}
                  </dd>
                </div>
              </dl>

              <div className="mt-5 flex flex-wrap items-center gap-2">
                <Link
                  href="/dashboard/trips"
                  className={buttonClasses({ variant: "primary", size: "sm" })}
                >
                  My Trips
                </Link>
                <Link
                  href="/trips/new"
                  className={buttonClasses({ variant: "brand", size: "sm" })}
                >
                  + Plan a Trip
                </Link>
                <EditProfileModal 
                  initialFirstName={user?.firstName || null} 
                  initialLastName={user?.lastName || null} 
                  initialEmail={userEmail}
                  triggerClassName={styles.actionBtnGhost}
                />
              </div>
            </div>
          </div>
          </div>
        </Card>

        <Section
          eyebrow="Upcoming"
          title="Preplanned trips"
          description="Trips you're actively planning or have coming up."
          className="mb-8"
        >
          {preplannedTrips.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {preplannedTrips.map((trip) => (
                <TripGridCard key={trip.id} trip={trip} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon="🧳"
              title="No upcoming trips yet"
              description="Start planning your next journey."
            >
              <Link
                href="/trips/new"
                className={buttonClasses({ variant: "brand", size: "sm" })}
              >
                + Plan a trip
              </Link>
            </EmptyState>
          )}
        </Section>

        <Section
          eyebrow="Memories"
          title="Previous trips"
          description="Trips you've finished — relive the highlights."
        >
          {previousTrips.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {previousTrips.map((trip) => (
                <TripGridCard key={trip.id} trip={trip} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon="📸"
              title="No completed trips yet"
              description="Your completed and archived trips will appear here once you finish one."
            />
          )}
        </Section>
      </PageContainer>
    </main>
  );
}
