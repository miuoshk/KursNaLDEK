import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { isZenitLabsHost } from "@/lib/hosts";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (isZenitLabsHost((await headers()).get("host"))) {
    return [
      {
        url: "https://zenitlabs.pl",
        changeFrequency: "monthly",
        priority: 1,
      },
    ];
  }

  const baseUrl = "https://kursnaldek.pl";

  return [
    {
      url: baseUrl,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/regulamin`,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${baseUrl}/polityka-prywatnosci`,
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];
}
