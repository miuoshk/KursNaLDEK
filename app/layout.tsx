import type { Metadata } from "next";
import { DM_Sans, DM_Serif_Display } from "next/font/google";
import { getLocale, getTranslations } from "next-intl/server";
import { IntlProvider } from "@/features/shared/components/IntlProvider";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

const dmSerifDisplay = DM_Serif_Display({
  subsets: ["latin", "latin-ext"],
  weight: "400",
  variable: "--font-heading",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("common");
  return {
    title: {
      default: t("metadataTitle"),
      absolute: t("metadataTitle"),
    },
    applicationName: t("appName"),
    description: t("metadataDescription"),
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();

  return (
    <html lang={locale} className={`${dmSans.variable} ${dmSerifDisplay.variable}`}>
      <body className="font-body bg-background text-primary antialiased">
        <IntlProvider>{children}</IntlProvider>
      </body>
    </html>
  );
}
