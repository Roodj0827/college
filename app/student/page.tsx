import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import ProgressBar from '@/components/ProgressBar';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { formatDate, pct } from '@/lib/utils';

export const metadata = { title: 'Mes cours' };

export default async function StudentHome() {
  const { user, profile } = await requireRole('student');
  const supabase = createClient();

  const [{ data: courses }, { data: done }, { data: assignments }] = await Promise.all([
    supabase.from('courses').select('id, title, code, profiles!teacher_id(full_name), modules(id)').order('title'),
    supabase.from('lesson_progress').select('module_id').eq('student_id', user.id).eq('completed', true),
    supabase.from('assignments').select('id, title, due_date, courses(title), submissions(id)').gte('due_date', new Date().toISOString()).order('due_date').limit(5),
  ]);
  const doneSet = new Set((done ?? []).map((d: any) => d.module_id));
  const todo = (assignments ?? []).filter((a: any) => !a.submissions?.length);

  return (
    <>
      <PageHeader title={`Bonjour, ${profile.full_name.split(' ')[0]}`} subtitle="Reprenez là où vous vous êtes arrêté." />

      {todo.length > 0 && (
        <section className="panel mb-8 p-5">
          <h2 className="font-bold">Devoirs à rendre</h2>
          <ul className="mt-3 divide-y divide-line">
            {todo.map((a: any) => (
              <li key={a.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <Link href={`/student/assignments/${a.id}`} className="font-medium hover:text-brand">{a.title} <span className="font-normal text-slate-500">· {a.courses?.title}</span></Link>
                <span className="shrink-0 text-rouge">avant le {formatDate(a.due_date, true)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {!courses?.length ? (
        <div className="panel p-10 text-center text-sm text-slate-600">
          <BookOpen className="mx-auto mb-3 h-8 w-8 text-slate-400" aria-hidden />
          Aucun cours pour le moment. Demandez à la direction de vous rattacher à une classe.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c: any) => {
            const ids: string[] = (c.modules ?? []).map((m: any) => m.id);
            const value = pct(ids.filter((id) => doneSet.has(id)).length, ids.length);
            return (
              <Link key={c.id} href={`/student/courses/${c.id}`} className="panel block p-5 transition-colors hover:border-brand">
                <p className="text-xs text-slate-500">{c.code}</p>
                <h2 className="mt-1 text-lg font-bold">{c.title}</h2>
                <p className="mb-4 text-sm text-slate-600">{c.profiles?.full_name}</p>
                <ProgressBar value={value} />
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
