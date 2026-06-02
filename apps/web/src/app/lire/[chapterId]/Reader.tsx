'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Heart, MessageCircle, Frown, Flame } from 'lucide-react';
import { apiGet, apiPost } from '@/lib/api';
import { getClientToken } from '@/lib/auth';
import type { ChapterDetail } from '@/lib/types';

const getToken = () => getClientToken();

export function Reader({ chapterId }: { chapterId: string }) {
  const [chapter, setChapter] = useState<ChapterDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dark, setDark] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    apiGet<ChapterDetail>(`/chapters/${chapterId}`, getToken())
      .then(setChapter)
      .catch((e) => setError(e.message));
  }, [chapterId]);

  // Sauvegarde de la progression au scroll (throttled)
  useEffect(() => {
    if (!chapter) return;
    let timer: number | undefined;
    const handler = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        const pages = containerRef.current?.querySelectorAll<HTMLElement>('[data-page]');
        if (!pages) return;
        let current = 1;
        for (const el of Array.from(pages)) {
          if (el.getBoundingClientRect().top < window.innerHeight / 2) {
            current = Number(el.dataset.page);
          }
        }
        apiPost('/reading/progress', { chapterId, lastPage: current }, getToken()).catch(() => {});
      }, 800);
    };
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, [chapter, chapterId]);

  if (error)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <p className="text-ink/70">Impossible de charger ce chapitre.</p>
        <p className="text-sm text-ink/50 mt-2">{error}</p>
        <Link href="/" className="mt-6 text-brand underline">
          Retour à l’accueil
        </Link>
      </div>
    );

  if (!chapter) return <ReaderSkeleton />;

  return (
    <div className={dark ? 'min-h-screen bg-neutral-950 text-white' : 'min-h-screen bg-white'}>
      <header
        className={`sticky top-0 z-40 backdrop-blur border-b ${
          dark ? 'bg-neutral-950/80 border-white/10' : 'bg-white/80 border-black/5'
        }`}
      >
        <div className="mx-auto max-w-3xl px-4 h-14 flex items-center justify-between">
          <Link href={`/livre/${chapter.book.slug}`} className="flex items-center gap-2 text-sm">
            <ArrowLeft className="h-4 w-4" /> {chapter.book.title}
          </Link>
          <button onClick={() => setDark((d) => !d)} className="text-sm opacity-70 hover:opacity-100">
            {dark ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      <div className="text-center py-6">
        <p className="text-xs uppercase tracking-widest text-brand font-semibold">
          Chapitre {chapter.number}
        </p>
        <h1 className="font-display text-2xl font-bold mt-1">{chapter.title}</h1>
      </div>

      <div ref={containerRef} className="reader-scroll mx-auto max-w-3xl pb-32">
        {chapter.pages.map((p, i) => (
          <ReaderPage
            key={p.id}
            page={p}
            isFirst={i === 0}
            nextUrls={chapter.pages.slice(i + 1, i + 3).map((n) => n.imageUrl).filter(Boolean)}
            dark={dark}
          />
        ))}
        {chapter.preview && (
          <Paywall
            dark={dark}
            hidden={chapter.totalPages - chapter.pages.length}
            bookSlug={chapter.book.slug}
          />
        )}
      </div>

      <div
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 rounded-full px-3 py-2 flex items-center gap-1 shadow-soft border ${
          dark ? 'bg-neutral-900 border-white/10' : 'bg-white border-black/10'
        }`}
      >
        <ReactionButton chapterId={chapter.id} type="LIKE" icon={<Heart className="h-4 w-4" />} />
        <ReactionButton chapterId={chapter.id} type="TOUCHING" icon={<Frown className="h-4 w-4" />} />
        <ReactionButton chapterId={chapter.id} type="SHOCKING" icon={<Flame className="h-4 w-4" />} />
        <div className={`w-px h-5 mx-1 ${dark ? 'bg-white/10' : 'bg-black/10'}`} />
        <button className="p-2 rounded-full hover:bg-black/5">
          <MessageCircle className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/**
 * Une page du lecteur :
 *  - `loading="lazy"` + `decoding="async"` : le navigateur n'alloue ressources qu'à l'approche
 *  - `aspect-ratio` réservé sur le wrapper → zéro layout shift quand l'image arrive
 *  - dès que la page entre dans le viewport, on précharge les 2 suivantes (Image()) en background
 *  - la 1re page (i===0) est en `eager` car visible d'entrée
 */
function ReaderPage({
  page: p,
  isFirst,
  nextUrls,
  dark,
}: {
  page: { id: string; order: number; imageUrl: string; description?: string | null };
  isFirst: boolean;
  nextUrls: string[];
  dark: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  // Précharge les pages suivantes dès que celle-ci approche (600px avant le viewport).
  useEffect(() => {
    if (!ref.current || nextUrls.length === 0) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          nextUrls.forEach((url) => {
            const img = new Image();
            img.src = url;
          });
          obs.disconnect();
        }
      },
      { rootMargin: '600px' },
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [nextUrls]);

  return (
    <motion.div
      ref={ref}
      data-page={p.order}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.4 }}
      className="mb-1"
    >
      {p.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={p.imageUrl}
          alt={`Page ${p.order}`}
          loading={isFirst ? 'eager' : 'lazy'}
          decoding="async"
          fetchPriority={isFirst ? 'high' : 'auto'}
          className={`w-full h-auto block select-none pointer-events-none ${
            dark ? 'bg-neutral-900' : 'bg-gray-100'
          }`}
          style={{ minHeight: 200 }}
          draggable={false}
          onContextMenu={(e) => e.preventDefault()}
        />
      ) : (
        <div
          className={`w-full aspect-[3/4] flex items-center justify-center text-sm ${
            dark ? 'bg-neutral-900 text-white/40' : 'bg-gray-100 text-gray-400'
          }`}
        >
          Page {p.order} — image non disponible
        </div>
      )}
      {p.description && (
        <p className={`text-sm px-4 py-3 ${dark ? 'text-white/70' : 'text-ink/70'}`}>
          {p.description}
        </p>
      )}
    </motion.div>
  );
}

function Paywall({ dark, hidden, bookSlug }: { dark: boolean; hidden: number; bookSlug: string }) {
  return (
    <div
      className={`mx-4 my-8 rounded-3xl p-8 text-center shadow-soft ${
        dark ? 'bg-neutral-900 border border-white/10' : 'bg-gradient-to-br from-brand/10 to-accent/10'
      }`}
    >
      <p className="text-xs uppercase tracking-widest text-brand font-semibold">Aperçu terminé</p>
      <h2 className="font-display text-3xl font-bold mt-2">
        Il reste {hidden} page{hidden > 1 ? 's' : ''} à découvrir.
      </h2>
      <p className={`mt-3 max-w-sm mx-auto ${dark ? 'text-white/70' : 'text-ink/70'}`}>
        Passe en Premium pour continuer cette histoire et accéder à tous les chapitres de
        tous les livres.
      </p>
      <div className="mt-6 flex gap-3 justify-center flex-wrap">
        <Link
          href="/abonnement"
          className="rounded-full bg-brand text-white px-6 py-3 hover:bg-brand-600 transition"
        >
          Voir les offres Premium
        </Link>
        <Link
          href={`/livre/${bookSlug}`}
          className={`rounded-full border px-6 py-3 transition ${
            dark ? 'border-white/15 hover:bg-white/5' : 'border-ink/15 hover:bg-ink/5'
          }`}
        >
          Acheter ce livre
        </Link>
      </div>
    </div>
  );
}

function ReactionButton({
  chapterId,
  type,
  icon,
}: {
  chapterId: string;
  type: 'LIKE' | 'TOUCHING' | 'SHOCKING';
  icon: React.ReactNode;
}) {
  const [active, setActive] = useState(false);
  return (
    <button
      onClick={async () => {
        setActive((a) => !a);
        try {
          await apiPost(`/reactions/chapter/${chapterId}/toggle`, { type }, getToken());
        } catch {
          setActive((a) => !a);
        }
      }}
      className={`p-2 rounded-full transition ${active ? 'bg-brand/10 text-brand' : 'hover:bg-black/5'}`}
    >
      {icon}
    </button>
  );
}

function ReaderSkeleton() {
  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-3xl px-4 py-10 space-y-4">
        <div className="skeleton h-6 w-2/3 rounded" />
        <div className="skeleton aspect-[3/4] w-full rounded-xl" />
        <div className="skeleton aspect-[3/4] w-full rounded-xl" />
      </div>
    </div>
  );
}
