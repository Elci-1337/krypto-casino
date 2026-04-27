import { ApifyClient } from "apify-client";

export const GOOGLE_MAPS_ACTOR_ID = "compass/crawler-google-places";

export function apify(): ApifyClient {
  const token = process.env.APIFY_TOKEN;
  if (!token) throw new Error("APIFY_TOKEN is not set in environment");
  return new ApifyClient({ token });
}

export interface ScrapeInput {
  keyword: string;
  location: string;
  countryCode: string;
  language: string;
  maxResults: number;
}

export function buildActorInput(input: ScrapeInput) {
  return {
    searchStringsArray: [input.keyword],
    locationQuery: input.location,
    maxCrawledPlacesPerSearch: input.maxResults,
    language: input.language,
    countryCode: input.countryCode,
    website: "allPlaces",
    skipClosedPlaces: true,
    scrapePlaceDetailPage: false,
    scrapeContacts: false,
    scrapeTableReservationProvider: false,
    includeWebResults: false,
    scrapeDirectories: false,
    maxQuestions: 0,
    maxReviews: 0,
    maxImages: 0,
    scrapeSocialMediaProfiles: {
      facebooks: false,
      instagrams: false,
      youtubes: false,
      tiktoks: false,
      twitters: false,
    },
  };
}

export async function startRun(input: ScrapeInput) {
  const run = await apify().actor(GOOGLE_MAPS_ACTOR_ID).start(buildActorInput(input));
  return { runId: run.id, datasetId: run.defaultDatasetId, status: run.status };
}

export async function getRunStatus(runId: string) {
  const run = await apify().run(runId).get();
  return run;
}

export interface RawPlace {
  placeId?: string;
  title?: string;
  categoryName?: string;
  address?: string;
  street?: string;
  city?: string;
  postalCode?: string;
  countryCode?: string;
  phone?: string;
  phoneUnformatted?: string;
  emails?: string[];
  email?: string;
  website?: string;
  totalScore?: number;
  reviewsCount?: number;
  location?: { lat?: number; lng?: number };
  url?: string;
  [key: string]: unknown;
}

export async function fetchDatasetItems(datasetId: string): Promise<RawPlace[]> {
  const result = await apify().dataset<RawPlace>(datasetId).listItems({ clean: true });
  return result.items;
}

export function extractDomain(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url.startsWith("http") ? url : `https://${url}`);
    return u.hostname.toLowerCase().replace(/^www\./, "") || null;
  } catch {
    return null;
  }
}

export function normalizePlace(p: RawPlace, jobCountry: string) {
  const website = (p.website ?? "").trim() || null;
  const domain = extractDomain(website);
  const email =
    (Array.isArray(p.emails) && p.emails[0]) || p.email || null;
  return {
    place_id: p.placeId ?? null,
    name: p.title ?? null,
    category: p.categoryName ?? null,
    address: p.address ?? null,
    city: p.city ?? null,
    postal_code: p.postalCode ?? null,
    country_code: (p.countryCode ?? jobCountry) || null,
    phone: p.phoneUnformatted ?? p.phone ?? null,
    email: email || null,
    website,
    domain,
    rating: typeof p.totalScore === "number" ? p.totalScore : null,
    review_count: typeof p.reviewsCount === "number" ? p.reviewsCount : null,
    lat: p.location?.lat ?? null,
    lng: p.location?.lng ?? null,
    maps_url: p.url ?? null,
    raw: JSON.stringify(p),
  };
}
