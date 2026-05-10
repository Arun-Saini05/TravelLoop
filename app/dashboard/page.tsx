import Image from 'next/image';
import Link from 'next/link';
import { requireSession } from '@/lib/session';
import { db } from '@/lib/db';
import { UserMenu } from './user-menu';
import {
  AppHeader,
  Badge,
  buttonClasses,
  Card,
  EmptyState,
  FloatingActionBar,
  PageContainer,
  Section,
} from '@/components/ui';

export default async function DashboardPage() {
  const session = await requireSession();

  const trips = await db.trip.findMany({
    where: { ownerId: session.userId },
    orderBy: { createdAt: 'desc' },
    take: 3,
  });

  const cities = await db.city.findMany({
    orderBy: { popularityScore: 'desc' },
    take: 5,
  });

  const regions =
    cities.length > 0
      ? cities.map((c) => ({
          id: c.id,
          name: c.name,
          image: c.photoRef || '/images/dest-bali.png',
        }))
      : [
          { id: '1', name: 'Bali', image: '/images/dest-bali.png' },
          { id: '2', name: 'Kyoto', image: '/images/dest-kyoto.png' },
          { id: '3', name: 'Paris', image: '/images/dest-paris.png' },
          { id: '4', name: 'Swiss Alps', image: '/images/dest-swiss-alps.png' },
          { id: '5', name: 'Maldives', image: '/images/dest-maldives.png' },
        ];

  const userInitial = session.username
    ? session.username.charAt(0).toUpperCase()
    : 'U';

  return (
    <main className="min-h-screen bg-app pb-28 sm:pb-32">
      <AppHeader
        width="wide"
        actions={
          <>
            <Link
              href="/dashboard/trips"
              className={buttonClasses({ variant: 'ghost', size: 'sm' })}
            >
              My Trips
            </Link>
            <Link
              href="/profile"
              className={buttonClasses({ variant: 'ghost', size: 'sm' })}
            >
              Profile
            </Link>
            <UserMenu userInitial={userInitial} username={session.username} />
          </>
        }
      />

      <PageContainer width="wide">
        {/* Hero banner */}
        <section className="relative mb-8 overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-900 shadow-sm">
          <div className="relative h-56 w-full sm:h-72">
            <Image
              src="/images/hero-santorini.png"
              alt="Discover the world"
              fill
              priority
              className="object-cover opacity-90"
            />
            <div className="absolute inset-0 bg-linear-to-tr from-black/70 via-black/30 to-transparent" />
          </div>
          <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-10">
            <Badge tone="brand" size="sm" className="w-fit bg-white/15 text-white ring-white/20 backdrop-blur">
              Welcome back
            </Badge>
            <h1 className="mt-3 max-w-2xl text-2xl font-bold leading-tight tracking-tight text-white sm:text-4xl">
              Where to next, {session.username}?
            </h1>
            <p className="mt-2 max-w-xl text-sm text-white/85 sm:text-base">
              Pick a destination, build a stop-by-stop itinerary, and keep every detail in one place.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                href="/trips/new"
                className={buttonClasses({ variant: 'brand', size: 'lg' })}
              >
                + Plan a new trip
              </Link>
              <Link
                href="/dashboard/trips"
                className={buttonClasses({
                  variant: 'secondary',
                  size: 'lg',
                  className:
                    'bg-white/10 text-white border-white/30 hover:bg-white/20 hover:border-white/50',
                })}
              >
                View my trips
              </Link>
            </div>
          </div>
        </section>

        {/* Top regional selections */}
        <Section
          eyebrow="Inspiration"
          title="Top regional selections"
          description="Trending cities to spark your next itinerary."
          className="mb-10"
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {regions.map((region) => (
              <div
                key={region.id}
                className="group relative aspect-[3/4] overflow-hidden rounded-2xl border border-zinc-200 shadow-sm"
              >
                <Image
                  src={region.image}
                  alt={region.name}
                  fill
                  className="object-cover transition group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-3">
                  <p className="text-sm font-semibold text-white">{region.name}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Recent trips */}
        <Section
          eyebrow="Your plans"
          title="Recent trips"
          description="Pick up where you left off."
          action={
            <Link
              href="/dashboard/trips"
              className={buttonClasses({ variant: 'ghost', size: 'sm' })}
            >
              See all →
            </Link>
          }
        >
          {trips.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {trips.map((trip) => {
                const coverStyle = trip.coverPhotoUrl
                  ? {
                      backgroundImage: `linear-gradient(to top, rgba(15,23,42,0.6), rgba(15,23,42,0.15)), url(${trip.coverPhotoUrl})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }
                  : {
                      backgroundImage:
                        'linear-gradient(135deg,#0f766e 0%,#14b8a6 60%,#06b6d4 100%)',
                    };
                return (
                  <Link
                    key={trip.id}
                    href={`/trips/${trip.id}`}
                    className="group block overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-teal-500 hover:shadow-md"
                  >
                    <div className="h-32 w-full" style={coverStyle} aria-hidden />
                    <div className="p-4">
                      <p className="truncate text-sm font-semibold text-zinc-900 group-hover:text-teal-700">
                        {trip.name}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">
                        {new Date(trip.startDate).toLocaleDateString()} →{' '}
                        {new Date(trip.endDate).toLocaleDateString()}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon="🧭"
              title="No trips yet"
              description="Start your journey today — plan a trip in under a minute."
              action={
                <Link
                  href="/trips/new"
                  className={buttonClasses({ variant: 'brand', size: 'md' })}
                >
                  + Plan a trip
                </Link>
              }
            />
          )}
        </Section>
      </PageContainer>

      {/* Floating CTA */}
      <FloatingActionBar>
        <Link
          href="/trips/new"
          className={buttonClasses({ variant: 'primary', size: 'md' })}
        >
          + Plan a trip
        </Link>
        <Link
          href="/dashboard/trips"
          className={buttonClasses({ variant: 'ghost', size: 'md' })}
        >
          My trips
        </Link>
      </FloatingActionBar>
    </main>
  );
}
