import Link from 'next/link';

import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

export const metadata = { title: 'Aide & FAQ' };

const FAQ = [
  {
    q: 'Comment fonctionne l\'abonnement Premium ?',
    a: 'Pour 1 999 FCFA par mois, tu as accès à TOUS les livres et tous les chapitres en illimité. Renouvellement mensuel automatique. Tu peux annuler à tout moment depuis ton profil — l\'accès reste actif jusqu\'à la fin de la période payée.',
  },
  {
    q: 'Puis-je lire sans m\'abonner ?',
    a: 'Oui, les 3 premières pages du chapitre 1 de chaque livre sont gratuites. Tu peux aussi acheter un livre à l\'unité si tu ne veux qu\'un seul livre.',
  },
  {
    q: 'Quels moyens de paiement acceptez-vous ?',
    a: 'Wave, Orange Money, MTN Mobile Money, Moov Money et cartes bancaires Visa/Mastercard via notre prestataire GeniusPay.',
  },
  {
    q: 'Mon paiement n\'a pas été confirmé, que faire ?',
    a: 'Patiente 2-3 minutes (le webhook GeniusPay peut mettre un peu). Si toujours rien, va sur ton profil — si le paiement a réussi côté GeniusPay, ton accès sera activé dans les 5 minutes. Sinon, contacte-nous avec ta référence de paiement.',
  },
  {
    q: 'Comment annuler mon abonnement ?',
    a: 'Va sur ton profil → "Abonnement" → "Annuler". L\'accès Premium reste actif jusqu\'à la fin de la période payée.',
  },
  {
    q: 'J\'ai oublié mon mot de passe',
    a: (
      <>
        Va sur la page <Link href="/mot-de-passe-oublie" className="text-brand underline">Mot de passe oublié</Link>,
        entre ton email, et tu recevras un lien valide 1h pour en choisir un nouveau.
      </>
    ),
  },
  {
    q: 'Comment supprimer mon compte ?',
    a: 'Écris-nous à contact@monhistory.app avec « Suppression de compte » en objet, depuis l\'email associé à ton compte. La suppression est définitive et entraîne la perte de l\'accès à tous tes achats.',
  },
  {
    q: 'Les images sont protégées contre la copie ?',
    a: 'Oui. Les URLs des images expirent en 5 minutes, le clic droit est désactivé sur le lecteur, et l\'embedding en iframe est bloqué. La copie reste techniquement possible (capture d\'écran) mais nous luttons activement contre le partage illégal.',
  },
];

export default function HelpPage() {
  return (
    <>
      <Navbar />
      <section className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="font-display text-4xl font-bold mb-2">Aide & FAQ</h1>
        <p className="text-ink/60">Les réponses aux questions les plus fréquentes.</p>

        <div className="mt-10 space-y-4">
          {FAQ.map((item, i) => (
            <details
              key={i}
              className="group rounded-2xl border border-black/5 bg-white p-5 open:bg-brand/5 transition"
            >
              <summary className="font-medium cursor-pointer flex justify-between items-center">
                {item.q}
                <span className="text-ink/30 group-open:rotate-45 transition">+</span>
              </summary>
              <div className="mt-3 text-ink/70 text-sm leading-relaxed">{item.a}</div>
            </details>
          ))}
        </div>

        <div className="mt-12 rounded-2xl border border-brand/20 bg-brand/5 p-6 text-center">
          <p className="font-medium">Ta question n'est pas là ?</p>
          <Link
            href="/contact"
            className="inline-block mt-3 rounded-full bg-brand text-white px-6 py-3 hover:bg-brand-600 transition"
          >
            Nous contacter
          </Link>
        </div>
      </section>
      <Footer />
    </>
  );
}
