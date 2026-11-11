'use server';

import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/auth';
import { createAdminClient, createClient } from '@/lib/supabase/server';

const str = (f: FormData, k: string) => String(f.get(k) ?? '').trim();
const ROLES = ['director', 'teacher', 'student'];

export async function createUser(formData: FormData) {
  await requireRole('director');
  const role = str(formData, 'role');
  if (!ROLES.includes(role)) throw new Error('Rôle invalide.');
  const password = str(formData, 'password');
  if (password.length < 8) throw new Error('Le mot de passe doit contenir au moins 8 caractères.');

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email: str(formData, 'email'),
    password,
    email_confirm: true,
    user_metadata: { full_name: str(formData, 'full_name') },
  });
  if (error) throw new Error(error.message);

  const { error: e2 } = await admin
    .from('profiles')
    .update({ role, class_id: str(formData, 'class_id') || null })
    .eq('id', data.user.id);
  if (e2) throw new Error(e2.message);
  revalidatePath('/director/users');
}

export async function updateUser(formData: FormData) {
  const { user } = await requireRole('director');
  const id = str(formData, 'id');
  const role = str(formData, 'role');
  if (!ROLES.includes(role)) throw new Error('Rôle invalide.');
  if (id === user.id && role !== 'director') throw new Error('Vous ne pouvez pas retirer votre propre rôle de Direction.');
  const supabase = createClient();
  const { error } = await supabase.from('profiles').update({ role, class_id: str(formData, 'class_id') || null }).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/director/users');
}

export async function deleteUser(formData: FormData) {
  const { user } = await requireRole('director');
  const id = str(formData, 'id');
  if (id === user.id) throw new Error('Vous ne pouvez pas supprimer votre propre compte.');
  const { error } = await createAdminClient().auth.admin.deleteUser(id);
  if (error) throw new Error(error.message);
  revalidatePath('/director/users');
}

export async function createClass(formData: FormData) {
  await requireRole('director');
  const { error } = await createClient()
    .from('classes')
    .insert({ name: str(formData, 'name'), department: str(formData, 'department') || null });
  if (error) throw new Error(error.message);
  revalidatePath('/director/classes');
}

export async function deleteClass(formData: FormData) {
  await requireRole('director');
  const { error } = await createClient().from('classes').delete().eq('id', str(formData, 'id'));
  if (error) throw new Error(error.message);
  revalidatePath('/director/classes');
}

export async function deleteCourseAsDirector(formData: FormData) {
  await requireRole('director');
  const { error } = await createClient().from('courses').delete().eq('id', str(formData, 'id'));
  if (error) throw new Error(error.message);
  revalidatePath('/director/courses');
}
