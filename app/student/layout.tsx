import AppShell from '@/components/AppShell';
import { requireRole } from '@/lib/auth';

export default async function Layout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireRole('student');
  return (
    <AppShell role="student" name={profile.full_name} nav={[
      { href: '/student', label: 'Mes cours', icon: 'book', exact: true },
      { href: '/student/assignments', label: 'Devoirs et notes', icon: 'tasks' },
    ]}>{children}</AppShell>
  );
}
