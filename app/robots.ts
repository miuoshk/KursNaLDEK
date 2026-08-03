import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/regulamin", "/polityka-prywatnosci"],
      disallow: [
        "/admin/",
        "/api/",
        "/pulpit",
        "/przedmioty",
        "/sesja/",
        "/statystyki",
        "/ustawienia",
        "/wybor-roku",
      ],
    },
    sitemap: "https://kursnaldek.pl/sitemap.xml",
  };
}
