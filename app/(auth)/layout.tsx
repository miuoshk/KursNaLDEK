import type { ReactNode } from "react";
import { AUTH_SLOGANS, pickSlogan } from "@/features/shared/lib/slogans";

export const dynamic = "force-dynamic";

export default function AuthLayout({ children }: { children: ReactNode }) {
  const slogan = pickSlogan(AUTH_SLOGANS);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <p className="font-heading text-heading-md text-brand-gold">Kurs na LDEK</p>
          <p className="mt-2 font-body text-body-sm italic text-muted">
            {slogan}
          </p>
        </div>
        <div className="w-full max-w-md rounded-card bg-card p-8">{children}</div>
      </div>
    </div>
  );
}
