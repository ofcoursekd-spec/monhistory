'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Heart } from 'lucide-react';
import toast from 'react-hot-toast';

import { apiDelete, apiGet, apiPost } from '@/lib/api';
import { useAuth } from '@/lib/auth';

interface Props {
  bookId: string;
  price: number;
  firstChapterId?: string;
}

interface FavoriteRow {
  bookId: string;
}

export function BookActions({ bookId, price, firstChapterId }: Props) {
  const router = useRouter();
  const { accessToken } = useAuth();
  const [favorited, setFavorited] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    apiGet<FavoriteRow[]>('/favorites', accessToken)
      .then((favs) => setFavorited(favs.some((f) => f.bookId === bookId)))
      .catch(() => {});
  }, [accessToken, bookId]);

  async function toggleFavorite() {
    if (!accessToken) return router.push('/connexion');
    setBusy(true);
    try {
      if (favorited) {
        await apiDelete(`/favorites/${bookId}`, accessToken);
        setFavorited(false);
      } else {
        await apiPost(`/favorites/${bookId}`, {}, accessToken);
        setFavorited(true);
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function buy() {
    if (!accessToken) return router.push('/connexion');
    try {
      const r = await apiPost<{ paymentId: string; checkoutUrl: string }>(
        '/purchases',
        { bookId, callbackUrl: `${window.location.origin}/paiement/retour?type=purchase` },
        accessToken,
      );
      window.location.href = r.checkoutUrl;
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <div className="mt-6 flex flex-wrap gap-3">
      {firstChapterId && (
        <Link
          href={`/lire/${firstChapterId}`}
          className="rounded-full bg-brand text-white px-6 py-3 hover:bg-brand-600 transition"
        >
          Commencer à lire
        </Link>
      )}
      {price > 0 && (
        <button
          onClick={buy}
          className="rounded-full border border-ink/15 px-6 py-3 hover:bg-ink/5 transition"
        >
          Acheter — {price.toLocaleString('fr-FR')} FCFA
        </button>
      )}
      <button
        onClick={toggleFavorite}
        disabled={busy}
        aria-label="Favori"
        className={`rounded-full px-4 py-3 border transition ${
          favorited ? 'border-brand text-brand bg-brand/5' : 'border-ink/15 hover:bg-ink/5'
        }`}
      >
        <Heart className="h-5 w-5" fill={favorited ? 'currentColor' : 'none'} />
      </button>
    </div>
  );
}
