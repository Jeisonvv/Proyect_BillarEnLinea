import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

type ShowcaseMetric = {
  label: string;
  value: string;
};

type ShowcaseBadgeTone = "gold" | "emerald" | "sky" | "rose" | "slate" | "neutral" | "amber" | "open";
type ShowcasePanelTone = "gold" | "emerald" | "sky" | "stone" | "rose";

type ShowcaseCardProps = {
  title: string;
  eyebrow: string;
  description: string;
  metrics: ShowcaseMetric[];
  href?: string;
  ctaLabel?: string;
  badge?: {
    label: string;
    tone?: ShowcaseBadgeTone;
  };
  secondaryBadge?: string;
  image?: {
    src?: string | null;
    alt: string;
    prioritize?: boolean;
    sizes?: string;
    quality?: number;
    loading?: "eager" | "lazy";
    fetchPriority?: "high" | "low" | "auto";
    objectClassName?: string;
  };
  visual: {
    overline: string;
    title: string;
    helper?: string;
    tone?: ShowcasePanelTone;
  };
  footer?: ReactNode;
};

function getBadgeClass(tone: ShowcaseBadgeTone = "neutral") {
  switch (tone) {
    case "gold":
      return "border-[rgba(246,196,79,0.24)] bg-[rgba(246,196,79,0.12)] text-[rgba(255,233,174,0.96)]";
    case "emerald":
      return "border-emerald-300/24 bg-emerald-400/12 text-emerald-100";
    case "open":
      return "border-emerald-300/90 bg-emerald-400/50 text-white";
    case "sky":
      return "border-sky-300/24 bg-sky-400/12 text-sky-100";
    case "rose":
      return "border-rose-300/24 bg-rose-400/12 text-rose-100";
    case "slate":
      return "border-slate-300/24 bg-slate-300/12 text-slate-100";
    case "amber":
      return "border-amber-300/24 bg-amber-400/12 text-amber-100";
    default:
      return "border-white/14 bg-black/28 text-white/88";
  }
}

function getPanelToneClass(tone: ShowcasePanelTone = "gold") {
  switch (tone) {
    case "emerald":
      return "bg-[linear-gradient(135deg,rgba(58,180,133,0.18),rgba(14,28,32,0.12),rgba(255,255,255,0.04))]";
    case "sky":
      return "bg-[linear-gradient(135deg,rgba(88,164,255,0.18),rgba(16,34,50,0.12),rgba(255,255,255,0.04))]";
    case "rose":
      return "bg-[linear-gradient(135deg,rgba(244,114,182,0.16),rgba(40,16,30,0.12),rgba(255,255,255,0.04))]";
    case "stone":
      return "bg-[linear-gradient(135deg,rgba(214,179,109,0.14),rgba(34,34,38,0.12),rgba(255,255,255,0.04))]";
    default:
      return "bg-[linear-gradient(135deg,rgba(246,196,79,0.16),rgba(13,110,174,0.16),rgba(255,255,255,0.04))]";
  }
}

function ShowcaseCardInner({
  title,
  eyebrow,
  description,
  metrics,
  ctaLabel = "Ver detalle",
  badge,
  secondaryBadge,
  image,
  visual,
  footer,
}: Omit<ShowcaseCardProps, "href">) {
  return (
    <article className="relative overflow-hidden rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(15,18,24,0.96),rgba(9,11,16,0.98))] shadow-[0_18px_60px_rgba(0,0,0,0.34)] transition duration-300 hover:-translate-y-2 hover:border-[rgba(246,196,79,0.3)] hover:shadow-[0_28px_90px_rgba(0,0,0,0.45)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(246,196,79,0.16),transparent_28%),radial-gradient(circle_at_82%_18%,rgba(13,110,174,0.18),transparent_24%)] opacity-80 transition duration-300 group-hover:opacity-100" />

      <div className="relative xl:grid xl:grid-cols-[minmax(0,0.95fr)_minmax(25rem,0.85fr)]">
        <div className={`relative h-52 overflow-hidden border-b border-white/10 bg-black/30 sm:h-60 lg:h-72 xl:h-full xl:min-h-96 xl:border-b-0 xl:border-r xl:border-white/10 ${image?.src ? "" : getPanelToneClass(visual.tone)}`}>
          {image?.src ? (
            <Image
              src={image.src}
              alt={image.alt}
              fill
              priority={image.prioritize}
              loading={image.loading}
              fetchPriority={image.fetchPriority}
              quality={image.quality}
              sizes={image.sizes ?? "(min-width: 1536px) 42vw, (min-width: 1280px) 44vw, (min-width: 768px) 50vw, 100vw"}
              className={image.objectClassName ?? "object-contain object-center p-2 transition duration-700 group-hover:scale-105 sm:object-cover sm:p-0 md:object-[center_22%] xl:object-[center_18%]"}
            />
          ) : null}

          {!image?.src ? (
            <div className={`absolute inset-0 ${getPanelToneClass(visual.tone)}`} />
          ) : null}

          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,10,14,0.08),rgba(8,10,14,0.2),rgba(8,10,14,0.92))]" />

          <div className="absolute left-4 right-4 top-4 flex items-start justify-between gap-3">
            {badge ? (
              <span className={`rounded-full border px-3 py-1 font-mono text-[0.68rem] uppercase tracking-[0.26em] backdrop-blur-sm ${getBadgeClass(badge.tone)}`}>
                {badge.label}
              </span>
            ) : <span />}

            {secondaryBadge ? (
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.2rem] border border-white/10 bg-white/6 text-center text-[0.62rem] uppercase tracking-[0.24em] text-white/46">
                {secondaryBadge}
              </div>
            ) : null}
          </div>

          <div className="absolute bottom-0 left-0 right-0 px-5 pb-5 xl:px-6 xl:pb-6">
            <div className="max-w-[16rem] rounded-[1.4rem] border border-white/10 bg-black/28 p-3 backdrop-blur-md xl:max-w-[18rem] xl:p-4">
              <p className="font-mono text-[0.62rem] uppercase tracking-[0.3em] text-white/48">{visual.overline}</p>
              {visual.title ? <p className="mt-3 text-lg font-semibold text-white xl:text-xl">{visual.title}</p> : null}
              {visual.helper ? <p className="mt-2 text-sm leading-6 text-white/66">{visual.helper}</p> : null}
            </div>
          </div>
        </div>

        <div className="relative p-5 xl:flex xl:flex-col xl:justify-between xl:p-7 2xl:p-8">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="font-mono text-[0.68rem] uppercase tracking-[0.28em] text-[rgba(246,196,79,0.72)]">{eyebrow}</p>
              <h3 className="mt-3 text-[1.45rem] font-semibold leading-tight text-white xl:max-w-[18ch] xl:text-[1.7rem]">{title}</h3>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/72">{description}</p>
            </div>
          </div>

          <div className={`mt-5 grid gap-3 xl:mt-6 ${metrics.length >= 3 ? "sm:grid-cols-3" : metrics.length === 2 ? "sm:grid-cols-2" : "sm:grid-cols-1"}`}>
            {metrics.map((metric) => (
              <div key={`${metric.label}-${metric.value}`} className="rounded-[1.3rem] border border-white/8 bg-white/6 p-3">
                <p className="font-mono text-[0.62rem] uppercase tracking-[0.24em] text-white/42">{metric.label}</p>
                <p className="mt-2 text-sm font-medium text-white/88">{metric.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-col gap-4 border-t border-white/8 pt-4 sm:flex-row sm:items-center sm:justify-between xl:mt-6">
            <span className="rounded-full border border-[rgba(246,196,79,0.26)] bg-[rgba(246,196,79,0.08)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[rgba(246,196,79,0.92)] transition duration-300 group-hover:bg-[rgba(246,196,79,0.14)]">
              {ctaLabel}
            </span>
            {footer ? <div className="text-sm text-white/58">{footer}</div> : null}
          </div>
        </div>
      </div>
    </article>
  );
}

export type { ShowcaseCardProps };

export function ShowcaseCard(props: ShowcaseCardProps) {
  if (props.href) {
    return (
      <Link
        aria-label={props.ctaLabel ? `${props.ctaLabel}: ${props.title}` : props.title}
        className="group block w-full rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(246,196,79,0.7)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0d12]"
        href={props.href}
      >
        <ShowcaseCardInner {...props} />
      </Link>
    );
  }

  return <ShowcaseCardInner {...props} />;
}