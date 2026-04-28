export function MetricCard({ value, label, note }: { value: string; label: string; note: string }) {
  return (
    <article className="rounded-[1.6rem] border border-white/10 bg-white/8 p-5 backdrop-blur-sm">
      <p className="font-mono text-[0.68rem] uppercase tracking-[0.34em] text-white/50">{label}</p>
      <p className="mt-4 font-display text-4xl leading-none text-white">{value}</p>
      <p className="mt-3 text-sm leading-6 text-white/70">{note}</p>
    </article>
  );
}