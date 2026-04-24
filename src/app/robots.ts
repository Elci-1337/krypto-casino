import type { MetadataRoute } from "next";

const SITE_URL = "https://kartengluecksspiel.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Future auth / API / admin surfaces must never be indexed.
        disallow: ["/api/", "/admin/", "/account/", "/internal/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
