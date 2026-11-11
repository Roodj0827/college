import PageHeader from '@/components/PageHeader';
import DeleteButton from '@/components/DeleteButton';
import { deleteCourseAsDirector } from '@/app/actions/director';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { formatDate } from '@/lib/utils';

export const metadata = { title: 'Cours' };

export default async function Courses() {
  await requireRole('director');
  const { data } = await createClient()
    .from('courses')
    .select('id, title, code, created_at, profiles!teacher_id(full_name), classes(name), modules(count), assignments(count)')
    .order('created_at', { ascending: false });
  return (
    <>
      <PageHeader title="Cours de l’établissement" />
      <div className="panel overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-line"><tr><th className="th">Cours</th><th className="th">Professeur</th><th className="th">Classe</th><th className="th">Leçons</th><th className="th">Devoirs</th><th className="th">Créé le</th><th className="th" /></tr></thead>
          <tbody className="divide-y divide-line">
            {(data ?? []).map((c: any) => (
              <tr key={c.id}><td className="td"><p className="font-medium">{c.title}</p><p className="text-xs text-slate-500">{c.code}</p></td>
                <td className="td">{c.profiles?.full_name}</td><td className="td">{c.classes?.name ?? '—'}</td>
                <td className="td">{c.modules?.[0]?.count ?? 0}</td><td className="td">{c.assignments?.[0]?.count ?? 0}</td>
                <td className="td text-slate-500">{formatDate(c.created_at)}</td>
                <td className="td text-right"><form action={deleteCourseAsDirector}><input type="hidden" name="id" value={c.id} /><DeleteButton label="Supprimer le cours" /></form></td></tr>
            ))}
            {!data?.length && <tr><td colSpan={7} className="td text-center text-slate-500">Aucun cours pour le moment.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
