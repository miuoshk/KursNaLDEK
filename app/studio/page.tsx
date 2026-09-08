import type { Metadata } from "next";
import { StudioHome } from "@/features/studio/components/StudioHome";
import { studioMeta } from "@/features/studio/copy";

const TITLE = studioMeta.title;
const DESCRIPTION = studioMeta.description;

export const metadata: Metadata = {
  metadataBase: new URL("https://zenitlabs.pl"),
  title: {
    absolute: TITLE,
  },
  description: DESCRIPTION,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Zenit Labs",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/studio/og-image.jpg"],
  },
  icons: {
    icon: [
      { url: "/studio/favicon.svg", type: "image/svg+xml" },
      { url: "/studio/favicon.ico", sizes: "48x48" },
    ],
    apple: "/studio/apple-touch-icon.png",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function StudioPage() {
  return <StudioHome />;
}
