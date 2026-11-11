import Link from 'next/link';
import { Plus } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export const metadata = { title: 'Mes cours' };

export default async function TeacherHome() {
  const { user } = await requireRole('teacher');
  const { data: courses } = await createClient()
    .from('courses')
    .select('id, title, code, classes(name), modules(id), assignments(id)')
    .eq('teacher_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <>
      <PageHeader title="Mes cours" action={<Link href="/teacher/courses/new" className="btn btn-primary"><Plus className="h-4 w-4" aria-hidden /> Nouveau cours</Link>} />
      {!courses?.length ? (
        <div className="panel p-10 text-center text-sm text-slate-600">Vous n’avez pas encore de cours. Créez le premier pour publier vos leçons.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c: any) => (
            <Link key={c.id} href={`/teacher/courses/${c.id}`} className="panel block p-5 transition-colors hover:border-brand">
              <p className="text-xs text-slate-500">{c.code}</p>
              <h2 className="mt-1 text-lg font-bold">{c.title}</h2>
              <p className="text-sm text-slate-600">{c.classes?.name ?? 'Aucune classe'}</p>
              <p className="mt-4 text-xs text-slate-500">{c.modules?.length ?? 0} leçon(s) · {c.assignments?.length ?? 0} devoir(s)</p>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
