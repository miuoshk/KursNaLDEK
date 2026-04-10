"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="flex max-w-md flex-col items-center text-center">
        <AlertTriangle
          className="size-12 shrink-0 text-error"
          aria-hidden
        />
        <h1 className="mt-6 font-heading text-heading-lg">Coś poszło nie tak</h1>
        <p className="mt-3 line-clamp-2 overflow-hidden font-body text-body-sm text-secondary">
          {error.message}
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="mt-8 rounded-btn bg-brand-sage px-6 py-2.5 font-body text-body-md text-white transition hover:brightness-110"
        >
          Spróbuj ponownie
        </button>
        <Link
          href="/pulpit"
          className="mt-4 font-body text-body-sm text-brand-gold hover:underline"
        >
          Wróć do pulpitu
        </Link>
      </div>
    </div>
  );
}
