'use client';
import { useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';

import { Navbar } from '@/components/Navbar';
import { apiPost } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await apiPost('/auth/forgot-password', { email });
      setSent(true);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Navbar />
      <section className="mx-auto max-w-md px-4 py-16">
        <h1 className="font-display text-3xl font-bold mb-6">Mot de passe oublié</h1>
        {sent ? (
          <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-center">
            <p className="text-green-800">
              📧 Si un compte existe avec cette adresse, tu recevras un email avec un lien
              pour réinitialiser ton mot de passe.
            </p>
            <p className="text-sm text-green-700 mt-3">
              Le lien expire dans 1 heure. Pense à vérifier ton dossier spam.
            </p>
            <Link href="/connexion" className="inline-block mt-4 text-brand underline">
              Retour à la connexion
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <p className="text-ink/70 text-sm">
              Entre ton adresse email — on t'enverra un lien pour choisir un nouveau mot de passe.
            </p>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full rounded-xl border border-black/10 px-4 py-3 focus:border-brand outline-none"
            />
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-full bg-brand text-white py-3 font-medium hover:bg-brand-600 transition disabled:opacity-60"
            >
              {busy ? 'Envoi en cours…' : "M'envoyer un lien"}
            </button>
            <p className="text-center text-sm text-ink/60">
              <Link href="/connexion" className="text-brand">
                Retour à la connexion
              </Link>
            </p>
          </form>
        )}
      </section>
    </>
  );
}
