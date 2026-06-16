import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { getSloganPool, pickSlogan } from "@/features/shared/lib/slogans";

export const dynamic = "force-dynamic";

export default async function AuthLayout({ children }: { children: ReactNode }) {
  const tCommon = await getTranslations("common");
  const tSlogans = await getTranslations("slogans");
  const slogan = pickSlogan(getSloganPool(tSlogans, "auth"), tSlogans("default"));

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <p className="font-heading text-heading-md text-brand-gold">{tCommon("appName")}</p>
          <p className="mt-2 font-body text-body-sm italic text-muted">
            {slogan}
          </p>
        </div>
        <div className="w-full max-w-md rounded-card bg-card p-8">{children}</div>
      </div>
    </div>
  );
}
