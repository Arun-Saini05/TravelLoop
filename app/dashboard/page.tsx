import Image from 'next/image';
import Link from 'next/link';
import { logout } from '@/app/actions/auth';
import { requireSession } from '@/lib/session';
import { db } from '@/lib/db';
import styles from './Dashboard.module.css';

export default async function DashboardPage() {
  const session = await requireSession();

  // Fetch previous trips for the user
  const trips = await db.trip.findMany({
    where: { ownerId: session.userId },
    orderBy: { createdAt: 'desc' },
    take: 3,
  });

  // Fetch top destinations (cities) or use fallback if none exist yet
  const cities = await db.city.findMany({
    orderBy: { popularityScore: 'desc' },
    take: 5,
  });

  // Fallback regions if DB is empty (since they are populated on search)
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
    <div className={styles.page}>
      {/* Top Navbar */}
      <nav className={styles.navbar}>
        <Link href='/' className={styles.logo}>
          <svg
            className={styles.logoIcon}
            viewBox='0 0 32 32'
            fill='none'
            xmlns='http://www.w3.org/2000/svg'
          >
            <circle cx='16' cy='16' r='14' fill='url(#dashLogoGrad)' />
            <path
              d='M10 16C10 12.686 12.686 10 16 10C19.314 10 22 12.686 22 16'
              stroke='white'
              strokeWidth='2'
              strokeLinecap='round'
            />
            <path
              d='M8 16H24'
              stroke='white'
              strokeWidth='1.5'
              strokeLinecap='round'
            />
            <path
              d='M16 8V24'
              stroke='white'
              strokeWidth='1.5'
              strokeLinecap='round'
            />
            <ellipse
              cx='16'
              cy='16'
              rx='4'
              ry='8'
              stroke='white'
              strokeWidth='1.5'
            />
            <defs>
              <linearGradient id='dashLogoGrad' x1='0' y1='0' x2='32' y2='32'>
                <stop stopColor='#14b8a6' />
                <stop offset='1' stopColor='#06b6d4' />
              </linearGradient>
            </defs>
          </svg>
          <span className={styles.logoText}>Traveloop</span>
        </Link>

        <form action={logout}>
          <button
            type='submit'
            title='Logout'
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            <div className={styles.profileCircle}>{userInitial}</div>
          </button>
        </form>
      </nav>

      <main className={styles.container}>
        {/* Banner Image */}
        <div className={styles.banner}>
          <Image
            src='/images/hero-santorini.png'
            alt='Banner Image'
            fill
            className={styles.bannerImage}
            priority
          />
          <div className={styles.bannerOverlay}>
            <h1 className={styles.bannerText}>Banner Image</h1>
          </div>
        </div>

        {/* Controls Bar */}
        <div className={styles.controlsBar}>
          <div className={styles.searchContainer}>
            <input
              type='text'
              placeholder='Search destinations, trips...'
              className={styles.searchInput}
            />
          </div>
          <div className={styles.controlBtns}>
            <button className={styles.controlBtn}>Group by</button>
            <button className={styles.controlBtn}>Filter</button>
            <button className={styles.controlBtn}>Sort by...</button>
          </div>
        </div>

        {/* Top Regional Selections */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Top Regional Selections</h2>
            <div className={styles.sectionLine}></div>
          </div>

          <div className={styles.regionsGrid}>
            {regions.map((region) => (
              <div key={region.id} className={styles.regionCard}>
                <Image
                  src={region.image}
                  alt={region.name}
                  fill
                  className={styles.regionImage}
                />
                <div className={styles.regionOverlay}>
                  <span className={styles.regionName}>{region.name}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Previous Trips */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Previous Trips</h2>
            <div className={styles.sectionLine}></div>
          </div>

          {trips.length > 0 ? (
            <div className={styles.tripsGrid}>
              {trips.map((trip) => (
                <div key={trip.id} className={styles.tripCard}>
                  <div className={styles.tripImageContainer}>
                    {trip.coverPhotoUrl && (
                      <Image
                        src={trip.coverPhotoUrl}
                        alt={trip.name}
                        fill
                        style={{ objectFit: 'cover' }}
                      />
                    )}
                  </div>
                  <div className={styles.tripInfo}>
                    <h3 className={styles.tripTitle}>{trip.name}</h3>
                    <p className={styles.tripDates}>
                      {new Date(trip.startDate).toLocaleDateString()} -{' '}
                      {new Date(trip.endDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <p>
                You haven&apos;t planned any trips yet. Start your journey
                today!
              </p>
            </div>
          )}
        </section>
      </main>

      {/* Floating Action Button */}
      <div className={styles.fabContainer}>
        <Link href='/trips/new' className={styles.fab}>
          <svg
            width='20'
            height='20'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2.5'
            strokeLinecap='round'
            strokeLinejoin='round'
          >
            <line x1='12' y1='5' x2='12' y2='19'></line>
            <line x1='5' y1='12' x2='19' y2='12'></line>
          </svg>
          Plan a trip
        </Link>
      </div>
    </div>
  );
}
