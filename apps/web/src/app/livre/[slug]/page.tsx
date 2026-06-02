import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { apiGet } from '@/lib/api';
import type { BookDetail } from '@/lib/types';
import { BookActions } from './BookActions';

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const b = await apiGet<BookDetail>(`/books/${slug}`);
    return { title: b.title, description: b.description, openGraph: { images: [b.coverImageUrl] } };
  } catch {
    return { title: 'Livre' };
  }
}

export default async function BookPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let book: BookDetail;
  try {
    book = await apiGet<BookDetail>(`/books/${slug}`);
  } catch {
    notFound();
  }

  return (
    <>
      <Navbar />
      <article className="mx-auto max-w-5xl px-4 py-10">
        <div className="grid md:grid-cols-[280px_1fr] gap-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={book.coverImageUrl}
            alt={book.title}
            className="w-full rounded-2xl shadow-soft object-cover aspect-[2/3]"
          />
          <div>
            <p className="uppercase text-xs tracking-widest text-brand font-semibold">
              {book.category.replace('_', ' ')}
            </p>
            <h1 className="font-display text-4xl font-bold mt-2">{book.title}</h1>
            <p className="text-ink/60 mt-1">par {book.author}</p>
            <p className="mt-6 leading-relaxed text-ink/80">{book.description}</p>
            <BookActions
              bookId={book.id}
              price={book.price}
              firstChapterId={book.chapters[0]?.id}
            />
          </div>
        </div>

        <section className="mt-12">
          <h2 className="font-display text-2xl font-bold mb-4">Chapitres</h2>
          <ul className="divide-y divide-black/5 rounded-2xl border border-black/5 overflow-hidden">
            {book.chapters.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/lire/${c.id}`}
                  className="flex items-center justify-between p-4 hover:bg-brand/5 transition"
                >
                  <div>
                    <p className="text-xs text-brand font-semibold">CHAPITRE {c.number}</p>
                    <p className="font-medium mt-0.5">{c.title}</p>
                    {c.summary && <p className="text-sm text-ink/60 mt-1 line-clamp-1">{c.summary}</p>}
                  </div>
                  {c.number === 1 ? (
                    <span className="text-xs rounded-full bg-green-100 text-green-700 px-3 py-1">
                      Aperçu gratuit
                    </span>
                  ) : (
                    <span className="text-xs rounded-full bg-brand/10 text-brand px-3 py-1">
                      Premium
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </article>
    </>
  );
}
