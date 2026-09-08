import type { Metadata, Viewport } from "next";
import { DM_Sans, DM_Serif_Display } from "next/font/google";
import { headers } from "next/headers";
import { getLocale, getTranslations } from "next-intl/server";
import { ContentCopyGuard } from "@/features/shared/components/ContentCopyGuard";
import { IntlProvider } from "@/features/shared/components/IntlProvider";
import { isZenitLabsHost } from "@/lib/hosts";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

const dmSerifDisplay = DM_Serif_Display({
  subsets: ["latin", "latin-ext"],
  weight: "400",
  variable: "--font-heading",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export async function generateMetadata(): Promise<Metadata> {
  if (isZenitLabsHost((await headers()).get("host"))) {
    return {
      icons: {
        icon: [
          { url: "/studio/favicon.svg", type: "image/svg+xml" },
          { url: "/studio/favicon.ico", sizes: "48x48" },
        ],
        apple: "/studio/apple-touch-icon.png",
      },
    };
  }

  const t = await getTranslations("common");
  return {
    title: {
      default: t("metadataTitle"),
      absolute: t("metadataTitle"),
    },
    applicationName: t("appName"),
    description: t("metadataDescription"),
    icons: {
      icon: [
        { url: "/img/brand/icon.svg", type: "image/svg+xml" },
        { url: "/img/brand/favicon-32.png", sizes: "32x32", type: "image/png" },
      ],
      apple: "/img/brand/apple-touch-icon.png",
    },
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
        <IntlProvider>
          <ContentCopyGuard />
          {children}
        </IntlProvider>
      </body>
    </html>
  );
}
