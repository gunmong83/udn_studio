import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/" },
      // Explicitly document access for the major public search crawlers.
      { userAgent: ["Googlebot", "Yeti", "OAI-SearchBot", "Bingbot"], allow: "/" },
    ],
    sitemap: "https://studioundesignated.com/sitemap.xml",
    host: "https://studioundesignated.com",
  };
}
