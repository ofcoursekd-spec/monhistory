import { LegalPage } from '@/components/LegalPage';

export const metadata = { title: 'Conditions Générales de Vente' };

export default function CGVPage() {
  return (
    <LegalPage title="Conditions Générales de Vente">
      <p className="text-sm bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-900">
        ⚠ <strong>Template à personnaliser.</strong> Adapte les sections [entre crochets].
      </p>

      <h2 className="font-display text-2xl font-bold mt-8">1. Vendeur</h2>
      <p>
        Les présentes CGV régissent les ventes effectuées sur la Plateforme MonHistory exploitée
        par [Raison sociale], [Forme juridique], siège social [Adresse], immatriculée
        [N° d'immatriculation].
      </p>

      <h2 className="font-display text-2xl font-bold mt-8">2. Produits proposés</h2>
      <ul className="list-disc pl-6 space-y-2">
        <li>
          <strong>Abonnement Premium</strong> à 1 999 FCFA par mois, renouvelable mensuellement
          jusqu'à annulation par l'Utilisateur.
        </li>
        <li>
          <strong>Achat de livres à l'unité</strong> au prix indiqué sur chaque fiche produit.
        </li>
      </ul>

      <h2 className="font-display text-2xl font-bold mt-8">3. Prix</h2>
      <p>
        Les prix sont affichés en francs CFA (XOF) toutes taxes comprises. [Raison sociale] se
        réserve le droit de modifier les prix à tout moment ; les modifications n'affectent pas
        les commandes déjà passées.
      </p>

      <h2 className="font-display text-2xl font-bold mt-8">4. Paiement</h2>
      <p>
        Les paiements sont traités par notre prestataire <strong>GeniusPay</strong>
        (https://geniuspay.ci) et acceptent les moyens suivants : Wave, Orange Money, MTN Mobile
        Money, Moov Money et cartes bancaires Visa/Mastercard.
      </p>
      <p>
        Aucune donnée bancaire n'est stockée sur nos serveurs. La transaction est sécurisée par
        chiffrement TLS et signature HMAC pour les notifications serveur.
      </p>

      <h2 className="font-display text-2xl font-bold mt-8">5. Livraison numérique</h2>
      <p>
        L'accès au contenu est instantané après confirmation du paiement par notre prestataire
        de paiement. Aucune livraison physique n'est effectuée.
      </p>

      <h2 className="font-display text-2xl font-bold mt-8">6. Droit de rétractation</h2>
      <p>
        Conformément à la législation applicable aux contenus numériques fournis sur un support
        immatériel et dont l'exécution a commencé après accord exprès du consommateur, le droit
        de rétractation ne peut être exercé. L'Utilisateur reconnaît avoir donné son accord
        exprès pour la fourniture immédiate du contenu et avoir renoncé à son droit de
        rétractation au moment de la validation du paiement.
      </p>

      <h2 className="font-display text-2xl font-bold mt-8">7. Annulation d'abonnement</h2>
      <p>
        L'Utilisateur peut annuler son abonnement à tout moment depuis son profil. L'annulation
        prend effet à la fin de la période en cours déjà payée — aucun remboursement prorata
        n'est effectué.
      </p>

      <h2 className="font-display text-2xl font-bold mt-8">8. Réclamations & remboursements</h2>
      <p>
        Pour toute réclamation, contacte-nous à [email de support]. Les demandes de remboursement
        sont étudiées au cas par cas (paiement par erreur, contenu non délivré, etc.) et
        traitées sous 7 jours ouvrés.
      </p>

      <h2 className="font-display text-2xl font-bold mt-8">9. Service client</h2>
      <p>
        Email : [email de support]<br />
        Délai de réponse moyen : 48h ouvrées.
      </p>
    </LegalPage>
  );
}
