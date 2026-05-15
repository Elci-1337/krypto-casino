import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${site.url}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${site.url}/impressum`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${site.url}/datenschutz`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];
}
