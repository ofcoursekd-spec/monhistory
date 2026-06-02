import {
  Injectable,
  InternalServerErrorException,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { Agent as HttpsAgent } from 'node:https';

/** Agent HTTPS persistant : keep-alive + TLS 1.2+ (Cloudflare-friendly). */
const httpsAgent = new HttpsAgent({
  keepAlive: true,
  keepAliveMsecs: 30_000,
  maxSockets: 10,
  // Bypass strict revocation check (la machine locale ne peut pas joindre les serveurs OCSP).
  // Le certificat reste vérifié contre la chaîne de confiance — on ne désactive PAS la validité.
  rejectUnauthorized: true,
});

/** UA navigateur : évite que Cloudflare classe nos requêtes comme bot et drop la connexion. */
const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36';

/**
 * Provider GeniusPay — https://geniuspay.ci
 *
 * Conforme à la doc officielle (https://geniuspay.ci/docs/api) :
 *   - Base URL    : https://geniuspay.ci/api/v1/merchant
 *   - Auth        : X-API-Key (pk_*) + X-API-Secret (sk_*)  — PAS Authorization Bearer
 *   - Checkout    : POST /payments sans payment_method → renvoie data.checkout_url
 *   - Webhook sig : HMAC-SHA256(timestamp + "." + body, whsec_*)
 *                   headers X-Webhook-Signature + X-Webhook-Timestamp (anti-rejeu 5min)
 *   - Events      : payment.success / .failed / .cancelled / .expired / .refunded
 */

interface CreateCheckoutInput {
  internalPaymentId: string;
  amount: number;
  currency: string;
  description: string;
  customerEmail: string;
  customerName?: string;
  customerPhone?: string;
  successUrl: string;
  errorUrl: string;
  metadata?: Record<string, string | number>;
}

interface CreateCheckoutResult {
  providerRef: string; // "MTX-..."
  checkoutUrl: string;
}

const WEBHOOK_MAX_AGE_SECONDS = 5 * 60;

@Injectable()
export class GeniusPayProvider {
  private readonly logger = new Logger(GeniusPayProvider.name);
  private readonly baseUrl: string;
  private readonly publicKey: string;
  private readonly secretKey: string;
  private readonly webhookSecret: string;
  private readonly isProduction: boolean;

  constructor(config: ConfigService) {
    this.baseUrl =
      config.get<string>('GENIUSPAY_BASE_URL') ?? 'https://geniuspay.ci/api/v1/merchant';
    this.publicKey = config.get<string>('GENIUSPAY_PUBLIC_KEY') ?? '';
    this.secretKey = config.get<string>('GENIUSPAY_SECRET_KEY') ?? '';
    this.webhookSecret = config.get<string>('GENIUSPAY_WEBHOOK_SECRET') ?? '';
    this.isProduction = config.get<string>('NODE_ENV') === 'production';

    if (this.isProduction && (!this.publicKey || !this.secretKey || !this.webhookSecret)) {
      throw new Error(
        'GENIUSPAY_PUBLIC_KEY, GENIUSPAY_SECRET_KEY et GENIUSPAY_WEBHOOK_SECRET sont requis en production.',
      );
    }
  }

  async createCheckout(params: CreateCheckoutInput): Promise<CreateCheckoutResult> {
    if (!this.publicKey || !this.secretKey) {
      this.logger.warn('GeniusPay non configuré — checkout stubé (DEV uniquement)');
      if (this.isProduction) {
        throw new InternalServerErrorException('Provider de paiement non configuré');
      }
      return {
        providerRef: `stub_${params.internalPaymentId}`,
        checkoutUrl: `https://stub.local/pay/${params.internalPaymentId}`,
      };
    }

    const body = {
      amount: params.amount,
      currency: params.currency,
      description: params.description,
      customer: {
        email: params.customerEmail,
        name: params.customerName,
        phone: params.customerPhone,
      },
      success_url: params.successUrl,
      error_url: params.errorUrl,
      metadata: {
        ...(params.metadata ?? {}),
        internal_payment_id: params.internalPaymentId,
      },
    };

    const requestConfig: AxiosRequestConfig = {
      headers: {
        'X-API-Key': this.publicKey,
        'X-API-Secret': this.secretKey,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'User-Agent': BROWSER_UA,
      },
      timeout: 30_000,
      httpsAgent,
    };

    try {
      const { data } = await this.postWithRetry(`${this.baseUrl}/payments`, body, requestConfig);

      // Réponse: { success: true, data: { reference, checkout_url, payment_url, ... } }
      const payload = (data?.data ?? data) as {
        reference?: string;
        checkout_url?: string;
        payment_url?: string;
      };
      const url = payload.checkout_url ?? payload.payment_url;
      if (!payload.reference || !url) {
        this.logger.error(`Réponse GeniusPay invalide : ${JSON.stringify(data)}`);
        throw new ServiceUnavailableException('Réponse GeniusPay invalide');
      }
      return { providerRef: payload.reference, checkoutUrl: url };
    } catch (err) {
      if (err instanceof ServiceUnavailableException) throw err;
      const ax = err as AxiosError;
      this.logger.error(
        `createCheckout failed: ${ax.response?.status} ${
          ax.response?.data ? JSON.stringify(ax.response.data) : ax.message
        }`,
      );
      throw new InternalServerErrorException('Échec création du paiement GeniusPay');
    }
  }

  /**
   * Vérifie la signature HMAC-SHA256 + anti-rejeu (5 min).
   *
   * Format officiel : signature = HMAC-SHA256(timestamp + "." + body, secret).
   * On essaie d'abord le raw body, puis JSON.stringify(parsed) en fallback
   * (au cas où le provider re-encode le payload entre l'envoi et la réception).
   */
  verifyWebhook(
    rawBody: string,
    parsedBody: unknown,
    signature: string | undefined,
    timestamp: string | undefined,
  ): boolean {
    if (!this.webhookSecret) {
      this.logger.warn('Webhook secret manquant — signature non vérifiée (DEV ONLY)');
      return !this.isProduction;
    }
    if (!signature || !timestamp) return false;

    const ts = Number(timestamp);
    if (!Number.isFinite(ts)) return false;
    const ageSec = Math.abs(Math.floor(Date.now() / 1000) - ts);
    if (ageSec > WEBHOOK_MAX_AGE_SECONDS) {
      this.logger.warn(`Webhook timestamp trop ancien (${ageSec}s) — rejeté`);
      return false;
    }

    const reEncoded = JSON.stringify(parsedBody);
    const candidates = [
      `${timestamp}.${rawBody}`,
      `${timestamp}.${reEncoded}`,
      rawBody,
      reEncoded,
    ];
    for (const candidate of candidates) {
      const expected = createHmac('sha256', this.webhookSecret).update(candidate).digest('hex');
      if (this.constantTimeEquals(expected, signature)) return true;
    }
    // En dev, log les détails pour pouvoir aligner sur le format exact de GeniusPay.
    if (!this.isProduction) {
      const debug = candidates.map((c, i) => ({
        n: i,
        first40: c.slice(0, 40),
        len: c.length,
        hmac: createHmac('sha256', this.webhookSecret).update(c).digest('hex').slice(0, 16),
      }));
      this.logger.warn(
        `Signature webhook ne matche aucun candidat. signature reçue=${signature.slice(0, 16)}..., candidats=${JSON.stringify(debug)}`,
      );
    }
    return false;
  }

  /**
   * Wrapper axios.post avec 2 retries sur erreurs réseau transientes :
   *  - ECONNRESET / socket hang up (Cloudflare drop)
   *  - ECONNABORTED (timeout)
   *  - ENETUNREACH / ETIMEDOUT
   * Les erreurs HTTP applicatives (4xx/5xx) ne sont PAS retentées.
   */
  private async postWithRetry(url: string, body: unknown, config: AxiosRequestConfig) {
    const transientCodes = ['ECONNRESET', 'ECONNABORTED', 'ENETUNREACH', 'ETIMEDOUT', 'EPIPE'];
    let lastErr: unknown;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        return await axios.post(url, body, config);
      } catch (err) {
        lastErr = err;
        const ax = err as AxiosError;
        const code = ax.code ?? '';
        const isTransient =
          !ax.response &&
          (transientCodes.includes(code) ||
            /socket hang up|disconnected before/i.test(ax.message ?? ''));
        if (!isTransient) throw err;
        this.logger.warn(
          `GeniusPay HTTP transient (${code || ax.message}) — retry ${attempt + 1}/2 dans 1s`,
        );
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
      }
    }
    throw lastErr;
  }

  private constantTimeEquals(a: string, b: string): boolean {
    try {
      const bufA = Buffer.from(a, 'hex');
      const bufB = Buffer.from(b, 'hex');
      return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
    } catch {
      return false;
    }
  }
}
