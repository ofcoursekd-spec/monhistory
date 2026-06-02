'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import toast from 'react-hot-toast';

import { api, apiGet, apiPost } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { compressToWebP } from '@/lib/compress';

interface Chapter {
  id: string;
  number: number;
  title: string;
  summary: string | null;
}

interface AdminBookDetail {
  id: string;
  slug: string;
  title: string;
  status: string;
  chapters: Chapter[];
}

interface PageItem {
  id: string;
  order: number;
  imageUrl: string;
}

export default function AdminBookEditPage() {
  const { id } = useParams<{ id: string }>();
  const { accessToken } = useAuth();
  const [book, setBook] = useState<AdminBookDetail | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<string | null>(null);
  const [pages, setPages] = useState<PageItem[]>([]);

  async function loadBook() {
    if (!accessToken) return;
    const detail = await apiGet<AdminBookDetail>(`/admin/books/${id}`, accessToken);
    setBook(detail);
  }

  useEffect(() => {
    loadBook();
  }, [id, accessToken]);

  async function loadPages(chapterId: string) {
    const c = await apiGet<{ pages: PageItem[] }>(`/chapters/${chapterId}`, accessToken!);
    setPages(c.pages);
    setSelectedChapter(chapterId);
  }

  async function addChapter() {
    if (!book) return;
    const number = (book.chapters.at(-1)?.number ?? 0) + 1;
    const title = prompt(`Titre du chapitre ${number}`)?.trim();
    if (!title) return;
    try {
      await apiPost('/chapters', { bookId: book.id, number, title }, accessToken!);
      toast.success(`Chapitre ${number} ajouté`);
      await loadBook();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function deleteChapter(chapterId: string) {
    if (!confirm('Supprimer ce chapitre et toutes ses pages ?')) return;
    try {
      await api(`/chapters/${chapterId}`, { method: 'DELETE', token: accessToken! });
      if (selectedChapter === chapterId) {
        setSelectedChapter(null);
        setPages([]);
      }
      toast.success('Chapitre supprimé');
      await loadBook();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function uploadOnePage(rawFile: File, order: number) {
    if (!book || !selectedChapter) return;
    const chapter = book.chapters.find((c) => c.id === selectedChapter);
    if (!chapter) return;

    // 0. Compresse + convertit en WebP côté navigateur — typiquement 5 Mo → 200 Ko.
    const file = await compressToWebP(rawFile);

    // 1. Clé Supabase : livres/<slug>/c<number>/<timestamp>-<filename>
    const safeName = file.name.replace(/[^a-z0-9.]+/gi, '-').toLowerCase();
    const key = `livres/${book.slug}/c${chapter.number}/${Date.now()}-${safeName}`;

    // 2. URL signée Supabase
    const { url } = await apiPost<{ url: string; token: string; key: string }>(
      '/pages/upload-url',
      { key, contentType: file.type },
      accessToken!,
    );

    // 3. PUT direct vers Supabase Storage (le token est déjà dans l'URL)
    const put = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
    });
    if (!put.ok) throw new Error(`Upload Supabase échoué (${put.status})`);

    // 4. Enregistre la page en DB avec la clé
    await apiPost('/pages', { chapterId: selectedChapter, order, imageKey: key }, accessToken!);
  }

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = ''; // permet de re-sélectionner les mêmes fichiers
    if (!files.length || !selectedChapter) return;

    const startOrder = (pages.at(-1)?.order ?? 0) + 1;
    const id = toast.loading(`Upload de ${files.length} image(s)…`);
    try {
      // Upload séquentiel pour préserver l'ordre des pages.
      for (let i = 0; i < files.length; i++) {
        await uploadOnePage(files[i], startOrder + i);
      }
      toast.success(`${files.length} page(s) ajoutée(s)`, { id });
      await loadPages(selectedChapter);
    } catch (err) {
      toast.error((err as Error).message, { id });
    }
  }

  async function deletePage(pageId: string) {
    if (!confirm('Supprimer cette page ?')) return;
    try {
      await api(`/pages/${pageId}`, { method: 'DELETE', token: accessToken! });
      if (selectedChapter) await loadPages(selectedChapter);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  const sensors = useSensors(useSensor(PointerSensor));

  async function onDragEnd(activeId: string, overId: string) {
    if (!selectedChapter || activeId === overId) return;
    const oldIdx = pages.findIndex((p) => p.id === activeId);
    const newIdx = pages.findIndex((p) => p.id === overId);
    const reordered = arrayMove(pages, oldIdx, newIdx);
    setPages(reordered);
    try {
      await apiPost(
        '/pages/reorder',
        { chapterId: selectedChapter, pageIds: reordered.map((p) => p.id) },
        accessToken!,
      );
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  if (!book) return <p className="text-ink/60">Chargement…</p>;

  return (
    <div className="grid grid-cols-[280px_1fr] gap-8">
      <div>
        <h1 className="font-display text-2xl font-bold">{book.title}</h1>
        <span
          className={`inline-block text-xs rounded-full px-2 py-1 mt-2 ${
            book.status === 'PUBLISHED'
              ? 'bg-green-100 text-green-700'
              : 'bg-amber-100 text-amber-700'
          }`}
        >
          {book.status === 'PUBLISHED' ? 'Publié' : 'Brouillon'}
        </span>
        <button
          onClick={addChapter}
          className="rounded-full bg-brand text-white px-4 py-2 mt-4 mb-4 text-sm w-full"
        >
          + Ajouter un chapitre
        </button>
        <ul className="space-y-1">
          {book.chapters.map((c) => (
            <li key={c.id} className="group flex items-center">
              <button
                onClick={() => loadPages(c.id)}
                className={`flex-1 text-left rounded-xl px-3 py-2 ${
                  selectedChapter === c.id ? 'bg-brand/10 text-brand' : 'hover:bg-ink/5'
                }`}
              >
                <span className="text-xs text-ink/50">Ch. {c.number}</span>
                <p className="text-sm">{c.title}</p>
              </button>
              <button
                onClick={() => deleteChapter(c.id)}
                className="opacity-0 group-hover:opacity-100 text-red-500 text-xs px-2"
                title="Supprimer"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div>
        {selectedChapter ? (
          <>
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-display text-xl font-bold">Pages ({pages.length})</h2>
              <label className="rounded-full bg-brand text-white px-4 py-2 text-sm cursor-pointer hover:bg-brand-600 transition">
                + Ajouter des images
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFiles}
                  className="hidden"
                />
              </label>
            </div>
            <p className="text-xs text-ink/50 mb-4">
              Sélectionne une ou plusieurs images — elles seront uploadées sur Supabase Storage et
              ajoutées en bas de la liste. Glisse-dépose ensuite pour réordonner.
            </p>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={(e) => e.over && onDragEnd(String(e.active.id), String(e.over.id))}
            >
              <SortableContext items={pages.map((p) => p.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {pages.map((p) => (
                    <SortablePage key={p.id} page={p} onDelete={() => deletePage(p.id)} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
            {pages.length === 0 && (
              <p className="text-ink/50 italic">Aucune page. Ajoute la première avec le bouton ci-dessus.</p>
            )}
          </>
        ) : (
          <p className="text-ink/60">← Sélectionne un chapitre</p>
        )}
      </div>
    </div>
  );
}

function SortablePage({ page, onDelete }: { page: PageItem; onDelete: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: page.id,
  });
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
      className="flex items-center gap-4 rounded-2xl border border-black/5 p-3 bg-white"
    >
      <span
        {...attributes}
        {...listeners}
        className="text-ink/40 text-sm w-8 cursor-grab active:cursor-grabbing"
      >
        #{page.order}
      </span>
      {page.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={page.imageUrl} alt="" className="h-16 w-12 object-cover rounded-md bg-gray-100" />
      ) : (
        <div className="h-16 w-12 rounded-md bg-gray-100 flex items-center justify-center text-[10px] text-gray-400 italic">
          pas d'image
        </div>
      )}
      <span className="text-xs text-ink/50 truncate flex-1">{page.id}</span>
      <button onClick={onDelete} className="text-red-500 text-xs hover:underline">
        Supprimer
      </button>
    </div>
  );
}
