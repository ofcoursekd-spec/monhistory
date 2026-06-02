import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { BookCard } from '@/components/BookCard';
import { apiGet } from '@/lib/api';
import type { BookSummary } from '@/lib/types';

export const revalidate = 60;

async function getBooks(): Promise<BookSummary[]> {
  try {
    const r = await apiGet<{ items: BookSummary[] }>('/books?limit=12');
    return r.items;
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const books = await getBooks();
  return (
    <>
      <Navbar />

      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 py-20 text-center">
          <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tight">
            Des histoires qui <span className="text-brand">touchent.</span>
          </h1>
          <p className="mt-6 text-lg text-ink/70 max-w-2xl mx-auto">
            Plonge dans des BD émotionnelles africaines. Amour, trahison, foi, motivation —
            une nouvelle histoire chaque semaine.
          </p>
          <div className="mt-8 flex gap-3 justify-center">
            <Link
              href="/abonnement"
              className="rounded-full bg-brand text-white px-6 py-3 font-medium hover:bg-brand-600 transition"
            >
              Essayer Premium — 1 999 FCFA / mois
            </Link>
            <Link
              href="/catalogue"
              className="rounded-full border border-ink/15 px-6 py-3 font-medium hover:bg-ink/5 transition"
            >
              Voir le catalogue
            </Link>
          </div>
        </div>
        <div
          aria-hidden
          className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-brand/10 blur-3xl"
        />
        <div
          aria-hidden
          className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-accent/10 blur-3xl"
        />
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="font-display text-2xl font-bold mb-6">Nouveautés</h2>
        {books.length === 0 ? (
          <p className="text-ink/60">
            (Aucun livre à afficher — vérifie que le backend tourne sur{' '}
            <code>NEXT_PUBLIC_API_URL</code>.)
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {books.map((b) => (
              <BookCard key={b.id} book={b} />
            ))}
          </div>
        )}
      </section>
      <Footer />
    </>
  );
}
