# MonHistory — Backend API

Backend NestJS + Prisma + PostgreSQL pour la plateforme MonHistory.

## Prérequis

- Node 20+
- PostgreSQL 15+ (en local ou Docker)

## Démarrage

```bash
cd apps/api
cp .env.example .env
# éditer .env (notamment DATABASE_URL et JWT_*_SECRET)

npm install
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run seed
npm run start:dev
```

- API : http://localhost:3000/api/v1
- Swagger : http://localhost:3000/docs

## Comptes de démo (après `npm run seed`)

| Rôle  | Email                     | Mot de passe |
|-------|---------------------------|--------------|
| Admin | admin@monhistory.app      | admin1234    |
| Lecteur | reader@monhistory.app   | reader1234   |

## Architecture des modules

```
src/
├── auth/           JWT + refresh tokens en DB (rotation, révocation)
├── users/          /users/me, mise à jour profil
├── books/          CRUD + recommandations (similar / popular / newest)
├── chapters/       CRUD + lecture (vérifie l'accès via AccessService)
├── pages/          CRUD + reorder (drag & drop admin) + upload URLs signées
├── access/         Règle centrale : 3 chapitres gratuits OU sub OU achat OU admin
├── subscriptions/  Plans, mes abos, souscription (→ Payments), annulation
├── purchases/      Achat unitaire d'un livre (→ Payments)
├── payments/       Orchestrateur + provider GeniusPay + webhook signé
├── favorites/      Mes favoris
├── reading/        Reprise de lecture, progression par chapitre
├── admin/          KPIs, users, payments (rôle ADMIN requis)
├── storage/        Wrapper S3/R2 — URLs signées GET/PUT (anti-piratage)
├── prisma/         PrismaService global
└── common/         Decorators (@Public, @Roles, @CurrentUser)
```

## Points techniques importants

- **Auth globale par défaut** : `JwtAuthGuard` est `APP_GUARD`. Marquer une route publique avec `@Public()`.
- **Rate limiting** : `ThrottlerGuard` global, 120 requêtes / minute / IP.
- **Refresh tokens** : stockés hashés (SHA-256) en DB, rotation à chaque refresh, révocables.
- **Access control livre** : passer par `AccessService.assertCanReadChapter(userId, chapterId)` partout où on sert du contenu protégé. Ne jamais dupliquer la règle.
- **Images** : on stocke des `imageKey` (clés S3/R2) en DB et on sert des URLs signées à TTL court (300s par défaut). Aucune URL CDN brute n'est exposée.
- **Webhooks** : la vérification HMAC est en place côté provider GeniusPay. À activer côté Express (raw body) au moment de brancher pour de vrai.

## Endpoints clés

| Méthode | Route | Auth |
|---|---|---|
| POST | `/auth/register` `/auth/login` `/auth/refresh` | public |
| POST | `/auth/logout` | user |
| GET  | `/books?category&search&page&limit` | public |
| GET  | `/books/:slug` | public |
| GET  | `/books/me/recommendations` | user |
| GET  | `/chapters/:id` | user (vérifie l'accès) |
| GET  | `/subscriptions/plans` | public |
| GET  | `/subscriptions/me` | user |
| POST | `/subscriptions` | user |
| POST | `/purchases` | user |
| GET  | `/reading/continue` | user |
| POST | `/reading/progress` | user |
| GET  | `/favorites` `POST /:bookId` `DELETE /:bookId` | user |
| POST | `/payments/webhooks/geniuspay` | public (signé) |
| GET  | `/admin/kpis` `/admin/users` `/admin/payments` | admin |

## TODO immédiat (itérations suivantes)

- Stratégies OAuth (Google / Facebook / Apple) → endpoints `/auth/oauth/:provider`.
- Module **commentaires** et **réactions** (modèles déjà présents en DB).
- Module **notifications** push (FCM + APNS) + email fin d'abonnement.
- Job CRON : marquer subscriptions `EXPIRED` quand `endsAt` est passé.
- Webhook Express raw-body middleware pour vérification HMAC exacte.
- Tests e2e (auth, accès payant, paiement webhook).
- Dockerfile + docker-compose (Postgres + API).
