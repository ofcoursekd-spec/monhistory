import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { JWT } from 'google-auth-library';

/**
 * FCM HTTP v1 sans firebase-admin.
 * Requiert un service account JSON Google (champ `private_key` + `client_email` + `project_id`).
 *
 * Variables d'environnement :
 *   FCM_PROJECT_ID        — id du projet Google (ex: monhistory-push)
 *   FCM_CLIENT_EMAIL      — email du service account
 *   FCM_PRIVATE_KEY       — clé privée PEM (échapper les \n côté hébergeur)
 *
 * Côté mobile, Firebase Messaging reste utilisé comme transport (FCM Android,
 * APNs proxifié pour iOS) — c'est le mode standard et il n'oblige pas à utiliser
 * Firebase pour le reste du backend.
 */
@Injectable()
export class FcmProvider {
  private readonly logger = new Logger(FcmProvider.name);
  private readonly projectId: string;
  private readonly jwt?: JWT;
  private readonly url: string;

  constructor(config: ConfigService) {
    this.projectId = config.get<string>('FCM_PROJECT_ID') ?? '';
    const clientEmail = config.get<string>('FCM_CLIENT_EMAIL');
    const privateKey = config.get<string>('FCM_PRIVATE_KEY')?.replace(/\\n/g, '\n');
    this.url = `https://fcm.googleapis.com/v1/projects/${this.projectId}/messages:send`;

    if (clientEmail && privateKey && this.projectId) {
      this.jwt = new JWT({
        email: clientEmail,
        key: privateKey,
        scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
      });
    } else {
      this.logger.warn('Credentials FCM manquants — push en mode stub');
    }
  }

  async send(tokens: string[], title: string, body: string, data?: Record<string, string>) {
    if (!tokens.length) return { successCount: 0, failureCount: 0 };
    if (!this.jwt) {
      this.logger.log(`[STUB FCM] → ${tokens.length} tokens — ${title}`);
      return { successCount: tokens.length, failureCount: 0 };
    }

    const { token: accessToken } = await this.jwt.getAccessToken();
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };

    // FCM HTTP v1 envoie 1 message par token. On parallélise.
    const results = await Promise.allSettled(
      tokens.map((token) =>
        axios.post(
          this.url,
          { message: { token, notification: { title, body }, data } },
          { headers },
        ),
      ),
    );
    const successCount = results.filter((r) => r.status === 'fulfilled').length;
    return { successCount, failureCount: results.length - successCount };
  }
}
