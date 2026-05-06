export type CollectionState<T> = {
  items: T[];
  total: number;
  error: string | null;
};

export type LandingTournament = {
  id: string;
  slug: string;
  name: string;
  image: string | null;
  format: string | null;
  status: string | null;
  startDate: string | null;
  entryFee: number | null;
  maxParticipants: number | null;
};

export type TournamentDetail = {
  id: string;
  slug: string;
  name: string;
  image: string | null;
  description: string | null;
  shortDescription: string | null;
  format: string | null;
  formatDetails: string | null;
  status: string | null;
  startDate: string | null;
  endDate: string | null;
  registrationDeadline: string | null;
  entryFee: number | null;
  maxParticipants: number | null;
  currentParticipants: number | null;
  playersPerGroup: number | null;
  groupStageTables: number | null;
  venueName: string | null;
  location: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  streamUrl: string | null;
  contactPhone: string | null;
  tags: string[];
  allowedCategories: string[];
  groupStageSlots: Array<{
    id: string;
    date: string | null;
    startTime: string | null;
    endTime: string | null;
    label: string | null;
  }>;
  totalRegistrations: number | null;
  confirmedRegistrations: number | null;
  registrations: Array<{
    id: string;
    status: string | null;
    playerCategory: string | null;
    handicap: number | null;
    notes: string | null;
    createdAt: string | null;
    groupStageSlotId: string | null;
    user: {
      id: string | null;
      name: string | null;
      phone: string | null;
      avatarUrl: string | null;
      playerCategory: string | null;
    } | null;
  }>;
  prizes: Array<{
    position: number;
    description: string;
    amount: number | null;
  }>;
};

export type LandingEvent = {
  id: string;
  name: string;
  type: string | null;
  tier: string | null;
  status: string | null;
  startDate: string | null;
  endDate: string | null;
  entryFee: number | null;
  featured: boolean;
};

export type LandingRaffle = {
  id: string;
  name: string;
  prize: string | null;
  status: string | null;
  drawDate: string | null;
  ticketPrice: number | null;
  saleStatus: string | null;
};

export type LandingPost = {
  id: string;
  title: string;
  excerpt: string | null;
  slug: string | null;
  publishedAt: string | null;
  tags: string[];
};

export type LandingProduct = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  basePrice: number | null;
  image: string | null;
  tags: string[];
  stock: number | null;
};

export type LandingSnapshot = {
  tournaments: CollectionState<LandingTournament>;
  events: CollectionState<LandingEvent>;
  raffles: CollectionState<LandingRaffle>;
  posts: CollectionState<LandingPost>;
  products: CollectionState<LandingProduct>;
  totals: {
    tournaments: number;
    events: number;
    raffles: number;
    posts: number;
    products: number;
  };
};
