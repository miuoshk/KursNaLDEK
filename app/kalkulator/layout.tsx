import type { Metadata } from "next";
import type { ReactNode } from "react";
import { KalkulatorFooter } from "@/features/kalkulator/components/KalkulatorFooter";
import { KalkulatorRoot } from "@/features/kalkulator/components/KalkulatorRoot";
import "@/features/kalkulator/styles/kalkulator-theme.css";

export const metadata: Metadata = {
  title: "Kalkulator kosztów procedur | kursnaldek.pl",
  robots: { index: false, follow: false },
};

export default function KalkulatorLayout({ children }: { children: ReactNode }) {
  return (
    <div className="kalkulator-theme flex min-h-screen flex-col">
      <KalkulatorRoot>
        <div className="flex-1">{children}</div>
      </KalkulatorRoot>
      <KalkulatorFooter />
    </div>
  );
}
