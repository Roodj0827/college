import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { HOME, type Role } from '@/lib/config';

export type Profile = {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  class_id: string | null;
};

export async function getSession() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (!profile) return null;
  return { user, profile: profile as Profile };
}

export async function requireRole(role: Role) {
  const session = await getSession();
  if (!session) redirect('/login');
  if (session.profile.role !== role) redirect(HOME[session.profile.role]);
  return session;
}
