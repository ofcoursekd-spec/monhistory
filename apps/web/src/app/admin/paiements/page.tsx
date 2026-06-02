'use client';
import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/api';
import { useAuth } from '@/lib/auth';

interface PaymentRow {
  id: string;
  amount: number;
  status: string;
  purpose: string;
  createdAt: string;
  user: { email: string; name: string };
}

export default function AdminPaymentsPage() {
  const { accessToken } = useAuth();
  const [rows, setRows] = useState<PaymentRow[]>([]);

  useEffect(() => {
    if (!accessToken) return;
    apiGet<PaymentRow[]>('/admin/payments', accessToken).then(setRows).catch(() => {});
  }, [accessToken]);

  return (
    <div>
      <h1 className="font-display text-3xl font-bold mb-6">Paiements</h1>
      <table className="w-full text-sm">
        <thead className="text-left text-ink/60">
          <tr>
            <th className="py-2">Date</th>
            <th>Utilisateur</th>
            <th>But</th>
            <th>Montant</th>
            <th>Statut</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.id} className="border-t border-black/5">
              <td className="py-3">{new Date(p.createdAt).toLocaleString('fr-FR')}</td>
              <td>
                <p>{p.user.name}</p>
                <p className="text-xs text-ink/50">{p.user.email}</p>
              </td>
              <td>{p.purpose}</td>
              <td>{p.amount.toLocaleString('fr-FR')} F</td>
              <td>
                <span
                  className={`text-xs rounded-full px-2 py-1 ${
                    p.status === 'SUCCEEDED'
                      ? 'bg-green-100 text-green-700'
                      : p.status === 'FAILED'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {p.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
