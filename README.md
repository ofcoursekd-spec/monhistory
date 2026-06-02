# MonHistory

Plateforme SaaS de lecture de livres BD premium par abonnement (marché africain francophone).

## Structure du monorepo

```
MonHistory/
├── apps/
│   ├── api/        # Backend NestJS + Prisma (DB Supabase, Storage Supabase, push FCM HTTP v1)
│   ├── web/        # Frontend Next.js 15 (déployé sur Vercel)
│   └── mobile/     # App Flutter (Android + iOS)
├── .github/workflows/  # CI tests + builds + deploys
├── docker-compose.yml
└── README.md
```

## Stack & hébergement

| Composant | Choix | Hébergeur |
|---|---|---|
| Base de données | Postgres Supabase | Supabase |
| Storage images BD (URLs signées TTL 300s) | Supabase Storage | Supabase |
| Backend API | NestJS + Prisma | Railway / Fly.io / Render (Docker) |
| Push mobile | FCM HTTP v1 (sans firebase-admin) | Google Cloud (service account) |
| Frontend Web | Next.js 15 | **Vercel** |
| App mobile | Flutter | App Store + Play Store |
| Paiement | GeniusPay (Mobile Money FCFA) | — |
| CI/CD | GitHub Actions | GitHub |

> **Pourquoi pas Vercel pour l'API ?** NestJS a des crons (`@nestjs/schedule`), un webhook GeniusPay avec HMAC + raw body, et des connexions Postgres long-lived. Les fonctions serverless de Vercel ne sont pas adaptées. Vercel pour le web, Railway/Fly/Render pour l'API.

## Mise en route — bout en bout

### 1. Supabase

1. Créer un projet sur [supabase.com](https://supabase.com).
2. **Settings → Database → Connection string (URI)** → copier dans `DATABASE_URL`. En prod, utiliser le **Connection pooler** (port 6543).
3. **Settings → API** → noter `Project URL` et `service_role` (jamais l'`anon` côté backend !).
4. **Storage → New bucket** → nom `pages`, **private**.
5. (Optionnel) **Database → Policies** : pas de RLS nécessaire car on accède via service_role depuis le backend uniquement.

### 2. Backend (local puis Railway/Fly/Render)

```bash
cd apps/api
cp .env.example .env
# remplir : DATABASE_URL, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, JWT_*
npm install
npm run prisma:migrate -- --name init
npm run seed
npm run start:dev
```

**Pour déployer** : l'image Docker est buildée et poussée sur `ghcr.io` à chaque push sur `main` ([deploy-api.yml](.github/workflows/deploy-api.yml)). Ensuite, sur ton hébergeur (Railway recommandé pour la simplicité) :
- créer un service depuis l'image GHCR
- copier les variables de `.env.example`
- exposer le port 3000

### 3. Vercel (web)

1. Importer le repo dans Vercel, **Root Directory** = `apps/web`.
2. Vercel détecte Next.js automatiquement.
3. Ajouter les variables d'env : `NEXT_PUBLIC_API_URL` (URL publique du backend), `NEXT_PUBLIC_SITE_URL`.
4. Connecter le domaine custom si besoin.

Chaque PR → preview deployment automatique. Push sur `main` → prod.

### 4. Mobile

```bash
cd apps/mobile
flutter pub get
flutter run --dart-define=API_URL=https://api.monhistory.app/api/v1
```

Pour les push notifications : créer un projet Firebase **uniquement** pour bénéficier de FCM comme transport (le projet Google Cloud expose un service account qu'on utilise côté backend en HTTP v1 sans dépendre du SDK firebase-admin). Coller le `google-services.json` (Android) et `GoogleService-Info.plist` (iOS) dans les dossiers natifs.

### 5. Comptes seed

| Rôle  | Email                     | Mot de passe |
|-------|---------------------------|--------------|
| Admin | admin@monhistory.app      | admin1234    |
| Lecteur | reader@monhistory.app   | reader1234   |

## CI/CD GitHub Actions

- **[ci.yml](.github/workflows/ci.yml)** — sur chaque PR + push main :
  - API : `prisma migrate deploy` + build + tests e2e (Postgres en service container)
  - Web : lint + `next build`
  - Mobile : `flutter analyze`
- **[deploy-api.yml](.github/workflows/deploy-api.yml)** — push main → build & push image Docker sur `ghcr.io/<user>/monhistory/api:latest`
- **[deploy-web.yml](.github/workflows/deploy-web.yml)** — alternative manuelle au déploiement Vercel auto (utile si tu veux gater le déploiement par approval)

Secrets GitHub à configurer (Settings → Secrets and variables → Actions) :
- `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` (uniquement pour `deploy-web.yml`)

## État d'avancement

| Domaine | Statut |
|---|---|
| Schéma Prisma complet (users, books, chapters, pages, subs, purchases, reactions, comments, refs, notifications, DeviceToken) | ✅ |
| Auth JWT + refresh rotatif + RBAC + OAuth Google/Apple/Facebook | ✅ |
| Books / Chapters / Pages (CRUD + reorder + upload Supabase URLs signées) | ✅ |
| Access control centralisé (3 chapitres gratuits / sub / achat / admin) | ✅ |
| Abonnements + Paiements GeniusPay (orchestrateur, webhook HMAC, idempotent) | ✅ |
| Favoris, historique, reactions, commentaires | ✅ |
| Notifications + FCM HTTP v1 (sans firebase-admin) | ✅ |
| Cron expiration / rappel d'abonnement | ✅ |
| Admin (KPIs, users, payments, books, drag&drop pages) | ✅ |
| Storage Supabase + URLs signées | ✅ |
| Swagger `/docs` | ✅ |
| **Web** : landing, catalogue, fiche livre, lecteur Webtoon, auth, bibliothèque, profil, admin | ✅ |
| **Mobile** : auth Riverpod, home, fiche livre, lecteur vertical, mode TikTok, bibliothèque, profil, cache sqflite, push register | ✅ |
| Tests e2e backend | ✅ |
| GitHub Actions CI + image Docker API + deploy Vercel | ✅ |

## Architecture & décisions techniques

- **Prisma** plutôt que TypeORM : meilleure DX, migrations claires.
- **Supabase** comme couche data (Postgres + Storage) au lieu de bare Postgres + S3 — un seul fournisseur, moins de plomberie.
- **JWT maison** plutôt que Supabase Auth : on garde la maîtrise du flow OAuth multi-providers et du RBAC (`Role.ADMIN`), et on évite un couplage fort à l'Auth Supabase qui demande d'autres compromis (PKCE flows, RLS). Supabase n'est ici qu'une base + un bucket.
- **Argon2** pour les mots de passe.
- **Refresh tokens hashés** (SHA-256) avec rotation à chaque refresh, révocables.
- **AccessService** unique centralise la règle d'accès aux chapitres.
- **URLs signées Supabase** TTL 300s pour toutes les images de pages (section 16 anti-piratage).
- **Webhooks GeniusPay** vérifiés HMAC sur raw body + fulfillment idempotent (transaction Prisma).
- **FCM HTTP v1** : on garde FCM comme transport (incontournable sur Android, proxie APNs sur iOS) mais on supprime `firebase-admin` côté backend — un simple JWT signé via `google-auth-library` suffit.

## TODO post-V1 (à finaliser avant production)

- **Credentials à fournir** : Supabase URL/key, GeniusPay merchant/secret, Google/Apple/Facebook OAuth client IDs, FCM service account JSON.
- **Intercepteur refresh token** : ré-émettre automatiquement un access token à la première 401 (web + mobile).
- **Page de retour paiement** : `/paiement/retour?paymentId=…` qui poll `/purchases` ou `/subscriptions/me` après redirection GeniusPay.
- **Init Firebase mobile** : `Firebase.initializeApp()` dans `main.dart` + google-services.json / GoogleService-Info.plist.
- **Migrations Storage** : les images existantes (si import) doivent être uploadées dans le bucket `pages` avec le même schéma de clé que `Page.imageKey`.
- **Couverture tests** : widget tests Flutter sur `ReaderScreen` et `TikTokReaderScreen`.
