import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: "https://studioundesignated.com/sitemap.xml",
    host: "https://studioundesignated.com",
  };
}
