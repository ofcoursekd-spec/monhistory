import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

import {
  paymentReceiptHtml,
  passwordResetHtml,
  welcomeHtml,
  type PaymentReceiptData,
} from './templates';

/**
 * Envoi d'emails transactionnels via Resend.
 *  - Sans clé : log les emails en console (dev safety net, ne plante pas).
 *  - Avec clé : envoie vraiment.
 *
 * Resend gratuit = 100 emails/jour, 3000/mois — largement suffisant pour démarrer.
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend?: Resend;
  private readonly from: string;
  private readonly siteUrl: string;
  private readonly supportEmail: string;

  constructor(config: ConfigService) {
    const apiKey = config.get<string>('RESEND_API_KEY');
    this.from = config.get<string>('EMAIL_FROM') ?? 'MonHistory <onboarding@resend.dev>';
    this.siteUrl = config.get<string>('PUBLIC_SITE_URL') ?? 'http://localhost:3001';
    this.supportEmail = config.get<string>('SUPPORT_EMAIL') ?? 'support@monhistory.app';
    if (apiKey) {
      this.resend = new Resend(apiKey);
    } else {
      this.logger.warn('RESEND_API_KEY manquante — emails loggés en console (DEV ONLY)');
    }
  }

  async sendWelcome(to: string, name: string) {
    return this.send(to, 'Bienvenue sur MonHistory ✨', welcomeHtml({ name, siteUrl: this.siteUrl }));
  }

  async sendPasswordReset(to: string, resetUrl: string) {
    return this.send(
      to,
      'Réinitialiser ton mot de passe MonHistory',
      passwordResetHtml({ resetUrl, supportEmail: this.supportEmail }),
    );
  }

  async sendPaymentReceipt(to: string, data: PaymentReceiptData) {
    return this.send(
      to,
      `Reçu MonHistory — ${data.description}`,
      paymentReceiptHtml({ ...data, siteUrl: this.siteUrl, supportEmail: this.supportEmail }),
    );
  }

  private async send(to: string, subject: string, html: string) {
    if (!this.resend) {
      this.logger.log(`[STUB EMAIL] → ${to} | ${subject}`);
      return { id: 'stub' };
    }
    try {
      const res = await this.resend.emails.send({ from: this.from, to, subject, html });
      if (res.error) {
        this.logger.error(`Resend error: ${JSON.stringify(res.error)}`);
        return null;
      }
      return res.data;
    } catch (err) {
      this.logger.error(`Resend exception: ${(err as Error).message}`);
      return null;
    }
  }
}
