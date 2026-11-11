'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, ClipboardList, GraduationCap, Home, Layers, School, Users } from 'lucide-react';

const ICONS = { home: Home, book: BookOpen, tasks: ClipboardList, users: Users, layers: Layers, school: School, cap: GraduationCap };
export type IconName = keyof typeof ICONS;
export type NavItem = { href: string; label: string; icon: IconName; exact?: boolean };

export default function NavLinks({ items }: { items: NavItem[] }) {
  const path = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto md:flex-col" aria-label="Navigation principale">
      {items.map(({ href, label, icon, exact }) => {
        const Icon = ICONS[icon];
        const active = exact ? path === href : path.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={`flex shrink-0 items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              active ? 'bg-white text-ink' : 'text-white/75 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Icon className="h-4 w-4" aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
