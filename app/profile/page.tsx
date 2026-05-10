import Link from 'next/link';
import { requireSession } from '@/lib/session';

export default async function ProfilePage() {
  const session = await requireSession();

  return (
    <main className='min-h-screen bg-zinc-100 px-4 py-10 sm:px-6'>
      <section className='mx-auto w-full max-w-2xl rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm'>
        <p className='text-sm font-medium text-teal-700'>Profile</p>
        <h1 className='mt-2 text-2xl font-semibold text-zinc-900'>
          {session.username}
        </h1>
        <p className='mt-2 text-sm text-zinc-600'>
          Signed in as {session.email}
        </p>

        <p className='mt-4 text-sm text-zinc-700'>
          Profile settings screen will be added here.
        </p>

        <div className='mt-6'>
          <Link
            href='/dashboard'
            className='inline-flex items-center rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50'
          >
            Back to Dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}
