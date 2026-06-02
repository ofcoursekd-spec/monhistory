import { Navbar } from '@/components/Navbar';
import { BookCard } from '@/components/BookCard';
import { apiGet } from '@/lib/api';
import type { BookSummary } from '@/lib/types';

export const metadata = { title: 'Catalogue' };
export const revalidate = 60;

export default async function CataloguePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; search?: string }>;
}) {
  const sp = await searchParams;
  const query = new URLSearchParams();
  if (sp.category) query.set('category', sp.category);
  if (sp.search) query.set('search', sp.search);

  let items: BookSummary[] = [];
  try {
    const r = await apiGet<{ items: BookSummary[] }>(`/books?${query.toString()}`);
    items = r.items;
  } catch {}

  return (
    <>
      <Navbar />
      <section className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="font-display text-3xl font-bold mb-6">Catalogue</h1>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {items.map((b) => (
            <BookCard key={b.id} book={b} />
          ))}
        </div>
      </section>
    </>
  );
}
