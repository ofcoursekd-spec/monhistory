'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Navbar } from '@/components/Navbar';
import { BookCard } from '@/components/BookCard';
import { apiGet } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { BookSummary } from '@/lib/types';

interface ProgressItem {
  id: string;
  lastPage: number;
  chapter: {
    id: string;
    number: number;
    title: string;
    book: { id: string; slug: string; title: string; coverImageUrl: string };
  };
}

interface PurchaseItem {
  id: string;
  book: BookSummary;
}

interface FavoriteItem {
  book: BookSummary;
}

export default function LibraryPage() {
  const router = useRouter();
  const { user, accessToken, loadMe } = useAuth();
  const [progress, setProgress] = useState<ProgressItem[]>([]);
  const [purchases, setPurchases] = useState<PurchaseItem[]>([]);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);

  useEffect(() => {
    if (accessToken && !user) loadMe();
  }, [accessToken, user, loadMe]);

  useEffect(() => {
    if (!accessToken) {
      router.replace('/connexion');
      return;
    }
    apiGet<ProgressItem[]>('/reading/continue', accessToken).then(setProgress).catch(() => {});
    apiGet<PurchaseItem[]>('/purchases', accessToken).then(setPurchases).catch(() => {});
    apiGet<FavoriteItem[]>('/favorites', accessToken).then(setFavorites).catch(() => {});
  }, [accessToken, router]);

  return (
    <>
      <Navbar />
      <section className="mx-auto max-w-6xl px-4 py-10 space-y-12">
        <h1 className="font-display text-3xl font-bold">Ma bibliothèque</h1>

        <div>
          <h2 className="font-display text-2xl font-bold mb-4">Continuer la lecture</h2>
          {progress.length === 0 ? (
            <p className="text-ink/60">Aucun chapitre en cours.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
              {progress.map((p) => (
                <Link
                  key={p.id}
                  href={`/lire/${p.chapter.id}`}
                  className="group"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.chapter.book.coverImageUrl}
                    alt={p.chapter.book.title}
                    className="aspect-[2/3] w-full object-cover rounded-2xl shadow-soft"
                  />
                  <p className="mt-2 text-xs text-brand font-semibold">
                    CHAPITRE {p.chapter.number} · PAGE {p.lastPage}
                  </p>
                  <p className="font-medium leading-tight line-clamp-1">{p.chapter.book.title}</p>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="font-display text-2xl font-bold mb-4">Livres achetés</h2>
          {purchases.length === 0 ? (
            <p className="text-ink/60">Tu n’as encore acheté aucun livre.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {purchases.map((p) => (
                <BookCard key={p.id} book={p.book} />
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="font-display text-2xl font-bold mb-4">Favoris</h2>
          {favorites.length === 0 ? (
            <p className="text-ink/60">Aucun favori pour l’instant.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {favorites.map((f) => (
                <BookCard key={f.book.id} book={f.book} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
