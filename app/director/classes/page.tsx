import PageHeader from '@/components/PageHeader';
import DeleteButton from '@/components/DeleteButton';
import { createClass, deleteClass } from '@/app/actions/director';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export const metadata = { title: 'Classes' };

export default async function Classes() {
  await requireRole('director');
  const { data } = await createClient().from('classes').select('*, profiles(count), courses(count)').order('name');
  return (
    <>
      <PageHeader title="Classes et filières" />
      <form action={createClass} className="panel mb-6 grid gap-3 p-5 md:grid-cols-[1fr_1fr_auto] md:items-end">
        <div><label className="label" htmlFor="c-name">Nom de la classe</label><input id="c-name" name="name" required placeholder="Licence 1 Comptabilité" className="input" /></div>
        <div><label className="label" htmlFor="c-dep">Département</label><input id="c-dep" name="department" placeholder="Sciences économiques" className="input" /></div>
        <button className="btn btn-primary">Ajouter</button>
      </form>
      <div className="panel overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-line"><tr><th className="th">Classe</th><th className="th">Département</th><th className="th">Étudiants</th><th className="th">Cours</th><th className="th" /></tr></thead>
          <tbody className="divide-y divide-line">
            {(data ?? []).map((c: any) => (
              <tr key={c.id}><td className="td font-medium">{c.name}</td><td className="td">{c.department ?? '—'}</td>
                <td className="td">{c.profiles?.[0]?.count ?? 0}</td><td className="td">{c.courses?.[0]?.count ?? 0}</td>
                <td className="td text-right"><form action={deleteClass}><input type="hidden" name="id" value={c.id} /><DeleteButton label="Supprimer la classe" /></form></td></tr>
            ))}
            {!data?.length && <tr><td colSpan={5} className="td text-center text-slate-500">Aucune classe. Ajoutez la première ci-dessus.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
