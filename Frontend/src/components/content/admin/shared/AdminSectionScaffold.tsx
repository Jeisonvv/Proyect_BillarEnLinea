import Link from "next/link";
import { ReactNode } from "react";

export function formatAdminDate(value: string | null) {
  if (!value) {
    return "Sin fecha definida";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

export function formatAdminMoney(value: number | null) {
  if (value === null || !Number.isFinite(value)) {
    return "Por definir";
  }

  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
}

export function humanizeAdminToken(value: string | null) {
  if (!value) {
    return "Sin dato";
  }

  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

type Metric = {
  label: string;
  value: string;
  helper: string;
};

type Action = {
  label: string;
  href: string;
  accent?: "solid" | "ghost";
};

export function AdminSectionScaffold({
  kicker,
  title,
  description,
  metrics,
  primaryAction,
  secondaryAction,
  children,
}: {
  kicker: string;
  title: string;
  description: string;
  metrics: Metric[];
  primaryAction?: Action;
  secondaryAction?: Action;
  children: ReactNode;
}) {
  return (
    <main className="grid gap-6">
      <section className="relative overflow-hidden rounded-[2rem] border border-[rgba(246,196,79,0.16)] bg-[linear-gradient(135deg,rgba(11,13,18,0.98),rgba(16,21,30,0.96)_46%,rgba(10,36,57,0.92)_100%)] p-5 shadow-[0_30px_80px_rgba(0,0,0,0.34)] sm:p-6 lg:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(246,196,79,0.22),transparent_28%),radial-gradient(circle_at_100%_10%,rgba(49,121,182,0.18),transparent_30%),linear-gradient(120deg,transparent_0%,rgba(255,255,255,0.04)_48%,transparent_58%)]" />
        <div className="relative grid gap-8 xl:grid-cols-[1.05fr_0.95fr] xl:items-end">
          <div className="space-y-4">
            <p className="text-[0.72rem] uppercase tracking-[0.34em] text-[#f6c44f]">{kicker}</p>
            <div className="space-y-3">
              <h1 className="max-w-4xl text-3xl font-semibold leading-tight text-white sm:text-4xl xl:text-[3.2rem]">{title}</h1>
              <p className="max-w-3xl text-sm leading-7 text-white/70 sm:text-base">{description}</p>
            </div>
            <div className="flex flex-wrap gap-3 pt-2">
              {primaryAction ? (
                <Link
                  className="inline-flex items-center justify-center rounded-full bg-accent px-5 py-3 text-sm font-semibold text-[#10110f] transition hover:bg-accent-strong"
                  href={primaryAction.href}
                >
                  {primaryAction.label}
                </Link>
              ) : null}
              {secondaryAction ? (
                <Link
                  className={secondaryAction.accent === "solid"
                    ? "inline-flex items-center justify-center rounded-full bg-accent px-5 py-3 text-sm font-semibold text-[#10110f] transition hover:bg-accent-strong"
                    : "inline-flex items-center justify-center rounded-full border border-white/12 px-5 py-3 text-sm font-semibold text-white/82 transition hover:bg-white/8 hover:text-white"
                  }
                  href={secondaryAction.href}
                >
                  {secondaryAction.label}
                </Link>
              ) : null}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {metrics.map((metric) => (
              <article key={metric.label} className="rounded-[1.6rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.04))] p-4 backdrop-blur-sm">
                <p className="text-[0.68rem] uppercase tracking-[0.24em] text-white/48">{metric.label}</p>
                <p className="mt-3 text-3xl font-semibold text-white">{metric.value}</p>
                <p className="mt-2 text-sm leading-6 text-white/62">{metric.helper}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4">{children}</section>
    </main>
  );
}