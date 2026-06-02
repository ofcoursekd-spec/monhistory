'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import type { BookSummary } from '@/lib/types';

export function BookCard({ book }: { book: BookSummary }) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="group"
    >
      <Link href={`/livre/${book.slug}`} className="block">
        <div className="aspect-[2/3] overflow-hidden rounded-2xl shadow-soft bg-gray-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={book.coverImageUrl}
            alt={book.title}
            className="h-full w-full object-cover group-hover:scale-105 transition duration-500"
          />
        </div>
        <h3 className="mt-3 font-display text-lg font-semibold leading-tight line-clamp-2">
          {book.title}
        </h3>
        <p className="text-sm text-ink/60">{book.author}</p>
      </Link>
    </motion.div>
  );
}
