import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CheckCircle2, Circle } from 'lucide-react';
import LessonViewer from '@/components/LessonViewer';
import PageHeader from '@/components/PageHeader';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { resolveFileUrl } from '@/lib/storage';
import { formatDate } from '@/lib/utils';

export default async function CoursePage({ params, searchParams }: { params: { id: string }; searchParams: { m?: string } }) {
  const { user } = await requireRole('student');
  const supabase = createClient();

  const { data: course } = await supabase.from('courses').select('*, profiles!teacher_id(full_name)').eq('id', params.id).single();
  if (!course) notFound();

  const [{ data: modules }, { data: assignments }] = await Promise.all([
    supabase.from('modules').select('*').eq('course_id', course.id).order('order_index').order('created_at'),
    supabase.from('assignments').select('id, title, due_date, submissions(id, grade)').eq('course_id', course.id).order('due_date'),
  ]);
  const { data: progress } = await supabase.from('lesson_progress').select('module_id, completed').eq('student_id', user.id).in('module_id', (modules ?? []).map((m: any) => m.id));
  const done = new Set((progress ?? []).filter((p: any) => p.completed).map((p: any) => p.module_id));

  const current: any = (modules ?? []).find((m: any) => m.id === searchParams.m) ?? modules?.[0];
  const [videoUrl, pdfUrl] = current
    ? await Promise.all([resolveFileUrl('course-materials', current.video_url), resolveFileUrl('course-materials', current.content_url)])
    : [null, null];

  await supabase.from('activity_logs').insert({ user_id: user.id, action: 'viewed_course', details: { course_id: course.id } });

  return (
    <>
      <PageHeader title={course.title} subtitle={`${course.code} · ${course.profiles?.full_name ?? ''}`} />
      {course.description && <p className="-mt-3 mb-6 max-w-2xl text-sm text-slate-600">{course.description}</p>}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div>
          {current ? (
            <LessonViewer key={current.id} moduleId={current.id} title={current.title} videoUrl={videoUrl} pdfUrl={pdfUrl} completed={done.has(current.id)} />
          ) : (
            <div className="panel p-10 text-center text-sm text-slate-600">Le professeur n’a pas encore publié de leçon.</div>
          )}
        </div>

        <aside className="space-y-6">
          <section className="panel p-4">
            <h2 className="mb-2 font-bold">Leçons</h2>
            <ol className="space-y-1">
              {(modules ?? []).map((m: any) => (
                <li key={m.id}>
                  <Link href={`?m=${m.id}`} className={`flex items-start gap-2 rounded-md px-2 py-2 text-sm ${m.id === current?.id ? 'bg-brand-soft font-semibold text-brand' : 'hover:bg-paper'}`}>
                    {done.has(m.id) ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-label="Terminée" /> : <Circle className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-label="À faire" />}
                    {m.title}
                  </Link>
                </li>
              ))}
            </ol>
          </section>

          <section className="panel p-4">
            <h2 className="mb-2 font-bold">Devoirs</h2>
            {!assignments?.length ? <p className="text-sm text-slate-500">Aucun devoir pour ce cours.</p> : (
              <ul className="divide-y divide-line">
                {assignments.map((a: any) => (
                  <li key={a.id} className="py-2 text-sm">
                    <Link href={`/student/assignments/${a.id}`} className="font-medium hover:text-brand">{a.title}</Link>
                    <p className="text-xs text-slate-500">{a.submissions?.length ? (a.submissions[0].grade != null ? `Noté : ${a.submissions[0].grade}` : 'Rendu') : `À rendre avant le ${formatDate(a.due_date)}`}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </>
  );
}
