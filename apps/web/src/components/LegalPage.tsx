import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

export function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <article className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="font-display text-4xl font-bold mb-2">{title}</h1>
        <p className="text-ink/50 text-sm mb-8">
          Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
        </p>
        <div className="prose prose-ink max-w-none space-y-6 leading-relaxed">{children}</div>
      </article>
      <Footer />
    </>
  );
}
