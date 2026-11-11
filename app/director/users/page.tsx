import PageHeader from '@/components/PageHeader';
import DeleteButton from '@/components/DeleteButton';
import { createUser, deleteUser, updateUser } from '@/app/actions/director';
import { requireRole } from '@/lib/auth';
import { ROLE_LABEL } from '@/lib/config';
import { createClient } from '@/lib/supabase/server';
import { formatDate } from '@/lib/utils';

export const metadata = { title: 'Utilisateurs' };

export default async function Users() {
  const { user } = await requireRole('director');
  const supabase = createClient();
  const [{ data: users }, { data: classes }] = await Promise.all([
    supabase.from('profiles').select('*').order('role').order('full_name'),
    supabase.from('classes').select('id, name').order('name'),
  ]);
  const roleOptions = Object.entries(ROLE_LABEL);
  const classOptions = (classes ?? []).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>);

  return (
    <>
      <PageHeader title="Utilisateurs" subtitle="Créez les comptes, attribuez les rôles et rattachez les étudiants à leur classe." />

      <form action={createUser} className="panel mb-6 grid gap-3 p-5 md:grid-cols-6 md:items-end">
        <div className="md:col-span-2"><label className="label" htmlFor="u-name">Nom complet</label><input id="u-name" name="full_name" required className="input" /></div>
        <div className="md:col-span-2"><label className="label" htmlFor="u-email">E-mail</label><input id="u-email" name="email" type="email" required className="input" /></div>
        <div><label className="label" htmlFor="u-pass">Mot de passe</label><input id="u-pass" name="password" type="text" minLength={8} required className="input" /></div>
        <div><label className="label" htmlFor="u-role">Rôle</label><select id="u-role" name="role" defaultValue="student" className="input">{roleOptions.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
        <div className="md:col-span-2"><label className="label" htmlFor="u-class">Classe</label><select id="u-class" name="class_id" defaultValue="" className="input"><option value="">Aucune</option>{classOptions}</select></div>
        <div className="md:col-span-4"><button className="btn btn-primary">Créer le compte</button></div>
      </form>

      <div className="panel overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-line"><tr><th className="th">Nom</th><th className="th">Rôle</th><th className="th">Classe</th><th className="th">Dernière connexion</th><th className="th" /></tr></thead>
          <tbody className="divide-y divide-line">
            {(users ?? []).map((u: any) => (
              <tr key={u.id}>
                <td className="td"><p className="font-medium">{u.full_name}</p><p className="text-xs text-slate-500">{u.email}</p></td>
                <td className="td" colSpan={2}>
                  <form action={updateUser} className="flex flex-wrap items-center gap-2">
                    <input type="hidden" name="id" value={u.id} />
                    <select name="role" defaultValue={u.role} aria-label="Rôle" className="input w-auto">{roleOptions.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
                    <select name="class_id" defaultValue={u.class_id ?? ''} aria-label="Classe" className="input w-auto"><option value="">Aucune</option>{classOptions}</select>
                    <button className="btn btn-ghost py-1.5">Enregistrer</button>
                  </form>
                </td>
                <td className="td text-slate-500">{formatDate(u.last_login, true)}</td>
                <td className="td text-right">
                  {u.id !== user.id && <form action={deleteUser}><input type="hidden" name="id" value={u.id} /><DeleteButton label="Supprimer le compte" confirmText="Supprimer ce compte et toutes ses données ?" /></form>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
