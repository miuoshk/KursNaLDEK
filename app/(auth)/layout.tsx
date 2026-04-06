import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-bg px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <p className="font-heading text-heading-md text-brand-gold">Kurs na LDEK</p>
          <p className="mt-2 font-body text-body-sm italic text-muted">
            Każde pytanie przybliża Cię do celu.
          </p>
        </div>
        <div className="w-full max-w-md rounded-card bg-brand-card-1 p-8">{children}</div>
      </div>
    </div>
  );
}
