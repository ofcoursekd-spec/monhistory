'use client';
import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';

import { Navbar } from '@/components/Navbar';
import { apiPost } from '@/lib/api';

function Form() {
  const router = useRouter();
  const sp = useSearchParams();
  const token = sp.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);

  if (!token) {
    return (
      <p className="text-center text-ink/70">
        Lien invalide.{' '}
        <Link href="/mot-de-passe-oublie" className="text-brand underline">
          Refaire une demande
        </Link>
        .
      </p>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      toast.error('Les deux mots de passe ne correspondent pas');
      return;
    }
    setBusy(true);
    try {
      await apiPost('/auth/reset-password', { token, password });
      toast.success('Mot de passe modifié — tu peux te connecter');
      router.push('/connexion');
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <input
        required
        type="password"
        minLength={8}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Nouveau mot de passe (8+)"
        className="w-full rounded-xl border border-black/10 px-4 py-3 focus:border-brand outline-none"
      />
      <input
        required
        type="password"
        minLength={8}
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        placeholder="Confirmer le mot de passe"
        className="w-full rounded-xl border border-black/10 px-4 py-3 focus:border-brand outline-none"
      />
      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-full bg-brand text-white py-3 font-medium hover:bg-brand-600 transition disabled:opacity-60"
      >
        {busy ? 'Mise à jour…' : 'Mettre à jour mon mot de passe'}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <>
      <Navbar />
      <section className="mx-auto max-w-md px-4 py-16">
        <h1 className="font-display text-3xl font-bold mb-6">Nouveau mot de passe</h1>
        <Suspense fallback={null}>
          <Form />
        </Suspense>
      </section>
    </>
  );
}
