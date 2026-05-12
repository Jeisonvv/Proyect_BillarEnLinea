import { getLandingEvents } from "./events";
import { getLandingPosts } from "./posts";
import { getLandingProducts } from "./products";
import { getLandingActivities } from "./activities";
import { getLandingTournaments } from "./tournaments";
import type { LandingSnapshot } from "./types";

export async function getLandingSnapshot(): Promise<LandingSnapshot> {
  const [tournaments, events, activities, posts, products] = await Promise.all([
    getLandingTournaments(3),
    getLandingEvents(3),
    getLandingActivities(3),
    getLandingPosts(3),
    getLandingProducts(3),
  ]);

  return {
    tournaments,
    events,
    activities,
    posts,
    products,
    totals: {
      tournaments: tournaments.total,
      events: events.total,
      activities: activities.total,
      posts: posts.total,
      products: products.total,
    },
  };
}

export type { LandingSnapshot };
