import Link from 'next/link';
import { Navbar } from '@/components/Navbar';

export const metadata = { title: 'Paiement annulé' };

export default function PaymentErrorPage() {
  return (
    <>
      <Navbar />
      <section className="mx-auto max-w-md px-4 py-20 text-center">
        <div className="mx-auto h-12 w-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-2xl">
          !
        </div>
        <h1 className="font-display text-2xl font-bold mt-6">Paiement non finalisé</h1>
        <p className="text-ink/60 mt-2">
          Tu as annulé le paiement ou une erreur est survenue. Aucun montant n'a été débité.
        </p>
        <div className="mt-6 flex gap-3 justify-center">
          <Link
            href="/abonnement"
            className="rounded-full bg-brand text-white px-6 py-3 hover:bg-brand-600 transition"
          >
            Réessayer
          </Link>
          <Link
            href="/"
            className="rounded-full border border-ink/15 px-6 py-3 hover:bg-ink/5 transition"
          >
            Retour à l'accueil
          </Link>
        </div>
      </section>
    </>
  );
}
