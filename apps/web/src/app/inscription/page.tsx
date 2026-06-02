import { Suspense } from 'react';
import { AuthForm } from '@/components/AuthForm';
import { Navbar } from '@/components/Navbar';

export const metadata = { title: 'Inscription' };

export default function RegisterPage() {
  return (
    <>
      <Navbar />
      <section className="mx-auto max-w-md px-4 py-16">
        <h1 className="font-display text-3xl font-bold mb-6">Rejoins MonHistory.</h1>
        <Suspense fallback={null}>
          <AuthForm mode="register" />
        </Suspense>
      </section>
    </>
  );
}
