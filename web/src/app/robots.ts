import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: "https://fonts.blissbiovn.com/sitemap.xml",
    host: "https://fonts.blissbiovn.com",
  };
}
