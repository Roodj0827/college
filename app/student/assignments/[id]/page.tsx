import { notFound } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import SubmitForm from '@/components/SubmitForm';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { resolveFileUrl } from '@/lib/storage';
import { formatDate } from '@/lib/utils';

export default async function AssignmentPage({ params }: { params: { id: string } }) {
  const { user } = await requireRole('student');
  const supabase = createClient();
  const { data: a } = await supabase.from('assignments').select('*, courses(title)').eq('id', params.id).single();
  if (!a) notFound();
  const { data: sub } = await supabase.from('submissions').select('*').eq('assignment_id', a.id).eq('student_id', user.id).maybeSingle();
  const fileUrl = await resolveFileUrl('submissions', sub?.file_url ?? null);
  const graded = sub?.grade != null;
  const late = new Date(a.due_date) < new Date();

  return (
    <>
      <PageHeader title={a.title} subtitle={`${a.courses?.title} · à rendre avant le ${formatDate(a.due_date, true)}`} />
      <div className="grid max-w-3xl gap-6">
        <section className="panel p-5">
          <h2 className="font-bold">Consignes</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{a.instructions || 'Aucune consigne détaillée.'}</p>
          <p className="mt-3 text-xs text-slate-500">Note maximale : {a.max_score}</p>
        </section>

        {graded && (
          <section className="panel border-brand p-5">
            <h2 className="font-bold">Résultat</h2>
            <p className="mt-2 font-display text-3xl font-bold text-brand">{sub.grade} <span className="text-lg text-slate-500">/ {a.max_score}</span></p>
            {sub.feedback && <p className="mt-3 whitespace-pre-wrap text-sm"><span className="font-semibold">Commentaire du professeur : </span>{sub.feedback}</p>}
          </section>
        )}

        <section className="panel p-5">
          <h2 className="font-bold">Mon rendu</h2>
          {sub && (
            <p className="mt-2 text-sm">Envoyé le {formatDate(sub.submitted_at, true)}{fileUrl && <> · <a href={fileUrl} target="_blank" rel="noreferrer" className="text-brand underline">Voir mon fichier</a></>}</p>
          )}
          {graded ? (
            <p className="mt-3 text-sm text-slate-500">Ce devoir est corrigé : il ne peut plus être modifié.</p>
          ) : (
            <div className="mt-4">
              {late && <p className="mb-3 text-sm text-rouge">L’échéance est dépassée. Votre professeur verra la date réelle d’envoi.</p>}
              <SubmitForm assignmentId={a.id} studentId={user.id} replacing={!!sub} />
            </div>
          )}
        </section>
      </div>
    </>
  );
}
