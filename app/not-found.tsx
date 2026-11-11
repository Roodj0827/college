import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md p-10 text-center">
      <h1 className="text-xl font-bold">Page introuvable</h1>
      <p className="mt-2 text-sm text-slate-600">Cette page n’existe pas ou vous n’y avez pas accès.</p>
      <Link href="/espace" className="btn btn-primary mt-5">Retour à mon espace</Link>
    </div>
  );
}
