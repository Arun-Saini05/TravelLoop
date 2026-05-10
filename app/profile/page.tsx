import type { CSSProperties } from 'react';
import Link from 'next/link';
import type { TripStatus } from '@/app/generated/prisma/client';
import { UserMenu } from '@/app/dashboard/user-menu';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/session';
import styles from './Profile.module.css';

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function formatDateRange(startDate: Date, endDate: Date): string {
  return `${formatDate(startDate)} — ${formatDate(endDate)}`;
}

function toStatusLabel(status: TripStatus): string {
  return status
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function getDurationDays(startDate: Date, endDate: Date): number {
  const dayMs = 1000 * 60 * 60 * 24;
  return Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / dayMs) + 1);
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
    return 'No destination added yet';
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
  if (trip.status === 'COMPLETED' || trip.status === 'ARCHIVED') {
    return false;
  }

  if (trip.status === 'DRAFT' || trip.status === 'PLANNED' || trip.status === 'ONGOING') {
    return true;
  }

  return trip.endDate.getTime() >= now.getTime();
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
          orderBy: {
            sortOrder: 'asc',
          },
          select: {
            city: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    }),
  ]);

  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || session.username;
  const userEmail = user?.email ?? session.email;
  const avatarInitial = displayName.charAt(0).toUpperCase() || 'U';
  const memberSince = formatDate(user?.createdAt ?? now);

  const preplannedTrips = ownedTrips
    .filter((trip) => isPreplannedTrip(trip, now))
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

  const previousTrips = ownedTrips
    .filter((trip) => !isPreplannedTrip(trip, now))
    .sort((a, b) => b.endDate.getTime() - a.endDate.getTime());

  return (
    <div className={styles.page}>
      <nav className={styles.navbar}>
        <Link href='/' className={styles.logo}>
          <svg
            className={styles.logoIcon}
            viewBox='0 0 32 32'
            fill='none'
            xmlns='http://www.w3.org/2000/svg'
            aria-hidden='true'
          >
            <circle cx='16' cy='16' r='14' fill='url(#profileLogoGrad)' />
            <path
              d='M10 16C10 12.686 12.686 10 16 10C19.314 10 22 12.686 22 16'
              stroke='white'
              strokeWidth='2'
              strokeLinecap='round'
            />
            <path d='M8 16H24' stroke='white' strokeWidth='1.5' strokeLinecap='round' />
            <path d='M16 8V24' stroke='white' strokeWidth='1.5' strokeLinecap='round' />
            <ellipse cx='16' cy='16' rx='4' ry='8' stroke='white' strokeWidth='1.5' />
            <defs>
              <linearGradient id='profileLogoGrad' x1='0' y1='0' x2='32' y2='32'>
                <stop stopColor='#14b8a6' />
                <stop offset='1' stopColor='#06b6d4' />
              </linearGradient>
            </defs>
          </svg>
          <span className={styles.logoText}>Traveloop</span>
        </Link>

        <UserMenu userInitial={avatarInitial} username={session.username} />
      </nav>

      <main className={styles.container}>
        <section className={styles.profileCard} aria-labelledby='profile-overview-title'>
          <header className={styles.profileCardHeader}>
            <div>
              <p className={styles.profileEyebrow}>User profile</p>
              <h1 id='profile-overview-title' className={styles.profileHeading}>
                {displayName}
              </h1>
              <p className={styles.profileSubtext}>
                Manage your details and quickly jump into planned adventures.
              </p>
            </div>

            <Link href='/dashboard' className={styles.actionBtnGhost}>
              Back to Dashboard
            </Link>
          </header>

          <div className={styles.profileLayout}>
            <div className={styles.avatarWrap}>
              {user?.profilePhotoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.profilePhotoUrl}
                  alt={`${displayName} profile photo`}
                  className={styles.avatarImage}
                />
              ) : (
                <span className={styles.avatarFallback} aria-hidden='true'>
                  {avatarInitial}
                </span>
              )}
            </div>

            <div className={styles.detailsPanel}>
              <h2 className={styles.detailsHeading}>User details</h2>
              <p className={styles.detailsDescription}>
                Keep your account details up to date and continue planning with confidence.
              </p>

              <dl className={styles.detailGrid}>
                <div className={styles.detailItem}>
                  <dt className={styles.detailLabel}>Display name</dt>
                  <dd className={styles.detailValue}>{displayName}</dd>
                </div>
                <div className={styles.detailItem}>
                  <dt className={styles.detailLabel}>Username</dt>
                  <dd className={styles.detailValue}>{session.username}</dd>
                </div>
                <div className={styles.detailItem}>
                  <dt className={styles.detailLabel}>Email</dt>
                  <dd className={styles.detailValue}>{userEmail}</dd>
                </div>
                <div className={styles.detailItem}>
                  <dt className={styles.detailLabel}>Member since</dt>
                  <dd className={styles.detailValue}>{memberSince}</dd>
                </div>
              </dl>

              <div className={styles.actionsRow}>
                <Link href='/dashboard/trips' className={styles.actionBtnPrimary}>
                  My Trips
                </Link>
                <Link href='/trips/new' className={styles.actionBtnSecondary}>
                  Plan a Trip
                </Link>
                <button
                  type='button'
                  className={styles.actionBtnGhost}
                  aria-disabled='true'
                  disabled
                  title='Profile editing will be available soon'
                >
                  Edit Details (Soon)
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.section} aria-labelledby='preplanned-trips-title'>
          <div className={styles.sectionHeader}>
            <h2 id='preplanned-trips-title' className={styles.sectionTitle}>
              Preplanned Trips
            </h2>
            <div className={styles.sectionLine}></div>
          </div>

          {preplannedTrips.length > 0 ? (
            <div className={styles.tripGrid}>
              {preplannedTrips.map((trip) => {
                const coverStyle: CSSProperties | undefined = trip.coverPhotoUrl
                  ? {
                      backgroundImage: `linear-gradient(to top, rgba(15, 23, 42, 0.6), rgba(15, 23, 42, 0.2)), url(${trip.coverPhotoUrl})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }
                  : undefined;

                return (
                  <article key={trip.id} className={styles.tripCard}>
                    <div className={styles.tripCover} style={coverStyle}>
                      <span className={styles.tripCoverBadge} data-status={trip.status}>
                        {toStatusLabel(trip.status)}
                      </span>
                    </div>
                    <div className={styles.tripBody}>
                      <h3 className={styles.tripName}>{trip.name}</h3>
                      <p className={styles.tripMeta}>{getDestinationSummary(trip.stops)}</p>
                      <p className={styles.tripMeta}>
                        {formatDateRange(trip.startDate, trip.endDate)} ·{' '}
                        {getDurationDays(trip.startDate, trip.endDate)} days
                      </p>
                      <div className={styles.tripFooter}>
                        <Link href={`/dashboard/trips/${trip.id}`} className={styles.viewBtn}>
                          View
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className={styles.emptyState}>
              No upcoming or active trips yet. Start planning your next journey.
            </div>
          )}
        </section>

        <section className={styles.section} aria-labelledby='previous-trips-title'>
          <div className={styles.sectionHeader}>
            <h2 id='previous-trips-title' className={styles.sectionTitle}>
              Previous Trips
            </h2>
            <div className={styles.sectionLine}></div>
          </div>

          {previousTrips.length > 0 ? (
            <div className={styles.tripGrid}>
              {previousTrips.map((trip) => {
                const coverStyle: CSSProperties | undefined = trip.coverPhotoUrl
                  ? {
                      backgroundImage: `linear-gradient(to top, rgba(15, 23, 42, 0.6), rgba(15, 23, 42, 0.2)), url(${trip.coverPhotoUrl})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }
                  : undefined;

                return (
                  <article key={trip.id} className={styles.tripCard}>
                    <div className={styles.tripCover} style={coverStyle}>
                      <span className={styles.tripCoverBadge} data-status={trip.status}>
                        {toStatusLabel(trip.status)}
                      </span>
                    </div>
                    <div className={styles.tripBody}>
                      <h3 className={styles.tripName}>{trip.name}</h3>
                      <p className={styles.tripMeta}>{getDestinationSummary(trip.stops)}</p>
                      <p className={styles.tripMeta}>
                        {formatDateRange(trip.startDate, trip.endDate)} ·{' '}
                        {getDurationDays(trip.startDate, trip.endDate)} days
                      </p>
                      <div className={styles.tripFooter}>
                        <Link href={`/dashboard/trips/${trip.id}`} className={styles.viewBtn}>
                          View
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className={styles.emptyState}>
              Your completed and archived trips will appear here once you finish one.
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
