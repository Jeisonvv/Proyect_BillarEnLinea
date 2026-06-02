import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";
import {
  getLandingActivities,
  getLandingEvents,
  getLandingPosts,
  getLandingProducts,
  getLandingTournaments,
} from "@/lib/api/public-content";

function safeDate(value?: string | null) {
  if (!value) {
    return new Date();
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function toSlug(value?: string | null, fallback?: string | null) {
  const normalized = value?.trim();
  if (normalized) {
    return normalized;
  }

  return fallback?.trim() ?? null;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();

  const [tournaments, events, activities, posts, products] = await Promise.all([
    getLandingTournaments(500),
    getLandingEvents(500),
    getLandingActivities(500),
    getLandingPosts(500),
    getLandingProducts(500),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/"),
      lastModified,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: absoluteUrl("/home"),
      lastModified,
      changeFrequency: "daily",
      priority: 0.95,
    },
    {
      url: absoluteUrl("/home/torneos"),
      lastModified,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: absoluteUrl("/home/activities"),
      lastModified,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: absoluteUrl("/home/eventos"),
      lastModified,
      changeFrequency: "daily",
      priority: 0.85,
    },
    {
      url: absoluteUrl("/home/noticias"),
      lastModified,
      changeFrequency: "daily",
      priority: 0.85,
    },
    {
      url: absoluteUrl("/home/tienda"),
      lastModified,
      changeFrequency: "daily",
      priority: 0.85,
    },
    {
      url: absoluteUrl("/register"),
      lastModified,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: absoluteUrl("/login"),
      lastModified,
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  const tournamentRoutes: MetadataRoute.Sitemap = tournaments.items.flatMap((item) => {
    const slug = toSlug(item.slug, item.id);
    if (!slug) return [];

    return [
      {
        url: absoluteUrl(`/home/torneos/${encodeURIComponent(slug)}`),
        lastModified: safeDate(item.startDate),
        changeFrequency: "daily" as const,
        priority: 0.8,
      },
    ];
  });

  const activityRoutes: MetadataRoute.Sitemap = activities.items.flatMap((item) => {
    const slug = toSlug(item.slug, item.id);
    if (!slug) return [];

    return [
      {
        url: absoluteUrl(`/home/activities/${encodeURIComponent(slug)}`),
        lastModified: safeDate(item.drawDate ?? item.saleClosesAt),
        changeFrequency: "daily" as const,
        priority: 0.8,
      },
    ];
  });

  const eventRoutes: MetadataRoute.Sitemap = events.items.flatMap((item) => {
    const slug = toSlug(item.slug, item.id);
    if (!slug) return [];

    return [
      {
        url: absoluteUrl(`/home/eventos/${encodeURIComponent(slug)}`),
        lastModified: safeDate(item.endDate ?? item.startDate),
        changeFrequency: "daily" as const,
        priority: 0.75,
      },
    ];
  });

  const postRoutes: MetadataRoute.Sitemap = posts.items.flatMap((item) => {
    const slug = toSlug(item.slug, item.id);
    if (!slug) return [];

    return [
      {
        url: absoluteUrl(`/home/noticias/${encodeURIComponent(slug)}`),
        lastModified: safeDate(item.publishedAt),
        changeFrequency: "daily" as const,
        priority: 0.75,
      },
    ];
  });

  const productRoutes: MetadataRoute.Sitemap = products.items.flatMap((item) => {
    const slug = toSlug(item.slug, item.id);
    if (!slug) return [];

    return [
      {
        url: absoluteUrl(`/home/tienda/${encodeURIComponent(slug)}`),
        lastModified,
        changeFrequency: "daily" as const,
        priority: 0.7,
      },
    ];
  });

  const allRoutes = [
    ...staticRoutes,
    ...tournamentRoutes,
    ...activityRoutes,
    ...eventRoutes,
    ...postRoutes,
    ...productRoutes,
  ];

  const uniqueRoutes = new Map<string, MetadataRoute.Sitemap[number]>();
  for (const route of allRoutes) {
    uniqueRoutes.set(route.url, route);
  }

  return Array.from(uniqueRoutes.values());
}