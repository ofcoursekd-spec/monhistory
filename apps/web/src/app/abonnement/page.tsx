import { Navbar } from '@/components/Navbar';
import { apiGet } from '@/lib/api';
import { SubscribeCard } from './SubscribeCard';

interface PlanDto {
  code: string;
  name: string;
  price: number;
  currency: string;
  durationDays: number;
}

// SSR avec cache 5 min : la carte apparaît immédiatement, plus de skeleton.
export const revalidate = 300;
export const metadata = { title: 'Abonnement Premium' };

export default async function SubscriptionPage() {
  let plan: PlanDto | null = null;
  try {
    const plans = await apiGet<PlanDto[]>('/subscriptions/plans');
    plan = plans[0] ?? null;
  } catch {}

  return (
    <>
      <Navbar />
      <section className="mx-auto max-w-2xl px-4 py-16">
        <div className="text-center">
          <h1 className="font-display text-4xl md:text-5xl font-bold">
            Lis sans limite. <span className="text-brand">Sans pub.</span>
          </h1>
          <p className="mt-4 text-ink/70">
            Un seul prix, accès à tout. Annule quand tu veux.
          </p>
        </div>

        {plan ? (
          <SubscribeCard plan={plan} />
        ) : (
          <div className="mt-12 rounded-3xl border border-red-200 bg-red-50 p-6 text-center text-red-700">
            Impossible de charger les plans. Vérifie que l'API est en ligne.
          </div>
        )}
      </section>
    </>
  );
}
