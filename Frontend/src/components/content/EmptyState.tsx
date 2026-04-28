export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-line bg-white/5 p-5">
      <p className="font-mono text-[0.68rem] uppercase tracking-[0.3em] text-accent-soft">{title}</p>
      <p className="mt-3 text-sm leading-7 text-muted">{body}</p>
    </div>
  );
}