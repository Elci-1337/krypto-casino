import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

export function supa(): SupabaseClient {
  if (_client) return _client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url) throw new Error("SUPABASE_URL is not set");
  if (!key) throw new Error("SUPABASE_SERVICE_KEY is not set");
  _client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _client;
}

export type JobStatus =
  | "pending"
  | "running"
  | "fetching"
  | "completed"
  | "failed";

export interface Job {
  id: string;
  keyword: string;
  location: string;
  country_code: string;
  language: string;
  max_results: number;
  apify_run_id: string | null;
  apify_dataset_id: string | null;
  status: JobStatus;
  error: string | null;
  created_at: string;
  updated_at: string;
}

export interface Place {
  id: number;
  job_id: string;
  place_id: string | null;
  name: string | null;
  category: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  country_code: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  domain: string | null;
  rating: number | null;
  review_count: number | null;
  lat: number | null;
  lng: number | null;
  maps_url: string | null;
  raw: unknown;
}

export interface DomainCheck {
  domain: string;
  dns_status: string | null;
  rdap_status: string | null;
  is_available: boolean | null;
  checked_at: string;
  error: string | null;
}

export interface PlaceWithCheck extends Place {
  dns_status: string | null;
  rdap_status: string | null;
  is_available: boolean | null;
  checked_at: string | null;
}
