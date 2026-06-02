'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';

import { apiGet, apiPost, api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

interface AdminBook {
  id: string;
  slug: string;
  title: string;
  author: string;
  category: string;
  price: number;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  publishedAt: string | null;
  _count: { chapters: number; purchases: number };
}

const CATEGORIES = [
  'AMOUR', 'TRAHISON', 'CONFIANCE', 'DEPRESSION',
  'MOTIVATION', 'MARIAGE', 'VIE_CHRETIENNE', 'HISTOIRES_VRAIES',
] as const;

export default function AdminBooksPage() {
  const { accessToken } = useAuth();
  const [items, setItems] = useState<AdminBook[]>([]);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    title: '',
    author: '',
    description: '',
    coverImageUrl: '',
    category: 'AMOUR' as (typeof CATEGORIES)[number],
    price: 0,
    status: 'DRAFT' as 'DRAFT' | 'PUBLISHED',
  });

  async function load() {
    if (!accessToken) return;
    const r = await apiGet<{ items: AdminBook[] }>('/admin/books?limit=100', accessToken);
    setItems(r.items);
  }

  useEffect(() => {
    load();
  }, [accessToken]);

  async function create() {
    try {
      await apiPost('/books', form, accessToken!);
      toast.success(`Livre créé (${form.status === 'PUBLISHED' ? 'publié' : 'brouillon'})`);
      setCreating(false);
      setForm({
        title: '', author: '', description: '', coverImageUrl: '',
        category: 'AMOUR', price: 0, status: 'DRAFT',
      });
      await load();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function toggleStatus(b: AdminBook) {
    const next = b.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    try {
      await api(`/books/${b.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: next }),
        token: accessToken!,
      });
      toast.success(next === 'PUBLISHED' ? 'Publié' : 'Repassé en brouillon');
      await load();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function remove(b: AdminBook) {
    if (!confirm(`Supprimer "${b.title}" ? Tous ses chapitres seront perdus.`)) return;
    try {
      await api(`/books/${b.id}`, { method: 'DELETE', token: accessToken! });
      toast.success('Supprimé');
      await load();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-display text-3xl font-bold">Livres ({items.length})</h1>
        <button
          onClick={() => setCreating((v) => !v)}
          className="rounded-full bg-brand text-white px-4 py-2"
        >
          {creating ? 'Annuler' : '+ Nouveau livre'}
        </button>
      </div>

      {creating && (
        <div className="rounded-2xl border border-black/5 p-6 mb-8 space-y-3">
          {(['title', 'author', 'coverImageUrl'] as const).map((k) => (
            <input
              key={k}
              placeholder={k}
              value={form[k] as string}
              onChange={(e) => setForm({ ...form, [k]: e.target.value })}
              className="w-full rounded-xl border border-black/10 px-4 py-2"
            />
          ))}
          <textarea
            placeholder="description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full rounded-xl border border-black/10 px-4 py-2"
            rows={3}
          />
          <div className="grid grid-cols-3 gap-3">
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value as (typeof CATEGORIES)[number] })}
              className="rounded-xl border border-black/10 px-4 py-2"
            >
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
            <input
              type="number"
              placeholder="prix FCFA (0 = abonnement seul)"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
              className="rounded-xl border border-black/10 px-4 py-2"
            />
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as 'DRAFT' | 'PUBLISHED' })}
              className="rounded-xl border border-black/10 px-4 py-2"
            >
              <option value="DRAFT">Brouillon</option>
              <option value="PUBLISHED">Publié</option>
            </select>
          </div>
          <button onClick={create} className="rounded-full bg-brand text-white px-5 py-2">
            Créer
          </button>
        </div>
      )}

      <table className="w-full text-sm">
        <thead className="text-left text-ink/60">
          <tr>
            <th className="py-2">Titre</th>
            <th>Auteur</th>
            <th>Catégorie</th>
            <th>Statut</th>
            <th>Prix</th>
            <th>Ch.</th>
            <th>Ventes</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {items.map((b) => (
            <tr key={b.id} className="border-t border-black/5">
              <td className="py-3">
                <Link href={`/admin/livres/${b.id}`} className="text-brand font-medium">
                  {b.title}
                </Link>
              </td>
              <td>{b.author}</td>
              <td className="text-xs">{b.category}</td>
              <td>
                <button
                  onClick={() => toggleStatus(b)}
                  className={`text-xs rounded-full px-2 py-1 transition ${
                    b.status === 'PUBLISHED'
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                  }`}
                  title="Cliquer pour basculer"
                >
                  {b.status === 'PUBLISHED' ? 'Publié' : 'Brouillon'}
                </button>
              </td>
              <td>{b.price > 0 ? `${b.price.toLocaleString('fr-FR')} F` : '—'}</td>
              <td>{b._count.chapters}</td>
              <td>{b._count.purchases}</td>
              <td>
                <button
                  onClick={() => remove(b)}
                  className="text-xs text-red-600 hover:underline"
                >
                  Supprimer
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
