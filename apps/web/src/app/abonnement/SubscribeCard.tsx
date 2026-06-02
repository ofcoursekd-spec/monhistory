'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

import { apiPost } from '@/lib/api';
import { useAuth } from '@/lib/auth';

interface PlanDto {
  code: string;
  name: string;
  price: number;
  currency: string;
  durationDays: number;
}

/**
 * Flow paiement :
 *   1. POST /subscriptions → backend crée le Payment (amount validé server-side)
 *      et retourne checkoutUrl GeniusPay
 *   2. window.location.href = checkoutUrl → user va sur la page hostée
 *      GeniusPay (Wave / Orange / MTN / Carte)
 *   3. Après paiement, GeniusPay redirige sur /paiement/retour qui poll
 *      /subscriptions/me jusqu'à confirmation par webhook → bibliothèque
 *
 * On ne peut PAS embarquer le checkout en iframe (CSP frame-ancestors).
 * Le SDK React de GeniusPay fait exactement la même redirection en interne,
 * mais avec création de paiement côté client (amount tamper-able) — moins sûr.
 */
export function SubscribeCard({ plan }: { plan: PlanDto }) {
  const router = useRouter();
  const { user, accessToken } = useAuth();
  const [busy, setBusy] = useState(false);

  async function startPayment() {
    if (!user || !accessToken) {
      router.push('/connexion?next=/abonnement');
      return;
    }
    setBusy(true);
    try {
      const r = await apiPost<{ paymentId: string; checkoutUrl: string }>(
        '/subscriptions',
        {
          planCode: plan.code,
          callbackUrl: `${window.location.origin}/paiement/retour?type=subscription`,
        },
        accessToken,
      );
      window.location.href = r.checkoutUrl;
    } catch (e) {
      toast.error((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="mt-12 rounded-3xl border-2 border-brand bg-gradient-to-br from-brand/5 to-accent/5 p-10 shadow-soft">
      <p className="text-xs font-bold tracking-widest text-brand uppercase">{plan.name}</p>
      <div className="mt-4 flex items-baseline gap-2 flex-wrap">
        <span className="font-display text-6xl font-bold">{plan.price.toLocaleString('fr-FR')}</span>
        <span className="text-ink/60 text-xl">FCFA</span>
        <span className="text-ink/50">
          / {plan.durationDays === 30 ? 'mois' : `${plan.durationDays} jours`}
        </span>
      </div>
      <ul className="mt-8 space-y-3 text-base">
        <li className="flex gap-2"><span className="text-brand">✓</span> Tous les livres, tous les chapitres</li>
        <li className="flex gap-2"><span className="text-brand">✓</span> Mode hors ligne (mobile)</li>
        <li className="flex gap-2"><span className="text-brand">✓</span> Aucune publicité</li>
        <li className="flex gap-2"><span className="text-brand">✓</span> Annulation à tout moment</li>
        <li className="flex gap-2"><span className="text-brand">✓</span> Paiement sécurisé Mobile Money</li>
      </ul>

      <button
        onClick={startPayment}
        disabled={busy}
        className="mt-10 w-full rounded-full bg-brand text-white py-4 text-lg font-medium hover:bg-brand-600 transition disabled:opacity-60 inline-flex items-center justify-center gap-2"
      >
        {busy && <Loader2 className="h-5 w-5 animate-spin" />}
        {busy ? 'Redirection vers GeniusPay…' : `Payer ${plan.price.toLocaleString('fr-FR')} FCFA`}
      </button>

      <p className="mt-4 text-xs text-center text-ink/50">
        🔒 Paiement sécurisé via GeniusPay. Wave, Orange Money, MTN, Moov, Carte.
      </p>
    </div>
  );
}
