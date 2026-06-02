'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { Navbar } from '@/components/Navbar';
import { apiGet } from '@/lib/api';
import { useAuth } from '@/lib/auth';

interface SubStatus {
  active: boolean;
  subscription: { plan: string; endsAt: string } | null;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, accessToken, loadMe, logout } = useAuth();
  const [sub, setSub] = useState<SubStatus | null>(null);

  useEffect(() => {
    if (accessToken && !user) loadMe();
  }, [accessToken, user, loadMe]);

  useEffect(() => {
    if (!accessToken) {
      router.replace('/connexion');
      return;
    }
    apiGet<SubStatus>('/subscriptions/me', accessToken).then(setSub).catch(() => {});
  }, [accessToken, router]);

  return (
    <>
      <Navbar />
      <section className="mx-auto max-w-2xl px-4 py-12 space-y-8">
        <h1 className="font-display text-3xl font-bold">Mon profil</h1>

        {user && (
          <div className="rounded-2xl border border-black/5 p-6">
            <p className="text-ink/60 text-sm">Identifiants</p>
            <p className="mt-1 text-lg">{user.name}</p>
            <p className="text-sm text-ink/60">{user.email}</p>
          </div>
        )}

        <div className="rounded-2xl border border-black/5 p-6">
          <p className="text-ink/60 text-sm">Abonnement</p>
          {sub?.active ? (
            <>
              <p className="mt-1 text-lg text-brand font-semibold">Premium {sub.subscription?.plan}</p>
              <p className="text-sm text-ink/60">
                Expire le {new Date(sub.subscription!.endsAt).toLocaleDateString('fr-FR')}
              </p>
            </>
          ) : (
            <>
              <p className="mt-1 text-lg">Pas d’abonnement actif</p>
              <a href="/abonnement" className="text-brand text-sm">
                Découvrir Premium →
              </a>
            </>
          )}
        </div>

        <button
          onClick={logout}
          className="w-full rounded-full border border-ink/15 py-3 hover:bg-ink/5 transition"
        >
          Se déconnecter
        </button>
      </section>
    </>
  );
}
