'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import { Navbar } from '@/components/Navbar';
import { apiGet } from '@/lib/api';
import { useAuth } from '@/lib/auth';

interface SubStatus {
  active: boolean;
  subscription: { plan: string; endsAt: string } | null;
}

interface PurchaseItem {
  id: string;
  book: { id: string; title: string; slug: string };
}

export default function PaymentReturnPage() {
  const sp = useSearchParams();
  const type = sp.get('type'); // "subscription" | "purchase"
  const { accessToken } = useAuth();
  const [status, setStatus] = useState<'pending' | 'ok' | 'failed'>('pending');
  const [detail, setDetail] = useState<string>('');

  useEffect(() => {
    if (!accessToken) return;
    let attempts = 0;
    const maxAttempts = 12; // 12 × 2.5s = 30s

    const tick = async () => {
      attempts++;
      try {
        if (type === 'subscription') {
          const r = await apiGet<SubStatus>('/subscriptions/me', accessToken);
          if (r.active && r.subscription) {
            setStatus('ok');
            setDetail(
              `Premium ${r.subscription.plan} actif jusqu'au ${new Date(r.subscription.endsAt).toLocaleDateString('fr-FR')}`,
            );
            return;
          }
        } else {
          const r = await apiGet<PurchaseItem[]>('/purchases', accessToken);
          if (r.length > 0) {
            setStatus('ok');
            setDetail(`${r.length} livre(s) dans ta bibliothèque`);
            return;
          }
        }
      } catch {}
      if (attempts >= maxAttempts) {
        setStatus('failed');
        return;
      }
      setTimeout(tick, 2500);
    };
    tick();
  }, [accessToken, type]);

  return (
    <>
      <Navbar />
      <section className="mx-auto max-w-md px-4 py-20 text-center">
        {status === 'pending' && (
          <>
            <div className="mx-auto h-12 w-12 rounded-full border-4 border-brand/20 border-t-brand animate-spin" />
            <h1 className="font-display text-2xl font-bold mt-6">Vérification du paiement…</h1>
            <p className="text-ink/60 mt-2">Quelques secondes le temps que le webhook arrive.</p>
          </>
        )}
        {status === 'ok' && (
          <>
            <div className="mx-auto h-12 w-12 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-2xl">
              ✓
            </div>
            <h1 className="font-display text-2xl font-bold mt-6">Paiement confirmé</h1>
            <p className="text-ink/60 mt-2">{detail}</p>
            <Link
              href="/bibliotheque"
              className="inline-block mt-6 rounded-full bg-brand text-white px-6 py-3 hover:bg-brand-600 transition"
            >
              Aller dans ma bibliothèque
            </Link>
          </>
        )}
        {status === 'failed' && (
          <>
            <div className="mx-auto h-12 w-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-2xl">
              !
            </div>
            <h1 className="font-display text-2xl font-bold mt-6">Paiement non confirmé</h1>
            <p className="text-ink/60 mt-2">
              Le webhook GeniusPay n'a pas encore confirmé la transaction. Cela peut prendre quelques
              minutes. Reviens vérifier plus tard sur ton profil.
            </p>
            <Link href="/profil" className="inline-block mt-6 text-brand underline">
              Voir mon profil
            </Link>
          </>
        )}
      </section>
    </>
  );
}
