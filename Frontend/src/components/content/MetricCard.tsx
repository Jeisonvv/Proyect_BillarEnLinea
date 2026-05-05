export function MetricCard({ value, label, note }: { value: string; label: string; note: string }) {
  return (
    <article className="rounded-[1.35rem] border border-white/10 bg-white/8 p-4 backdrop-blur-sm sm:rounded-[1.6rem] sm:p-5">
      <p className="font-mono text-[0.62rem] uppercase tracking-[0.28em] text-white/50 sm:text-[0.68rem] sm:tracking-[0.34em]">{label}</p>
      <div className="mt-3 flex items-start gap-3 sm:mt-4 sm:block">
        <p className="shrink-0 font-display text-[2.2rem] leading-none text-white sm:text-4xl">{value}</p>
        <p className="text-sm leading-6 text-white/70 sm:mt-3">{note}</p>
      </div>
    </article>
  );
}