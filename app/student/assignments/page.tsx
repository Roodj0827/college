import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { formatDate } from '@/lib/utils';

export const metadata = { title: 'Devoirs et notes' };

export default async function Assignments() {
  await requireRole('student');
  const { data } = await createClient()
    .from('assignments')
    .select('id, title, due_date, max_score, courses(title), submissions(id, grade, submitted_at)')
    .order('due_date', { ascending: false });

  return (
    <>
      <PageHeader title="Devoirs et notes" />
      <div className="panel overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-line"><tr><th className="th">Devoir</th><th className="th">Cours</th><th className="th">Échéance</th><th className="th">Statut</th><th className="th">Note</th></tr></thead>
          <tbody className="divide-y divide-line">
            {(data ?? []).map((a: any) => {
              const s = a.submissions?.[0];
              const late = !s && new Date(a.due_date) < new Date();
              return (
                <tr key={a.id}>
                  <td className="td font-medium"><Link href={`/student/assignments/${a.id}`} className="hover:text-brand">{a.title}</Link></td>
                  <td className="td">{a.courses?.title}</td>
                  <td className="td">{formatDate(a.due_date, true)}</td>
                  <td className="td">
                    {s ? <span className="badge bg-brand-soft text-brand">{s.grade != null ? 'Corrigé' : 'Rendu'}</span>
                       : late ? <span className="badge bg-rouge/10 text-rouge">En retard</span>
                       : <span className="badge bg-slate-100 text-slate-600">À rendre</span>}
                  </td>
                  <td className="td font-semibold">{s?.grade != null ? `${s.grade} / ${a.max_score}` : '—'}</td>
                </tr>
              );
            })}
            {!data?.length && <tr><td colSpan={5} className="td text-center text-slate-500">Aucun devoir pour le moment.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
