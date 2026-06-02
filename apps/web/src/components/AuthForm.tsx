'use client';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

import { useAuth } from '@/lib/auth';

export function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get('next') ?? '/';
  const { login, register, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (mode === 'login') await login(email, password);
      else await register(email, name, password);
      toast.success('Bienvenue !');
      router.push(next);
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {mode === 'register' && (
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ton prénom"
          className="w-full rounded-xl border border-black/10 px-4 py-3 focus:border-brand outline-none"
        />
      )}
      <input
        required
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        className="w-full rounded-xl border border-black/10 px-4 py-3 focus:border-brand outline-none"
      />
      <input
        required
        type="password"
        minLength={8}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Mot de passe (8+ caractères)"
        className="w-full rounded-xl border border-black/10 px-4 py-3 focus:border-brand outline-none"
      />
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-brand text-white py-3 font-medium hover:bg-brand-600 transition disabled:opacity-60 inline-flex items-center justify-center gap-2"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {loading
          ? mode === 'login'
            ? 'Connexion en cours…'
            : 'Création du compte…'
          : mode === 'login'
            ? 'Se connecter'
            : 'Créer mon compte'}
      </button>
      {loading && (
        <p className="text-center text-xs text-ink/50">
          Le serveur peut mettre quelques secondes — réseau lent.
        </p>
      )}
      {mode === 'login' && (
        <p className="text-center text-xs">
          <Link href="/mot-de-passe-oublie" className="text-ink/50 hover:text-brand">
            Mot de passe oublié ?
          </Link>
        </p>
      )}
      <p className="text-center text-sm text-ink/60">
        {mode === 'login' ? (
          <>
            Pas encore inscrite ?{' '}
            <Link href="/inscription" className="text-brand">
              Créer un compte
            </Link>
          </>
        ) : (
          <>
            Déjà inscrite ?{' '}
            <Link href="/connexion" className="text-brand">
              Se connecter
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
