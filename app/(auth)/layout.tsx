import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Rycina } from "@/features/shared/components/Rycina";
import { getSloganPool, pickSlogan } from "@/features/shared/lib/slogans";

export const dynamic = "force-dynamic";

export default async function AuthLayout({ children }: { children: ReactNode }) {
  const tAuth = await getTranslations("auth");
  const tSlogans = await getTranslations("slogans");
  const slogan = pickSlogan(getSloganPool(tSlogans, "auth"), tSlogans("default"));

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background">
      {/* Ryciny przypięte do viewportu (formularz rejestracji jest dłuższy niż ekran). Desktop: krawędzie jak na landingu, mobile: jedna płyta za nagłówkiem. */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
        <Rycina
          id="auth-bg-skull"
          priority
          mask="edge-left"
          className="hidden lg:block -left-[10vh] top-1/2 aspect-square h-[92vh] -translate-y-1/2 opacity-[0.22]"
        />
        <Rycina
          id="auth-bg-jaw"
          mask="edge-right"
          className="hidden lg:block -bottom-[6vh] -right-[4vw] aspect-[1.4] h-[60vh] opacity-[0.2]"
        />
        <Rycina
          id="auth-bg-skull"
          priority
          mask="fade-y"
          className="-top-[38vw] left-1/2 aspect-square w-[150vw] -translate-x-1/2 opacity-[0.18] lg:hidden"
        />
      </div>

      <header className="relative z-10 mx-auto flex h-16 w-full max-w-[1400px] items-center justify-between px-5 sm:px-8 lg:px-12">
        <Link href="/" className="font-heading text-lg text-primary">
          Kurs na <span className="text-brand-gold">LDEK</span>
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 font-body text-body-sm text-secondary transition-colors duration-200 ease-out hover:text-primary"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          {tAuth("backToHome")}
        </Link>
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-4 pb-14 pt-6 sm:pt-10">
        <div className="w-full max-w-md">
          <p className="mb-6 text-balance text-center font-heading text-heading-md text-primary">{slogan}</p>
          <div className="rounded-card border border-border bg-card/90 p-6 shadow-[0_24px_60px_-30px_rgba(0,0,0,0.6)] backdrop-blur-sm sm:p-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
