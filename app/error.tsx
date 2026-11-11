'use client';

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-md p-10 text-center">
      <h1 className="text-xl font-bold">Une erreur est survenue</h1>
      <p className="mt-2 text-sm text-slate-600">{error.message}</p>
      <button onClick={reset} className="btn btn-primary mt-5">Réessayer</button>
    </div>
  );
}
