'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { logout } from '@/app/actions/auth';

type UserMenuProps = {
  userInitial: string;
  username: string;
};

export function UserMenu({ userInitial, username }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={`Open account menu for ${username}`}
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-[linear-gradient(135deg,#0f766e_0%,#14b8a6_100%)] text-sm font-semibold text-white shadow-sm outline-hidden transition hover:brightness-110 focus-visible:ring-4 focus-visible:ring-teal-500/30"
      >
        {userInitial}
      </button>

      {isOpen ? (
        <div
          role="menu"
          aria-label="Account menu"
          className="absolute right-0 top-12 w-48 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg ring-1 ring-black/5"
        >
          <div className="border-b border-zinc-100 px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
              Signed in as
            </p>
            <p className="truncate text-sm font-semibold text-zinc-900">
              {username}
            </p>
          </div>
          <Link
            href="/profile"
            role="menuitem"
            onClick={() => setIsOpen(false)}
            className="block px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900"
          >
            Profile
          </Link>
          <Link
            href="/dashboard/trips"
            role="menuitem"
            onClick={() => setIsOpen(false)}
            className="block px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900"
          >
            My Trips
          </Link>
          <div className="border-t border-zinc-100" />
          <form action={logout}>
            <button
              type="submit"
              role="menuitem"
              className="block w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
            >
              Logout
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
