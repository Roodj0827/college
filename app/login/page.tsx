import Link from 'next/link';
import { redirect } from 'next/navigation';
import { login } from '@/app/actions/auth';
import { getSession } from '@/lib/auth';
import { APP_NAME } from '@/lib/config';

export const metadata = { title: 'Connexion' };

export default async function LoginPage({ searchParams }: { searchParams: { error?: string } }) {
  if (await getSession()) redirect('/espace');
  return (
    <div className="flex min-h-screen items-center justify-center p-5">
      <div className="panel w-full max-w-sm p-7 shadow-sm">
        <Link href="/" className="font-display text-xl font-bold">{APP_NAME}</Link>
        <h1 className="mt-5 text-2xl font-bold">Connexion</h1>
        <form action={login} className="mt-5 space-y-4">
          <div><label className="label" htmlFor="email">Adresse e-mail</label><input id="email" name="email" type="email" required autoComplete="email" className="input" /></div>
          <div><label className="label" htmlFor="password">Mot de passe</label><input id="password" name="password" type="password" required autoComplete="current-password" className="input" /></div>
          {searchParams.error && <p role="alert" className="text-sm text-rouge">E-mail ou mot de passe incorrect.</p>}
          <button className="btn btn-primary w-full">Se connecter</button>
        </form>
        <p className="mt-5 text-xs text-slate-500">Les comptes sont créés par la direction de votre établissement.</p>
      </div>
    </div>
  );
}
