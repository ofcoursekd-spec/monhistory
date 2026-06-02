# MonHistory — Web (Next.js 15)

App publique : catalogue, fiche livre, lecteur vertical Webtoon, page abonnement.

## Démarrage

```bash
cd apps/web
cp .env.example .env.local
npm install
npm run dev
```

→ http://localhost:3001 (le backend doit tourner sur http://localhost:3000)

## Pages

- `/` — landing + nouveautés (SSR, revalidate 60s)
- `/catalogue` — filtre par catégorie / recherche
- `/livre/[slug]` — fiche livre + liste des chapitres (SEO + Open Graph)
- `/lire/[chapterId]` — **lecteur vertical** style Webtoon (Framer Motion, dark mode, anti-piratage léger via `onContextMenu`, progression sauvegardée toutes les 800ms)
- `/abonnement` — plans Premium (2 000 / 5 000 / 18 000 FCFA)
- `/sitemap.xml` + `/robots.txt` générés dynamiquement

## Stack

- Next 15 (App Router, RSC)
- Tailwind avec design tokens MonHistory (`#E91E63`, `#7C4DFF`)
- Framer Motion pour transitions et reveal au scroll
- Polices : Inter + Playfair Display
- Zustand prêt pour le store auth (à câbler)

## TODO

- Auth (login/register + Google OAuth via `/auth/oauth`) avec store Zustand persisté
- Pages `/bibliotheque`, `/favoris`, `/profil`
- Dashboard `/admin/*` (CRUD livres/chapitres avec drag&drop pages)
- Composants Shadcn UI installés (`npx shadcn add button card dialog`)
- Branchement réel webhook GeniusPay pour redirection après paiement
