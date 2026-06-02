import { Mail } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

export const metadata = { title: 'Contact' };

const SUPPORT_EMAIL = 'contact@monhistory.app';

export default function ContactPage() {
  return (
    <>
      <Navbar />
      <section className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="font-display text-4xl font-bold mb-4">Contacte-nous</h1>
        <p className="text-ink/60 mb-10">
          Une question, un bug, une suggestion ? On lit tout et on répond sous 48h ouvrées.
        </p>

        <a
          href={`mailto:${SUPPORT_EMAIL}?subject=Demande%20de%20support`}
          className="inline-flex items-center gap-3 rounded-full bg-brand text-white px-8 py-4 text-lg hover:bg-brand-600 transition"
        >
          <Mail className="h-5 w-5" />
          {SUPPORT_EMAIL}
        </a>

        <div className="mt-12 rounded-2xl border border-black/5 p-6 text-left">
          <p className="font-semibold mb-2">Pense à préciser dans ton email :</p>
          <ul className="list-disc pl-6 space-y-1 text-sm text-ink/70">
            <li>Ton adresse email du compte MonHistory</li>
            <li>Une description claire du problème</li>
            <li>
              Pour un problème de paiement : la <strong>référence de transaction</strong>{' '}
              (commence par <code className="bg-ink/5 px-1 rounded">MTX-</code>)
            </li>
            <li>Le type d'appareil et le navigateur que tu utilises</li>
          </ul>
        </div>
      </section>
      <Footer />
    </>
  );
}
