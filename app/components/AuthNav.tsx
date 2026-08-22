'use client';

import Link from 'next/link';
import { useAuth } from './AuthProvider';
import { logout } from '../actions/auth';
import { useActionState } from 'react';

export function AuthNav() {
  const { session } = useAuth();
  const [, action] = useActionState(logout, undefined);

  if (session) {
    return (
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
        <Link href="/dashboard" style={{ color: 'white', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500 }}>
          Dashboard
        </Link>
        <form action={action}>
          <button type="submit" style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500 }}>
            Logout
          </button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
      <Link href="/login" style={{ color: 'white', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500 }}>
        Log in
      </Link>
      <Link href="/signup" style={{ background: 'white', color: 'var(--navy)', textDecoration: 'none', padding: '6px 16px', borderRadius: '20px', fontSize: '0.9rem', fontWeight: 600 }}>
        Sign up
      </Link>
    </div>
  );
}
