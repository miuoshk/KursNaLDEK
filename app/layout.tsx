import type { Metadata } from "next";
import { DM_Sans, DM_Serif_Display } from "next/font/google";
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

export const metadata: Metadata = {
  title: "Kurs na LDEK — Platforma do nauki",
  description:
    "Adaptacyjna platforma przygotowująca do egzaminów medycznych. Każde pytanie przybliża Cię do celu.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pl"
      className={`${dmSans.variable} ${dmSerifDisplay.variable}`}
    >
      <body className="font-body bg-background text-primary antialiased">
        {children}
      </body>
    </html>
  );
}
