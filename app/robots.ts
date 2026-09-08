import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { isZenitLabsHost } from "@/lib/hosts";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const host = (await headers()).get("host");

  if (isZenitLabsHost(host)) {
    return {
      rules: {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/", "/studio"],
      },
    };
  }

  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/regulamin", "/polityka-prywatnosci"],
      disallow: [
        "/admin/",
        "/api/",
        "/studio",
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
