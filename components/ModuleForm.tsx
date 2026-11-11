'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { addModule } from '@/app/actions/teacher';
import { safeName, uploadFile } from '@/lib/upload';

export default function ModuleForm({ courseId, nextIndex }: { courseId: string; nextIndex: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setBusy(true);
    setError('');
    try {
      const pdf = fd.get('pdf') as File;
      const video = fd.get('video') as File;
      const link = String(fd.get('video_link') ?? '').trim();
      const stamp = Date.now();

      const contentPath = pdf?.size ? await uploadFile('course-materials', `${courseId}/${stamp}-${safeName(pdf.name)}`, pdf) : null;
      const videoValue = video?.size ? await uploadFile('course-materials', `${courseId}/${stamp}-${safeName(video.name)}`, video) : link || null;

      await addModule({
        courseId,
        title: String(fd.get('title')).trim(),
        orderIndex: Number(fd.get('order_index')) || 0,
        contentPath,
        videoValue,
      });
      form.reset();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Échec de l’envoi.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-[1fr_90px]">
        <div><label className="label" htmlFor="m-title">Titre de la leçon</label><input id="m-title" name="title" required className="input" /></div>
        <div><label className="label" htmlFor="m-order">Ordre</label><input id="m-order" name="order_index" type="number" defaultValue={nextIndex} className="input" /></div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div><label className="label" htmlFor="m-pdf">Support PDF</label><input id="m-pdf" name="pdf" type="file" accept="application/pdf" className="input" /></div>
        <div><label className="label" htmlFor="m-video">Vidéo (MP4/WebM)</label><input id="m-video" name="video" type="file" accept="video/mp4,video/webm" className="input" /></div>
      </div>
      <div>
        <label className="label" htmlFor="m-link">… ou lien YouTube / Vimeo</label>
        <input id="m-link" name="video_link" type="url" placeholder="https://www.youtube.com/watch?v=…" className="input" />
        <p className="mt-1 text-xs text-slate-500">Si un fichier vidéo est choisi, il remplace le lien. Taille maximale par fichier : 50 Mo.</p>
      </div>
      {error && <p role="alert" className="text-sm text-rouge">{error}</p>}
      <button disabled={busy} className="btn btn-primary">{busy ? 'Envoi en cours…' : 'Ajouter la leçon'}</button>
    </form>
  );
}
