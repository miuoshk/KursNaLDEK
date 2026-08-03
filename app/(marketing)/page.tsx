import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LandingContent } from "@/features/marketing/components/LandingContent";
import { isRegistrationOpen } from "@/lib/registrationWindow";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("marketing.metadata");

  return {
    metadataBase: new URL("https://kursnaldek.pl"),
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: "/",
    },
    openGraph: {
      type: "website",
      url: "/",
      siteName: "Kurs na LDEK",
      title: t("title"),
      description: t("description"),
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
    },
  };
}

export default function MarketingPage() {
  return <LandingContent registrationOpen={isRegistrationOpen()} />;
}
