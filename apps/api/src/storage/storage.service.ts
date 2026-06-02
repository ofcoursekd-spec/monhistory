import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseClient, createClient } from '@supabase/supabase-js';

/**
 * Stockage Supabase Storage. Sert les images de pages via URLs signées à TTL court
 * (anti-piratage, section 16 du cahier des charges).
 *
 * Bucket à créer dans le dashboard Supabase : `pages` (private).
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly client?: SupabaseClient;
  private readonly bucket: string;
  private readonly ttl: number;

  constructor(config: ConfigService) {
    this.bucket = config.get<string>('SUPABASE_BUCKET') ?? 'pages';
    this.ttl = Number(config.get<string>('SUPABASE_SIGNED_URL_TTL_SECONDS') ?? 300);

    const url = config.get<string>('SUPABASE_URL');
    const serviceKey = config.get<string>('SUPABASE_SERVICE_ROLE_KEY');
    if (url && serviceKey) {
      this.client = createClient(url, serviceKey, { auth: { persistSession: false } });
    } else {
      this.logger.warn('Credentials Supabase manquants — URLs en mode stub');
    }
  }

  async signedUrl(key: string): Promise<string> {
    if (!key) return '';
    if (!this.client) return `https://stub.local/${key}?ttl=${this.ttl}`;
    const { data, error } = await this.client.storage
      .from(this.bucket)
      .createSignedUrl(key, this.ttl);
    if (error || !data) {
      this.logger.error(`signedUrl(${key}) → ${error?.message}`);
      return '';
    }
    return data.signedUrl;
  }

  async signedUploadUrl(key: string): Promise<{ url: string; token: string }> {
    if (!this.client) {
      return { url: `https://stub.local/upload/${key}`, token: 'stub' };
    }
    const { data, error } = await this.client.storage
      .from(this.bucket)
      .createSignedUploadUrl(key);
    if (error || !data) throw new Error(error?.message ?? 'upload url failed');
    return { url: data.signedUrl, token: data.token };
  }
}
