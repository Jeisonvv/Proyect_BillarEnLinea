import { getLandingEvents } from "./events";
import { getLandingPosts } from "./posts";
import { getLandingProducts } from "./products";
import { getLandingRaffles } from "./raffles";
import { getLandingTournaments } from "./tournaments";
import type { LandingSnapshot } from "./types";

export async function getLandingSnapshot(): Promise<LandingSnapshot> {
  const [tournaments, events, raffles, posts, products] = await Promise.all([
    getLandingTournaments(3),
    getLandingEvents(3),
    getLandingRaffles(3),
    getLandingPosts(3),
    getLandingProducts(3),
  ]);

  return {
    tournaments,
    events,
    raffles,
    posts,
    products,
    totals: {
      tournaments: tournaments.total,
      events: events.total,
      raffles: raffles.total,
      posts: posts.total,
      products: products.total,
    },
  };
}

export type { LandingSnapshot };
