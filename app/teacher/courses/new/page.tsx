import PageHeader from '@/components/PageHeader';
import { createCourse } from '@/app/actions/teacher';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export const metadata = { title: 'Nouveau cours' };

export default async function NewCourse() {
  await requireRole('teacher');
  const { data: classes } = await createClient().from('classes').select('id, name').order('name');
  return (
    <>
      <PageHeader title="Nouveau cours" />
      <form action={createCourse} className="panel max-w-xl space-y-4 p-6">
        <div><label className="label" htmlFor="title">Titre du cours</label><input id="title" name="title" required className="input" /></div>
        <div><label className="label" htmlFor="code">Code (unique)</label><input id="code" name="code" required placeholder="COMPTA101" className="input uppercase" /></div>
        <div><label className="label" htmlFor="class_id">Classe concernée</label>
          <select id="class_id" name="class_id" className="input" defaultValue="">
            <option value="">Aucune (accès par inscription)</option>
            {(classes ?? []).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <p className="mt-1 text-xs text-slate-500">Tous les étudiants de la classe verront ce cours automatiquement.</p>
        </div>
        <div><label className="label" htmlFor="description">Description</label><textarea id="description" name="description" rows={3} className="input" /></div>
        <button className="btn btn-primary">Créer le cours</button>
      </form>
    </>
  );
}
