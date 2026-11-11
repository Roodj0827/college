import { notFound } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import { gradeSubmission } from '@/app/actions/teacher';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { resolveFileUrl } from '@/lib/storage';
import { formatDate } from '@/lib/utils';

export default async function GradePage({ params }: { params: { id: string; aid: string } }) {
  await requireRole('teacher');
  const supabase = createClient();
  const { data: a } = await supabase.from('assignments').select('*, courses(title, teacher_id)').eq('id', params.aid).eq('course_id', params.id).single();
  if (!a) notFound();

  const { data: subs } = await supabase.from('submissions').select('*, profiles!student_id(full_name, email)').eq('assignment_id', a.id).order('submitted_at');
  const urls = await Promise.all((subs ?? []).map((s: any) => resolveFileUrl('submissions', s.file_url)));

  return (
    <>
      <PageHeader title={a.title} subtitle={`${a.courses?.title} · échéance ${formatDate(a.due_date, true)} · note sur ${a.max_score}`} />
      {!subs?.length ? (
        <div className="panel p-10 text-center text-sm text-slate-600">Aucun étudiant n’a encore rendu ce devoir.</div>
      ) : (
        <div className="space-y-4">
          {subs.map((s: any, i: number) => (
            <form key={s.id} action={gradeSubmission} className="panel grid gap-4 p-5 md:grid-cols-[1fr_110px_1.2fr_auto] md:items-end">
              <input type="hidden" name="id" value={s.id} />
              <input type="hidden" name="course_id" value={params.id} />
              <input type="hidden" name="assignment_id" value={a.id} />
              <input type="hidden" name="max_score" value={a.max_score} />
              <div>
                <p className="font-semibold">{s.profiles?.full_name}</p>
                <p className="text-xs text-slate-500">{s.profiles?.email}</p>
                <p className="mt-1 text-xs text-slate-500">
                  Rendu le {formatDate(s.submitted_at, true)}
                  {new Date(s.submitted_at) > new Date(a.due_date) && <span className="ml-1 font-semibold text-rouge">(en retard)</span>}
                </p>
                {urls[i] && <a href={urls[i]!} target="_blank" rel="noreferrer" className="mt-1 inline-block text-sm text-brand underline">Télécharger la copie</a>}
              </div>
              <div><label className="label" htmlFor={`g-${s.id}`}>Note / {a.max_score}</label><input id={`g-${s.id}`} name="grade" type="number" min="0" max={a.max_score} step="0.25" required defaultValue={s.grade ?? ''} className="input" /></div>
              <div><label className="label" htmlFor={`f-${s.id}`}>Commentaire</label><textarea id={`f-${s.id}`} name="feedback" rows={2} defaultValue={s.feedback ?? ''} className="input" /></div>
              <button className="btn btn-primary">{s.grade != null ? 'Mettre à jour' : 'Enregistrer'}</button>
            </form>
          ))}
        </div>
      )}
    </>
  );
}
