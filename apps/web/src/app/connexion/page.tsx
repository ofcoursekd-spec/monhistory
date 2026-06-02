import { Suspense } from 'react';
import { AuthForm } from '@/components/AuthForm';
import { Navbar } from '@/components/Navbar';

export const metadata = { title: 'Connexion' };

export default function LoginPage() {
  return (
    <>
      <Navbar />
      <section className="mx-auto max-w-md px-4 py-16">
        <h1 className="font-display text-3xl font-bold mb-6">Bon retour parmi nous.</h1>
        <Suspense fallback={null}>
          <AuthForm mode="login" />
        </Suspense>
      </section>
    </>
  );
}
