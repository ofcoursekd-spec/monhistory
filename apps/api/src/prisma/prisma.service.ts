import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';

/**
 * Erreurs Prisma transitoires qu'on retente :
 *  P1001 : impossible de joindre la DB (réseau)
 *  P1002 : timeout
 *  P1008 : opération timeout
 *  P1017 : serveur a fermé la connexion
 */
const RETRYABLE_PRISMA_CODES = new Set(['P1001', 'P1002', 'P1008', 'P1017']);

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super();
    // Middleware Prisma : retry automatique sur erreurs réseau transientes.
    this.$use(async (params, next) => {
      let lastErr: unknown;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          return await next(params);
        } catch (err) {
          lastErr = err;
          if (err instanceof Prisma.PrismaClientKnownRequestError && RETRYABLE_PRISMA_CODES.has(err.code)) {
            this.logger.warn(
              `Prisma ${params.model ?? ''}.${params.action} a échoué (${err.code}) — retry ${attempt + 1}/2`,
            );
            await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
            continue;
          }
          // Erreur Prisma initialization (P1001 souvent enveloppé)
          if (err instanceof Prisma.PrismaClientInitializationError) {
            this.logger.warn(`Prisma init failed — retry ${attempt + 1}/2`);
            await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
            continue;
          }
          throw err;
        }
      }
      throw lastErr;
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
