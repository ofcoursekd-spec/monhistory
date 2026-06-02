import { LegalPage } from '@/components/LegalPage';

export const metadata = { title: 'Politique de Confidentialité' };

export default function PrivacyPage() {
  return (
    <LegalPage title="Politique de Confidentialité">
      <p className="text-sm bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-900">
        ⚠ <strong>Template à personnaliser.</strong>
      </p>

      <h2 className="font-display text-2xl font-bold mt-8">1. Responsable du traitement</h2>
      <p>
        Le responsable du traitement des données est [Raison sociale], [Adresse], joignable à
        [email DPO/support].
      </p>

      <h2 className="font-display text-2xl font-bold mt-8">2. Données collectées</h2>
      <ul className="list-disc pl-6 space-y-2">
        <li>
          <strong>Identité</strong> : prénom, adresse email — fournis lors de l'inscription.
        </li>
        <li>
          <strong>Authentification</strong> : mot de passe chiffré (Argon2), tokens d'accès et
          de session.
        </li>
        <li>
          <strong>Paiements</strong> : montant, référence, statut — aucune donnée bancaire n'est
          stockée sur nos serveurs (gérées par GeniusPay).
        </li>
        <li>
          <strong>Usage</strong> : pages lues, livres favoris, dernière position de lecture
          (uniquement pour la fonction « continuer la lecture »).
        </li>
        <li>
          <strong>Données techniques</strong> : adresse IP, type de navigateur, identifiant
          d'appareil (mobile) pour les notifications push.
        </li>
      </ul>

      <h2 className="font-display text-2xl font-bold mt-8">3. Finalités</h2>
      <ul className="list-disc pl-6 space-y-2">
        <li>Fournir l'accès à la Plateforme et exécuter les contrats d'abonnement/achat</li>
        <li>Envoyer les emails transactionnels (confirmation, reçu, reset password)</li>
        <li>Améliorer la Plateforme (statistiques d'usage anonymisées)</li>
        <li>Sécurité (détection de fraude, anti-tampering paiement)</li>
      </ul>

      <h2 className="font-display text-2xl font-bold mt-8">4. Base légale</h2>
      <p>
        Le traitement repose sur l'exécution du contrat (CGV) et l'intérêt légitime de
        [Raison sociale] pour la sécurité et l'amélioration du service.
      </p>

      <h2 className="font-display text-2xl font-bold mt-8">5. Destinataires</h2>
      <p>
        Tes données ne sont jamais vendues. Elles sont partagées uniquement avec nos
        sous-traitants techniques :
      </p>
      <ul className="list-disc pl-6 space-y-2">
        <li><strong>Supabase</strong> (hébergement base de données et stockage fichiers) — UE</li>
        <li><strong>Vercel</strong> (hébergement frontend) — UE/US</li>
        <li><strong>GeniusPay</strong> (traitement des paiements) — Côte d'Ivoire</li>
        <li><strong>Resend</strong> (envoi des emails transactionnels) — UE</li>
        <li><strong>Firebase Cloud Messaging</strong> (notifications push) — US</li>
      </ul>

      <h2 className="font-display text-2xl font-bold mt-8">6. Durée de conservation</h2>
      <ul className="list-disc pl-6 space-y-2">
        <li>Compte utilisateur : tant que le compte est actif</li>
        <li>Données de paiement : 10 ans (obligation comptable)</li>
        <li>Logs techniques : 1 an maximum</li>
      </ul>

      <h2 className="font-display text-2xl font-bold mt-8">7. Tes droits</h2>
      <p>Conformément à la réglementation en vigueur, tu disposes des droits suivants :</p>
      <ul className="list-disc pl-6 space-y-2">
        <li>Accès à tes données</li>
        <li>Rectification</li>
        <li>Effacement (« droit à l'oubli »)</li>
        <li>Portabilité</li>
        <li>Opposition au traitement</li>
      </ul>
      <p>
        Pour exercer ces droits, écris à [email DPO/support]. Réponse sous 30 jours.
      </p>

      <h2 className="font-display text-2xl font-bold mt-8">8. Cookies</h2>
      <p>
        Nous utilisons uniquement des cookies techniques nécessaires au fonctionnement
        (authentification). Aucun cookie de tracking publicitaire.
      </p>

      <h2 className="font-display text-2xl font-bold mt-8">9. Sécurité</h2>
      <p>
        Mots de passe hachés (Argon2), HTTPS partout, URLs signées à TTL court pour les images,
        signature HMAC sur les webhooks, isolation des secrets côté serveur.
      </p>
    </LegalPage>
  );
}
