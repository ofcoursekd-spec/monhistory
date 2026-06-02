import Link from 'next/link';

export function Footer() {
  return (
    <footer className="mt-20 border-t border-black/5 bg-cream/50">
      <div className="mx-auto max-w-6xl px-4 py-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
        <div>
          <p className="font-display text-lg font-bold text-brand">MonHistory</p>
          <p className="text-ink/60 mt-2 text-xs">
            Des histoires qui touchent. BD émotionnelles africaines.
          </p>
        </div>
        <div>
          <p className="font-semibold mb-3">Découvrir</p>
          <ul className="space-y-2 text-ink/70">
            <li><Link href="/catalogue" className="hover:text-brand">Catalogue</Link></li>
            <li><Link href="/abonnement" className="hover:text-brand">Abonnement</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-semibold mb-3">Aide</p>
          <ul className="space-y-2 text-ink/70">
            <li><Link href="/aide" className="hover:text-brand">FAQ</Link></li>
            <li><Link href="/contact" className="hover:text-brand">Contact</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-semibold mb-3">Légal</p>
          <ul className="space-y-2 text-ink/70">
            <li><Link href="/cgu" className="hover:text-brand">CGU</Link></li>
            <li><Link href="/cgv" className="hover:text-brand">CGV</Link></li>
            <li><Link href="/confidentialite" className="hover:text-brand">Confidentialité</Link></li>
            <li><Link href="/mentions-legales" className="hover:text-brand">Mentions légales</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-black/5 py-4 text-center text-xs text-ink/40">
        © {new Date().getFullYear()} MonHistory — Tous droits réservés.
      </div>
    </footer>
  );
}
