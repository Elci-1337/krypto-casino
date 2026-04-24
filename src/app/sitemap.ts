import type { MetadataRoute } from "next";

const SITE_URL = "https://kartengluecksspiel.com";

/**
 * Single source of truth for public routes. Add new entries here as the
 * site grows — the sitemap picks them up automatically.
 */
const routes: Array<{
  path: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
}> = [
  { path: "/", priority: 1.0, changeFrequency: "weekly" },
  { path: "/play/high-low", priority: 0.9, changeFrequency: "weekly" },
  // Upcoming routes — keep in sync with the games lineup on the landing page.
  { path: "/play/blackjack", priority: 0.8, changeFrequency: "monthly" },
  { path: "/play/poker", priority: 0.8, changeFrequency: "monthly" },
  { path: "/play/baccarat", priority: 0.8, changeFrequency: "monthly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return routes.map(({ path, priority, changeFrequency }) => ({
    url: `${SITE_URL}${path}`,
    lastModified,
    changeFrequency,
    priority,
  }));
}
