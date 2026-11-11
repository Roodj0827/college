import { LogOut } from 'lucide-react';
import { APP_NAME, ROLE_LABEL, type Role } from '@/lib/config';
import { signOut } from '@/app/actions/auth';
import NavLinks, { type NavItem } from './NavLinks';

export default function AppShell({
  role, name, nav, children,
}: { role: Role; name: string; nav: NavItem[]; children: React.ReactNode }) {
  return (
    <div className="min-h-screen md:grid md:grid-cols-[240px_1fr]">
      <aside className="bg-ink p-4 text-white md:sticky md:top-0 md:flex md:h-screen md:flex-col">
        <div className="mb-4 flex items-center justify-between md:mb-8 md:block">
          <p className="font-display text-xl font-bold">{APP_NAME}</p>
          <p className="text-xs text-white/60 md:mt-1">{ROLE_LABEL[role]}</p>
        </div>
        <NavLinks items={nav} />
        <div className="mt-4 border-t border-white/15 pt-4 md:mt-auto">
          <p className="truncate text-sm font-medium">{name}</p>
          <form action={signOut}>
            <button className="mt-2 flex items-center gap-2 text-xs text-white/70 hover:text-white">
              <LogOut className="h-3.5 w-3.5" aria-hidden /> Se déconnecter
            </button>
          </form>
        </div>
      </aside>
      <main className="mx-auto w-full max-w-6xl p-5 md:p-8">{children}</main>
    </div>
  );
}
