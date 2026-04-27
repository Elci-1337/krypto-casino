import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

let _db: Database.Database | null = null;

function open(): Database.Database {
  const path = resolve(process.env.DB_PATH ?? "./data/gmb.db");
  mkdirSync(dirname(path), { recursive: true });
  const db = new Database(path);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  migrate(db);
  return db;
}

export function db(): Database.Database {
  if (!_db) _db = open();
  return _db;
}

function migrate(d: Database.Database) {
  d.exec(`
    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      keyword TEXT NOT NULL,
      location TEXT NOT NULL,
      country_code TEXT NOT NULL DEFAULT 'DE',
      language TEXT NOT NULL DEFAULT 'de',
      max_results INTEGER NOT NULL,
      apify_run_id TEXT,
      apify_dataset_id TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      error TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS places (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
      place_id TEXT,
      name TEXT,
      category TEXT,
      address TEXT,
      city TEXT,
      postal_code TEXT,
      country_code TEXT,
      phone TEXT,
      email TEXT,
      website TEXT,
      domain TEXT,
      rating REAL,
      review_count INTEGER,
      lat REAL,
      lng REAL,
      maps_url TEXT,
      raw TEXT,
      UNIQUE(job_id, place_id)
    );
    CREATE INDEX IF NOT EXISTS idx_places_job ON places(job_id);
    CREATE INDEX IF NOT EXISTS idx_places_domain ON places(domain);

    CREATE TABLE IF NOT EXISTS domain_checks (
      domain TEXT PRIMARY KEY,
      dns_status TEXT,
      rdap_status TEXT,
      is_available INTEGER,
      checked_at INTEGER NOT NULL,
      error TEXT
    );
  `);
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
  created_at: number;
  updated_at: number;
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
  raw: string | null;
}

export interface DomainCheck {
  domain: string;
  dns_status: string | null;
  rdap_status: string | null;
  is_available: number | null;
  checked_at: number;
  error: string | null;
}

export interface PlaceWithCheck extends Place {
  dns_status: string | null;
  rdap_status: string | null;
  is_available: number | null;
  checked_at: number | null;
}
