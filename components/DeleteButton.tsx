'use client';

import { Trash2 } from 'lucide-react';

/** Bouton de suppression avec confirmation. A placer dans un <form action={serverAction}>. */
export default function DeleteButton({ label = 'Supprimer', confirmText = 'Supprimer définitivement ?' }: { label?: string; confirmText?: string }) {
  return (
    <button
      type="submit"
      aria-label={label}
      title={label}
      className="btn btn-danger px-2 py-1"
      onClick={(e) => { if (!confirm(confirmText)) e.preventDefault(); }}
    >
      <Trash2 className="h-4 w-4" aria-hidden />
    </button>
  );
}
