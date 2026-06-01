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
  currentParticipants: number | null;
};

export type TournamentDetail = {
  id: string;
  slug: string;
  name: string;
  image: string | null;
  description: string | null;
  shortDescription: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  format: string | null;
  formatDetails: string | null;
  status: string | null;
  startDate: string | null;
  endDate: string | null;
  registrationDeadline: string | null;
  discount20Deadline: string | null;
  discount10Deadline: string | null;
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
    paymentMethod: string | null;
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
  slug: string;
  name: string;
  type: string | null;
  tier: string | null;
  status: string | null;
  startDate: string | null;
  endDate: string | null;
  entryFee: number | null;
  featured: boolean;
};

export type EventDetail = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  type: string | null;
  tier: string | null;
  status: string | null;
  organizer: string | null;
  location: string | null;
  city: string | null;
  department: string | null;
  country: string | null;
  startDate: string | null;
  endDate: string | null;
  entryFee: number | null;
  registrationMode: string | null;
  image: string | null;
  streamUrl: string | null;
  registrationUrl: string | null;
  hasGrandstand: boolean;
  grandstandDetails: string | null;
  ticketingMode: string | null;
  ticketPrice: number | null;
  ticketUrl: string | null;
  resultsUrl: string | null;
  featured: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
  prizes: Array<{
    position: number;
    description: string;
    amount: number | null;
  }>;
};

export type LandingActivity = {
  id: string;
  name: string;
  slug: string | null;
  prize: string | null;
  status: string | null;
  drawDate: string | null;
  ticketPrice: number | null;
  saleStatus: string | null;
  image: string | null;
  prizeImage: string | null;
  totalTickets: number | null;
  soldTickets: number | null;
  saleClosesAt: string | null;
  isFree: boolean | null;
  promoVideoUrl?: string | null;
};

export type ActivityDetail = LandingActivity & {
  description: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  tags: string[];
  hasWinner: boolean;
  winnerTicket: string | null;
  winnerName: string | null;
  numberSummary: {
    available: number;
    reserved: number;
    paid: number;
    winner: number;
  } | null;
  promoVideoUrl?: string | null;
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
  slug: string | null;
  brand: string | null;
  description: string | null;
  category: string | null;
  basePrice: number | null;
  image: string | null;
  tags: string[];
  stock: number | null;
};

export type PostDetail = LandingPost & {
  content: string | null;
  category: string | null;
  coverImageUrl: string | null;
  status: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  canonicalUrl: string | null;
  ogImageUrl: string | null;
  noIndex: boolean;
  readingTime: number | null;
};

export type ProductDetail = LandingProduct & {
  images: string[];
  isActive: boolean;
};

export type LandingSnapshot = {
  tournaments: CollectionState<LandingTournament>;
  events: CollectionState<LandingEvent>;
  activities: CollectionState<LandingActivity>;
  posts: CollectionState<LandingPost>;
  products: CollectionState<LandingProduct>;
  totals: {
    tournaments: number;
    events: number;
    activities: number;
    posts: number;
    products: number;
  };
};
