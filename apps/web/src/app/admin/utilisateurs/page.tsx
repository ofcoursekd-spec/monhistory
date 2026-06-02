'use client';
import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/api';
import { useAuth } from '@/lib/auth';

interface UserRow {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
  _count: { subscriptions: number; purchases: number };
}

export default function AdminUsersPage() {
  const { accessToken } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);

  useEffect(() => {
    if (!accessToken) return;
    apiGet<UserRow[]>('/admin/users', accessToken).then(setUsers).catch(() => {});
  }, [accessToken]);

  return (
    <div>
      <h1 className="font-display text-3xl font-bold mb-6">Utilisateurs</h1>
      <table className="w-full text-sm">
        <thead className="text-left text-ink/60">
          <tr>
            <th className="py-2">Email</th>
            <th>Nom</th>
            <th>Rôle</th>
            <th>Abos</th>
            <th>Achats</th>
            <th>Inscrit le</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-t border-black/5">
              <td className="py-3">{u.email}</td>
              <td>{u.name}</td>
              <td>{u.role}</td>
              <td>{u._count.subscriptions}</td>
              <td>{u._count.purchases}</td>
              <td>{new Date(u.createdAt).toLocaleDateString('fr-FR')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
