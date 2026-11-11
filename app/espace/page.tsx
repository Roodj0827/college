import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { HOME } from '@/lib/config';

export default async function Espace() {
  const s = await getSession();
  if (!s) redirect('/login');
  redirect(HOME[s.profile.role]);
}
