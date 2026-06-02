import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const display = Playfair_Display({ subsets: ['latin'], variable: '--font-display' });

export const metadata: Metadata = {
  title: { default: 'MonHistory — Lis des histoires qui touchent', template: '%s · MonHistory' },
  description:
    'MonHistory : plateforme de BD émotionnelles africaines. Amour, trahison, foi, motivation. Lis en illimité avec l’abonnement Premium.',
  openGraph: {
    title: 'MonHistory',
    description: 'BD émotionnelles africaines à lire en illimité.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${inter.variable} ${display.variable}`}>
      <body className="font-sans antialiased">
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
