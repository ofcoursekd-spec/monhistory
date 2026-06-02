'use client';
import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/api';
import { useAuth } from '@/lib/auth';

interface KPIs {
  users: number;
  activeSubscriptions: number;
  totalRevenue: number;
  popularBooks: { id: string; title: string; _count: { purchases: number; favorites: number } }[];
}

export default function AdminDashboardPage() {
  const { accessToken } = useAuth();
  const [k, setK] = useState<KPIs | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    apiGet<KPIs>('/admin/kpis', accessToken).then(setK).catch(() => {});
  }, [accessToken]);

  return (
    <div>
      <h1 className="font-display text-3xl font-bold mb-8">Tableau de bord</h1>
      {!k ? (
        <p className="text-ink/60">Chargement…</p>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Kpi label="Utilisateurs" value={k.users.toLocaleString('fr-FR')} />
            <Kpi label="Abonnements actifs" value={k.activeSubscriptions.toLocaleString('fr-FR')} />
            <Kpi
              label="Revenus cumulés"
              value={`${k.totalRevenue.toLocaleString('fr-FR')} FCFA`}
            />
          </div>

          <h2 className="font-display text-xl font-bold mt-10 mb-4">Livres les plus achetés</h2>
          <ul className="divide-y divide-black/5 rounded-2xl border border-black/5">
            {k.popularBooks.map((b) => (
              <li key={b.id} className="p-4 flex justify-between">
                <span>{b.title}</span>
                <span className="text-ink/60 text-sm">
                  {b._count.purchases} achats · {b._count.favorites} favoris
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-black/5 p-6 shadow-soft">
      <p className="text-sm text-ink/60">{label}</p>
      <p className="mt-2 font-display text-3xl font-bold text-brand">{value}</p>
    </div>
  );
}
