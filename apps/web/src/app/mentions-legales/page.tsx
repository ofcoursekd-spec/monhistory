import { LegalPage } from '@/components/LegalPage';

export const metadata = { title: 'Mentions Légales' };

export default function MentionsPage() {
  return (
    <LegalPage title="Mentions Légales">
      <p className="text-sm bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-900">
        ⚠ <strong>Template à personnaliser.</strong>
      </p>

      <h2 className="font-display text-2xl font-bold mt-8">Éditeur</h2>
      <p>
        <strong>Raison sociale</strong> : [Nom de la société]<br />
        <strong>Forme juridique</strong> : [SARL, SA, auto-entrepreneur…]<br />
        <strong>Siège social</strong> : [Adresse complète]<br />
        <strong>Numéro d'immatriculation</strong> : [RCCM / SIRET / autre]<br />
        <strong>Capital social</strong> : [Montant si applicable]<br />
        <strong>Email</strong> : [contact@monhistory.app]<br />
        <strong>Téléphone</strong> : [+225 XX XX XX XX]
      </p>

      <h2 className="font-display text-2xl font-bold mt-8">Directeur de la publication</h2>
      <p>[Prénom Nom]</p>

      <h2 className="font-display text-2xl font-bold mt-8">Hébergement</h2>
      <p>
        <strong>Frontend</strong> : Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, USA<br />
        <strong>Base de données et stockage</strong> : Supabase, Inc.<br />
        <strong>Paiements</strong> : GeniusPay (https://geniuspay.ci)
      </p>

      <h2 className="font-display text-2xl font-bold mt-8">Propriété intellectuelle</h2>
      <p>
        L'ensemble du contenu présent sur la Plateforme (illustrations, textes, code, design,
        logos) est protégé par le droit d'auteur. Toute reproduction, totale ou partielle, sans
        autorisation écrite préalable est strictement interdite.
      </p>

      <h2 className="font-display text-2xl font-bold mt-8">Crédits</h2>
      <p>
        Conception & développement : [Nom ou agence]<br />
        Illustrations : voir crédits de chaque livre dans le catalogue.
      </p>
    </LegalPage>
  );
}
