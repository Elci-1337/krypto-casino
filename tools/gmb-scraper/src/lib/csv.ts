import type { PlaceWithCheck } from "./db";

const HEADERS = [
  "name",
  "category",
  "address",
  "city",
  "postal_code",
  "country_code",
  "phone",
  "email",
  "website",
  "domain",
  "rating",
  "review_count",
  "lat",
  "lng",
  "maps_url",
  "place_id",
  "dns_status",
  "rdap_status",
  "is_available",
] as const;

function escape(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (/[",\n\r;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function placesToCsv(rows: PlaceWithCheck[]): string {
  const lines = [HEADERS.join(",")];
  for (const r of rows) {
    lines.push(
      HEADERS.map((h) => {
        if (h === "is_available") return r.is_available === 1 ? "true" : r.is_available === 0 ? "false" : "";
        return escape((r as unknown as Record<string, unknown>)[h]);
      }).join(","),
    );
  }
  return "﻿" + lines.join("\r\n") + "\r\n";
}
