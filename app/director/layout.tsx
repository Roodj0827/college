import AppShell from '@/components/AppShell';
import { requireRole } from '@/lib/auth';

export default async function Layout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireRole('director');
  return (
    <AppShell role="director" name={profile.full_name} nav={[
      { href: '/director', label: 'Tableau de bord', icon: 'home', exact: true },
      { href: '/director/users', label: 'Utilisateurs', icon: 'users' },
      { href: '/director/classes', label: 'Classes', icon: 'school' },
      { href: '/director/courses', label: 'Cours', icon: 'book' },
    ]}>{children}</AppShell>
  );
}
