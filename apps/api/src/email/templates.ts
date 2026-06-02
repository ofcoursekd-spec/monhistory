/**
 * Templates HTML inline (pas de dépendance lourde type React Email).
 * Style minimaliste, compatible avec la plupart des clients mail.
 */

const BRAND = '#7C1D3F';

const layout = (title: string, body: string, footerLink: { href: string; label: string } | null = null) => `
<!doctype html>
<html lang="fr">
  <head><meta charset="utf-8"></head>
  <body style="margin:0;padding:0;background:#FFFBF5;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#1F1F1F;">
    <div style="max-width:560px;margin:32px auto;padding:32px;background:#fff;border-radius:16px;box-shadow:0 4px 20px rgba(0,0,0,0.04);">
      <h1 style="font-family:Georgia,serif;font-weight:700;color:${BRAND};margin:0 0 24px;font-size:24px;">${title}</h1>
      ${body}
      ${footerLink ? `<p style="margin:32px 0 0;font-size:13px;color:#666;">${footerLink.label} <a href="${footerLink.href}" style="color:${BRAND};">${footerLink.href}</a></p>` : ''}
      <p style="margin:32px 0 0;font-size:11px;color:#999;border-top:1px solid #eee;padding-top:16px;">
        MonHistory — BD émotionnelles africaines · Cet email a été envoyé automatiquement.
      </p>
    </div>
  </body>
</html>`;

export function welcomeHtml(args: { name: string; siteUrl: string }) {
  return layout(
    'Bienvenue parmi nous 💜',
    `
    <p style="font-size:16px;line-height:1.6;">Bonjour ${escape(args.name)},</p>
    <p style="font-size:16px;line-height:1.6;">
      Merci de rejoindre <strong>MonHistory</strong>. Tu peux commencer à lire dès maintenant —
      les 3 premières pages du chapitre 1 de chaque livre sont gratuites.
    </p>
    <p style="margin:32px 0;">
      <a href="${args.siteUrl}/catalogue"
         style="display:inline-block;background:${BRAND};color:#fff;text-decoration:none;padding:12px 24px;border-radius:999px;font-weight:600;">
        Découvrir le catalogue
      </a>
    </p>
    <p style="font-size:14px;color:#666;">
      Pour accéder à tous les livres en illimité, passe en Premium pour 1 999 FCFA / mois.
    </p>
  `,
  );
}

export function passwordResetHtml(args: { resetUrl: string; supportEmail: string }) {
  return layout(
    'Réinitialiser ton mot de passe',
    `
    <p style="font-size:16px;line-height:1.6;">
      Tu as demandé à réinitialiser ton mot de passe MonHistory. Clique sur le bouton
      ci-dessous — le lien expire dans <strong>1 heure</strong>.
    </p>
    <p style="margin:32px 0;">
      <a href="${args.resetUrl}"
         style="display:inline-block;background:${BRAND};color:#fff;text-decoration:none;padding:12px 24px;border-radius:999px;font-weight:600;">
        Choisir un nouveau mot de passe
      </a>
    </p>
    <p style="font-size:14px;color:#666;">
      Si tu n'as pas fait cette demande, ignore cet email — ton mot de passe reste inchangé.
      En cas de doute, contacte-nous à <a href="mailto:${args.supportEmail}" style="color:${BRAND};">${args.supportEmail}</a>.
    </p>
  `,
  );
}

export interface PaymentReceiptData {
  to: string;
  paymentRef: string;
  amount: number; // en FCFA
  description: string;
  paidAt: Date;
  paymentMethod?: string;
}

export function paymentReceiptHtml(
  args: PaymentReceiptData & { siteUrl: string; supportEmail: string },
) {
  const row = (label: string, value: string, strong = false) => `
    <tr>
      <td style="padding:8px 0;color:#666;font-size:14px;">${label}</td>
      <td style="padding:8px 0;text-align:right;font-size:14px;${strong ? 'font-weight:700;' : ''}">${value}</td>
    </tr>`;

  return layout(
    'Reçu de paiement',
    `
    <p style="font-size:16px;line-height:1.6;">Merci pour ton achat ! Voici ton reçu :</p>

    <table style="width:100%;border-collapse:collapse;margin:24px 0;border-top:1px solid #eee;border-bottom:1px solid #eee;">
      ${row('Description', escape(args.description))}
      ${row('Référence', `<code style="background:#f5f5f5;padding:2px 6px;border-radius:4px;font-size:12px;">${escape(args.paymentRef)}</code>`)}
      ${row('Date', args.paidAt.toLocaleString('fr-FR'))}
      ${args.paymentMethod ? row('Mode de paiement', escape(args.paymentMethod)) : ''}
      ${row('Montant', `${args.amount.toLocaleString('fr-FR')} FCFA`, true)}
    </table>

    <p style="margin:32px 0;">
      <a href="${args.siteUrl}/bibliotheque"
         style="display:inline-block;background:${BRAND};color:#fff;text-decoration:none;padding:12px 24px;border-radius:999px;font-weight:600;">
        Aller dans ma bibliothèque
      </a>
    </p>

    <p style="font-size:13px;color:#666;">
      Cet email tient lieu de reçu de paiement. Conserve-le pour tes archives.
      Pour toute question : <a href="mailto:${args.supportEmail}" style="color:${BRAND};">${args.supportEmail}</a>.
    </p>
  `,
  );
}

function escape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
