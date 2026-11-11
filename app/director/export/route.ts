import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const s = await getSession();
  if (!s || s.profile.role !== 'director') return new NextResponse('Accès refusé', { status: 403 });

  const { data } = await createClient()
    .from('activity_logs')
    .select('created_at, action, details, profiles(full_name, email, role)')
    .order('created_at', { ascending: false })
    .limit(10000);

  const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const rows = (data ?? []).map((l: any) =>
    [l.created_at, l.profiles?.full_name, l.profiles?.email, l.profiles?.role, l.action, l.details ? JSON.stringify(l.details) : ''].map(esc).join(',')
  );
  const csv = '\uFEFF' + ['Date,Nom,Email,Role,Action,Details', ...rows].join('\n');

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="activite-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
