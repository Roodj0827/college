import AppShell from '@/components/AppShell';
import { requireRole } from '@/lib/auth';

export default async function Layout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireRole('teacher');
  return (
    <AppShell role="teacher" name={profile.full_name} nav={[
      { href: '/teacher', label: 'Mes cours', icon: 'book', exact: true },
      { href: '/teacher/courses/new', label: 'Nouveau cours', icon: 'layers' },
    ]}>{children}</AppShell>
  );
}
