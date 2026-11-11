import { Activity, BookOpen, GraduationCap, Users } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { formatDate } from '@/lib/utils';

export const metadata = { title: 'Tableau de bord' };

const ACTION_LABEL: Record<string, string> = {
  login: 'Connexion', viewed_course: 'Cours consulté', submitted_assignment: 'Devoir rendu',
};

export default async function DirectorHome() {
  await requireRole('director');
  const supabase = createClient();
  const since = new Date(Date.now() - 13 * 86400000);
  since.setHours(0, 0, 0, 0);

  const count = (table: string, role?: string) => {
    let q = supabase.from(table).select('id', { count: 'exact', head: true });
    if (role) q = q.eq('role', role);
    return q;
  };
  const [students, teachers, courses, submissions, logs, recent, neverLogged] = await Promise.all([
    count('profiles', 'student'), count('profiles', 'teacher'), count('courses'), count('submissions'),
    supabase.from('activity_logs').select('action, created_at, user_id').gte('created_at', since.toISOString()).limit(5000),
    supabase.from('activity_logs').select('action, created_at, profiles(full_name, role)').order('created_at', { ascending: false }).limit(12),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).is('last_login', null),
  ]);

  // Activite par jour (14 jours) : connexions et utilisateurs uniques
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(since); d.setDate(d.getDate() + i);
    return { key: d.toISOString().slice(0, 10), label: d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }), total: 0 };
  });
  (logs.data ?? []).forEach((l: any) => {
    const d = days.find((x) => x.key === new Date(l.created_at).toISOString().slice(0, 10));
    if (d) d.total += 1;
  });
  const max = Math.max(1, ...days.map((d) => d.total));
  const activeUsers = new Set((logs.data ?? []).map((l: any) => l.user_id)).size;

  const stats = [
    { label: 'Étudiants', value: students.count ?? 0, icon: GraduationCap },
    { label: 'Professeurs', value: teachers.count ?? 0, icon: Users },
    { label: 'Cours', value: courses.count ?? 0, icon: BookOpen },
    { label: 'Utilisateurs actifs (14 j)', value: activeUsers, icon: Activity },
  ];

  return (
    <>
      <PageHeader title="Tableau de bord" subtitle="Vue d’ensemble de l’établissement."
        action={<a href="/director/export" className="btn btn-ghost">Exporter l’activité (CSV)</a>} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="panel flex items-center gap-4 p-5">
            <Icon className="h-6 w-6 text-brand" aria-hidden />
            <div><p className="font-display text-2xl font-bold">{value}</p><p className="text-xs text-slate-500">{label}</p></div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="panel p-5">
          <h2 className="font-bold">Trafic des 14 derniers jours</h2>
          <p className="text-xs text-slate-500">Nombre d’actions enregistrées par jour (connexions, cours consultés, devoirs rendus).</p>
          <div className="mt-4 flex h-44 items-end gap-1.5" role="img" aria-label="Histogramme du trafic quotidien">
            {days.map((d) => (
              <div key={d.key} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-[10px] text-slate-500">{d.total || ''}</span>
                <div className="w-full rounded-t bg-brand" style={{ height: `${(d.total / max) * 100}%`, minHeight: d.total ? 4 : 1, opacity: d.total ? 1 : 0.2 }} />
                <span className="text-[10px] text-slate-500">{d.label.slice(0, 2)}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-slate-600">{submissions.count ?? 0} devoir(s) rendu(s) au total · {neverLogged.count ?? 0} compte(s) jamais connecté(s).</p>
        </section>

        <section className="panel p-5">
          <h2 className="font-bold">Activité récente</h2>
          <ul className="mt-3 divide-y divide-line">
            {(recent.data ?? []).map((l: any, i: number) => (
              <li key={i} className="py-2 text-sm">
                <span className="font-medium">{l.profiles?.full_name ?? '—'}</span> · {ACTION_LABEL[l.action] ?? l.action}
                <span className="block text-xs text-slate-500">{formatDate(l.created_at, true)}</span>
              </li>
            ))}
            {!recent.data?.length && <li className="py-2 text-sm text-slate-500">Aucune activité enregistrée.</li>}
          </ul>
        </section>
      </div>
    </>
  );
}
