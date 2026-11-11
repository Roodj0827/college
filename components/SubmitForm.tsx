'use client';

import { useState } from 'react';
import { submitAssignment } from '@/app/actions/student';
import { safeName, uploadFile } from '@/lib/upload';

export default function SubmitForm({ assignmentId, studentId, replacing }: { assignmentId: string; studentId: string; replacing: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const file = new FormData(e.currentTarget).get('file') as File;
    if (!file?.size) return;
    setBusy(true);
    setError('');
    try {
      const path = await uploadFile('submissions', `${assignmentId}/${studentId}/${Date.now()}-${safeName(file.name)}`, file);
      await submitAssignment(assignmentId, path);
    } catch (err) {
      // redirect() de la Server Action leve une erreur speciale : on ne l'affiche pas
      if (err instanceof Error && !err.message.includes('NEXT_REDIRECT')) setError(err.message);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div>
        <label className="label" htmlFor="file">{replacing ? 'Remplacer mon fichier' : 'Votre fichier (PDF, Word, ZIP… 50 Mo max)'}</label>
        <input id="file" name="file" type="file" required className="input" />
      </div>
      {error && <p role="alert" className="text-sm text-rouge">{error}</p>}
      <button disabled={busy} className="btn btn-primary">{busy ? 'Envoi en cours…' : replacing ? 'Remplacer le rendu' : 'Rendre le devoir'}</button>
    </form>
  );
}
