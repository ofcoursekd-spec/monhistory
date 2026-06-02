'use client';
import { useEffect } from 'react';
import Link from 'next/link';

import { useAuth } from '@/lib/auth';

export function Navbar() {
  const { user, accessToken, loadMe, logout } = useAuth();

  useEffect(() => {
    if (accessToken && !user) loadMe();
  }, [accessToken, user, loadMe]);

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-black/5">
      <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
        <Link href="/" className="font-display text-xl font-bold text-brand">
          MonHistory
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link href="/catalogue">Catalogue</Link>
          <Link href="/abonnement">Abonnement</Link>
          {user ? (
            <>
              <Link href="/bibliotheque">Ma bibliothèque</Link>
              {user.role === 'ADMIN' && (
                <Link href="/admin" className="text-accent">
                  Admin
                </Link>
              )}
              <Link href="/profil" className="rounded-full bg-ink/5 px-3 py-1.5">
                {user.name}
              </Link>
              <button onClick={logout} className="text-ink/50 hover:text-ink" aria-label="Se déconnecter">
                ↪
              </button>
            </>
          ) : (
            <Link
              href="/connexion"
              className="rounded-full bg-brand text-white px-4 py-1.5 hover:bg-brand-600 transition"
            >
              Se connecter
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
