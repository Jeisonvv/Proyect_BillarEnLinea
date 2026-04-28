export function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="max-w-3xl space-y-4">
      <p className="font-mono text-xs uppercase tracking-[0.34em] text-accent">{eyebrow}</p>
      <h2 className="font-display text-3xl leading-tight text-foreground sm:text-4xl lg:text-5xl">{title}</h2>
      <p className="max-w-2xl text-sm leading-7 text-muted sm:text-base lg:text-lg">{description}</p>
    </div>
  );
}