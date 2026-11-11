import type { Metadata } from 'next';
import { Bricolage_Grotesque, Source_Sans_3 } from 'next/font/google';
import './globals.css';
import { APP_NAME } from '@/lib/config';

const display = Bricolage_Grotesque({ subsets: ['latin'], variable: '--font-display' });
const body = Source_Sans_3({ subsets: ['latin'], variable: '--font-body' });

export const metadata: Metadata = {
  title: { default: `${APP_NAME} — Plateforme d’apprentissage`, template: `%s · ${APP_NAME}` },
  description: 'Cours, devoirs et notes pour les universités et écoles professionnelles.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
