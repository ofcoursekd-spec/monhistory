import { LegalPage } from '@/components/LegalPage';

export const metadata = { title: 'Conditions Générales d\'Utilisation' };

export default function CGUPage() {
  return (
    <LegalPage title="Conditions Générales d'Utilisation">
      <p className="text-sm bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-900">
        ⚠ <strong>Template à personnaliser.</strong> Remplace les passages [entre crochets] par
        tes informations légales réelles avant de mettre en ligne pour le public.
      </p>

      <h2 className="font-display text-2xl font-bold mt-8">1. Objet</h2>
      <p>
        Les présentes Conditions Générales d'Utilisation (« CGU ») régissent l'utilisation de la
        plateforme MonHistory (« la Plateforme ») éditée par [Raison sociale], dont le siège social
        est situé [Adresse], permettant aux utilisateurs (« Utilisateurs ») de consulter et lire
        des bandes dessinées numériques.
      </p>

      <h2 className="font-display text-2xl font-bold mt-8">2. Acceptation</h2>
      <p>
        L'inscription sur la Plateforme vaut acceptation pleine et entière des présentes CGU.
        Si l'Utilisateur n'accepte pas ces conditions, il ne doit pas utiliser la Plateforme.
      </p>

      <h2 className="font-display text-2xl font-bold mt-8">3. Compte utilisateur</h2>
      <p>
        L'Utilisateur crée un compte personnel sécurisé par un mot de passe. Il est responsable
        de la confidentialité de ses identifiants. Toute activité réalisée depuis son compte est
        réputée effectuée par lui.
      </p>
      <p>L'Utilisateur peut supprimer son compte à tout moment depuis son espace profil.</p>

      <h2 className="font-display text-2xl font-bold mt-8">4. Accès aux contenus</h2>
      <ul className="list-disc pl-6 space-y-2">
        <li>
          <strong>Accès gratuit</strong> : les 3 premières pages du chapitre 1 de chaque livre
          sont accessibles sans paiement.
        </li>
        <li>
          <strong>Abonnement Premium</strong> : donne accès à l'intégralité du catalogue pendant
          la durée souscrite.
        </li>
        <li>
          <strong>Achat à l'unité</strong> : accès permanent au livre acheté.
        </li>
      </ul>

      <h2 className="font-display text-2xl font-bold mt-8">5. Propriété intellectuelle</h2>
      <p>
        Tous les contenus disponibles sur la Plateforme (illustrations, textes, marques, code,
        design) sont protégés par le droit d'auteur et restent la propriété exclusive de
        [Raison sociale] ou de ses ayants droit. Toute reproduction, diffusion ou utilisation non
        autorisée est strictement interdite et peut faire l'objet de poursuites.
      </p>

      <h2 className="font-display text-2xl font-bold mt-8">6. Comportement de l'utilisateur</h2>
      <p>L'Utilisateur s'engage à ne pas :</p>
      <ul className="list-disc pl-6 space-y-2">
        <li>Capturer, copier, télécharger ou partager les contenus de la Plateforme</li>
        <li>Tenter de contourner les mesures techniques de protection</li>
        <li>Utiliser la Plateforme à des fins illégales ou commerciales non autorisées</li>
        <li>Publier des commentaires diffamatoires, haineux ou illégaux</li>
      </ul>

      <h2 className="font-display text-2xl font-bold mt-8">7. Responsabilité</h2>
      <p>
        La Plateforme est fournie « telle quelle ». [Raison sociale] s'efforce d'assurer un accès
        continu mais ne garantit pas l'absence d'interruption, notamment pour maintenance.
      </p>

      <h2 className="font-display text-2xl font-bold mt-8">8. Modification des CGU</h2>
      <p>
        [Raison sociale] se réserve le droit de modifier les présentes CGU. Les Utilisateurs
        seront informés des modifications substantielles par email.
      </p>

      <h2 className="font-display text-2xl font-bold mt-8">9. Droit applicable</h2>
      <p>
        Les présentes CGU sont régies par le droit [Pays]. Tout litige relève des tribunaux
        compétents de [Ville].
      </p>
    </LegalPage>
  );
}
