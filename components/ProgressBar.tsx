export default function ProgressBar({ value, label }: { value: number; label?: string }) {
  return (
    <div>
      <div className="h-2 overflow-hidden rounded-full bg-brand-soft" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100} aria-label={label ?? 'Progression'}>
        <div className="h-full rounded-full bg-brand" style={{ width: `${value}%` }} />
      </div>
      <p className="mt-1 text-xs text-slate-500">{value}% terminé</p>
    </div>
  );
}
