'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { logout } from '@/app/actions/auth';
import styles from './Dashboard.module.css';

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
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  return (
    <div className={styles.userMenu} ref={menuRef}>
      <button
        type='button'
        className={styles.profileTrigger}
        aria-haspopup='menu'
        aria-expanded={isOpen}
        aria-label={`Open account menu for ${username}`}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <span className={styles.profileCircle}>{userInitial}</span>
      </button>

      {isOpen ? (
        <div className={styles.userMenuDropdown} role='menu' aria-label='Account menu'>
          <Link
            href='/profile'
            className={styles.userMenuItem}
            role='menuitem'
            onClick={() => setIsOpen(false)}
          >
            Profile
          </Link>

          <Link
            href='/dashboard/trips'
            className={styles.userMenuItem}
            role='menuitem'
            onClick={() => setIsOpen(false)}
          >
            My Trips
          </Link>

          <div className={styles.userMenuDivider} />

          <form action={logout}>
            <button type='submit' className={styles.userMenuItemButton} role='menuitem'>
              Logout
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
