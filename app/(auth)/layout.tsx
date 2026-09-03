import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Rycina } from "@/features/shared/components/Rycina";

export const dynamic = "force-dynamic";

export default async function AuthLayout({ children }: { children: ReactNode }) {
  const tAuth = await getTranslations("auth");

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
        <Rycina
          id="sec-session-trigeminal"
          priority
          ink="sage"
          mask="fade-y"
          className="hidden lg:block left-1/2 top-1/2 aspect-[0.8] w-[110vw] -translate-x-1/2 -translate-y-1/2 opacity-[0.16]"
        />
        <Rycina
          id="sec-session-trigeminal"
          priority
          ink="sage"
          mask="fade-y"
          className="-top-[28vw] left-1/2 aspect-[0.8] w-[130vw] -translate-x-1/2 opacity-[0.2] lg:hidden"
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
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
