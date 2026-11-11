import Link from 'next/link';
import { Check } from 'lucide-react';
import { APP_NAME } from '@/lib/config';

const LESSONS = [
  { t: 'Introduction à la comptabilité générale', done: true },
  { t: 'Le bilan et le compte de résultat', done: true },
  { t: 'Les amortissements', done: false },
  { t: 'Devoir 1 : étude de cas', done: false },
];

export default function Home() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <span className="font-display text-xl font-bold">{APP_NAME}</span>
        <Link href="/login" className="btn btn-primary">Se connecter</Link>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 pb-16 pt-10 md:grid-cols-[1.1fr_1fr] md:pt-20">
        <div>
          <h1 className="text-4xl font-bold leading-tight md:text-6xl">Vos cours, vos devoirs et vos notes au même endroit.</h1>
          <p className="mt-5 max-w-lg text-lg text-slate-600">
            Une plateforme pour les universités et écoles professionnelles : les professeurs publient leurs leçons,
            les étudiants avancent à leur rythme, la direction suit l’activité de l’établissement.
          </p>
          <Link href="/login" className="btn btn-primary mt-8 px-6 py-3 text-base">Accéder à mon espace</Link>
        </div>

        <div className="panel p-5 shadow-sm" aria-hidden>
          <p className="font-display text-lg font-semibold">Comptabilité générale</p>
          <p className="text-xs text-slate-500">Prof. Jean-Baptiste · Licence 1</p>
          <ul className="mt-4 divide-y divide-line">
            {LESSONS.map((l) => (
              <li key={l.t} className="flex items-center gap-3 py-3 text-sm">
                <span className={`flex h-5 w-5 items-center justify-center rounded-full ${l.done ? 'bg-brand text-white' : 'border border-line'}`}>
                  {l.done && <Check className="h-3 w-3" />}
                </span>
                <span className={l.done ? 'text-slate-500' : 'font-medium'}>{l.t}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 h-2 rounded-full bg-brand-soft"><div className="h-full w-1/2 rounded-full bg-brand" /></div>
          <p className="mt-1 text-xs text-slate-500">50% terminé</p>
        </div>
      </section>

      <section className="border-t border-line bg-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-14 md:grid-cols-3">
          <div>
            <h2 className="text-xl font-bold">Étudiants</h2>
            <p className="mt-2 text-sm text-slate-600">Regardez les vidéos, lisez les supports PDF, rendez vos devoirs avant l’échéance et consultez vos notes et commentaires.</p>
          </div>
          <div>
            <h2 className="text-xl font-bold">Professeurs</h2>
            <p className="mt-2 text-sm text-slate-600">Créez vos cours, déposez vidéos et PDF, lancez des devoirs, corrigez les copies et suivez la progression de chaque étudiant.</p>
          </div>
          <div>
            <h2 className="text-xl font-bold">Direction</h2>
            <p className="mt-2 text-sm text-slate-600">Gérez comptes et classes, suivez la fréquentation de la plateforme et exportez les rapports d’activité.</p>
          </div>
        </div>
      </section>

      <footer className="px-5 py-6 text-center text-xs text-slate-500">© {new Date().getFullYear()} {APP_NAME}</footer>
    </div>
  );
}
