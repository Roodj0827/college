import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FileText, Video } from 'lucide-react';
import DeleteButton from '@/components/DeleteButton';
import ModuleForm from '@/components/ModuleForm';
import PageHeader from '@/components/PageHeader';
import { createAssignment, deleteAssignment, deleteCourse, deleteModule } from '@/app/actions/teacher';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { formatDate, pct } from '@/lib/utils';

export default async function ManageCourse({ params }: { params: { id: string } }) {
  const { user } = await requireRole('teacher');
  const supabase = createClient();
  const { data: course } = await supabase.from('courses').select('*, classes(name)').eq('id', params.id).eq('teacher_id', user.id).single();
  if (!course) notFound();

  const [{ data: modules }, { data: assignments }, { data: students }] = await Promise.all([
    supabase.from('modules').select('*').eq('course_id', course.id).order('order_index').order('created_at'),
    supabase.from('assignments').select('*, submissions(id, grade)').eq('course_id', course.id).order('due_date'),
    course.class_id
      ? supabase.from('profiles').select('id, full_name, email').eq('class_id', course.class_id).eq('role', 'student').order('full_name')
      : Promise.resolve({ data: [] as any[] }),
  ]);
  const moduleIds = (modules ?? []).map((m: any) => m.id);
  const { data: progress } = moduleIds.length
    ? await supabase.from('lesson_progress').select('student_id, module_id').eq('completed', true).in('module_id', moduleIds)
    : { data: [] as any[] };
  const doneBy = new Map<string, number>();
  (progress ?? []).forEach((p: any) => doneBy.set(p.student_id, (doneBy.get(p.student_id) ?? 0) + 1));

  return (
    <>
      <PageHeader
        title={course.title}
        subtitle={`${course.code} · ${course.classes?.name ?? 'Aucune classe'}`}
        action={<form action={deleteCourse}><input type="hidden" name="id" value={course.id} /><DeleteButton label="Supprimer le cours" confirmText="Supprimer ce cours, ses leçons et ses devoirs ?" /></form>}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="panel p-5">
          <h2 className="font-bold">Leçons</h2>
          <ul className="my-3 divide-y divide-line">
            {(modules ?? []).map((m: any) => (
              <li key={m.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span className="min-w-0 truncate font-medium">{m.order_index}. {m.title}</span>
                <span className="flex shrink-0 items-center gap-2 text-slate-500">
                  {m.content_url && <FileText className="h-4 w-4" aria-label="PDF" />}
                  {m.video_url && <Video className="h-4 w-4" aria-label="Vidéo" />}
                  <form action={deleteModule}><input type="hidden" name="id" value={m.id} /><input type="hidden" name="course_id" value={course.id} /><DeleteButton label="Supprimer la leçon" /></form>
                </span>
              </li>
            ))}
            {!modules?.length && <li className="py-2 text-sm text-slate-500">Aucune leçon pour l’instant.</li>}
          </ul>
          <div className="border-t border-line pt-4"><ModuleForm courseId={course.id} nextIndex={(modules?.length ?? 0) + 1} /></div>
        </section>

        <section className="panel p-5">
          <h2 className="font-bold">Devoirs</h2>
          <ul className="my-3 divide-y divide-line">
            {(assignments ?? []).map((a: any) => (
              <li key={a.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <Link href={`/teacher/courses/${course.id}/assignments/${a.id}`} className="min-w-0 font-medium hover:text-brand">
                  {a.title}
                  <span className="block text-xs font-normal text-slate-500">Échéance {formatDate(a.due_date, true)} · {a.submissions?.length ?? 0} rendu(s), {a.submissions?.filter((s: any) => s.grade != null).length ?? 0} corrigé(s)</span>
                </Link>
                <form action={deleteAssignment}><input type="hidden" name="id" value={a.id} /><input type="hidden" name="course_id" value={course.id} /><DeleteButton label="Supprimer le devoir" /></form>
              </li>
            ))}
            {!assignments?.length && <li className="py-2 text-sm text-slate-500">Aucun devoir pour l’instant.</li>}
          </ul>
          <form action={createAssignment} className="space-y-3 border-t border-line pt-4">
            <input type="hidden" name="course_id" value={course.id} />
            <div><label className="label" htmlFor="a-title">Titre du devoir</label><input id="a-title" name="title" required className="input" /></div>
            <div><label className="label" htmlFor="a-inst">Consignes</label><textarea id="a-inst" name="instructions" rows={3} className="input" /></div>
            <div className="grid grid-cols-[1fr_100px] gap-3">
              <div><label className="label" htmlFor="a-due">Échéance</label><input id="a-due" name="due_date" type="datetime-local" required className="input" /></div>
              <div><label className="label" htmlFor="a-max">Note max</label><input id="a-max" name="max_score" type="number" min="1" step="0.5" defaultValue={20} className="input" /></div>
            </div>
            <button className="btn btn-primary">Publier le devoir</button>
          </form>
        </section>
      </div>

      <section className="panel mt-6 overflow-x-auto">
        <h2 className="p-5 pb-3 font-bold">Progression des étudiants</h2>
        <table className="w-full">
          <thead className="border-y border-line"><tr><th className="th">Étudiant</th><th className="th">E-mail</th><th className="th">Leçons terminées</th></tr></thead>
          <tbody className="divide-y divide-line">
            {(students ?? []).map((s: any) => (
              <tr key={s.id}><td className="td font-medium">{s.full_name}</td><td className="td">{s.email}</td>
                <td className="td">{doneBy.get(s.id) ?? 0} / {moduleIds.length} ({pct(doneBy.get(s.id) ?? 0, moduleIds.length)}%)</td></tr>
            ))}
            {!students?.length && <tr><td colSpan={3} className="td text-slate-500">{course.class_id ? 'Aucun étudiant dans cette classe.' : 'Rattachez ce cours à une classe pour suivre la progression.'}</td></tr>}
          </tbody>
        </table>
      </section>
    </>
  );
}
