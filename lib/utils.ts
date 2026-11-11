export function formatDate(d: string | Date | null | undefined, withTime = false) {
  if (!d) return '—';
  return new Date(d).toLocaleString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  });
}

export const pct = (done: number, total: number) => (total ? Math.round((done / total) * 100) : 0);
