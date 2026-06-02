'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/lib/auth';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, accessToken, loadMe } = useAuth();

  useEffect(() => {
    if (accessToken && !user) loadMe();
  }, [accessToken, user, loadMe]);

  useEffect(() => {
    if (!accessToken) router.replace('/connexion');
    else if (user && user.role !== 'ADMIN') router.replace('/');
  }, [accessToken, user, router]);

  if (!user || user.role !== 'ADMIN') {
    return <div className="p-10 text-center text-ink/60">Vérification des droits…</div>;
  }

  return (
    <div className="min-h-screen grid grid-cols-[220px_1fr]">
      <aside className="border-r border-black/5 p-6 sticky top-0 h-screen">
        <Link href="/" className="font-display text-xl font-bold text-brand">
          MonHistory
        </Link>
        <p className="text-xs text-ink/50 mt-1">Console admin</p>
        <nav className="mt-8 flex flex-col gap-2 text-sm">
          <Link href="/admin" className="hover:text-brand">Tableau de bord</Link>
          <Link href="/admin/livres" className="hover:text-brand">Livres</Link>
          <Link href="/admin/utilisateurs" className="hover:text-brand">Utilisateurs</Link>
          <Link href="/admin/paiements" className="hover:text-brand">Paiements</Link>
        </nav>
      </aside>
      <main className="p-8">{children}</main>
    </div>
  );
}
