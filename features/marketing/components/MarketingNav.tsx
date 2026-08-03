"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

type MarketingNavProps = {
  registrationOpen: boolean;
};

export function MarketingNav({ registrationOpen }: MarketingNavProps) {
  const t = useTranslations("marketing");
  const [open, setOpen] = useState(false);

  const links = [
    { href: "#jak-dziala", label: t("nav.how") },
    { href: "#dla-kogo", label: t("nav.forWhom") },
    { href: "#faq", label: t("nav.faq") },
  ];

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.08] bg-sidebar/85 backdrop-blur-xl">
      <nav
        className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-5 sm:px-8 lg:px-12"
        aria-label={t("nav.ariaLabel")}
      >
        <Link href="/" className="font-heading text-lg text-primary" onClick={() => setOpen(false)}>
          Kurs na <span className="text-brand-gold">LDEK</span>
        </Link>

        <div className="hidden items-center gap-7 md:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="font-body text-body-sm font-medium text-secondary transition-colors duration-200 ease-out hover:text-primary"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/login"
            className="rounded-btn px-3 py-2 font-body text-body-sm font-semibold text-secondary transition-colors duration-200 ease-out hover:text-primary"
          >
            {t("actions.login")}
          </Link>
          <Link
            href={registrationOpen ? "/register" : "/login"}
            className="rounded-btn bg-brand-gold px-4 py-2 font-body text-body-sm font-semibold text-brand-bg transition duration-200 ease-out hover:brightness-110 active:scale-[0.98]"
          >
            {registrationOpen ? t("actions.register") : t("actions.login")}
          </Link>
        </div>

        <button
          type="button"
          className="grid size-11 place-items-center rounded-btn text-primary transition-colors hover:bg-white/[0.06] md:hidden"
          aria-expanded={open}
          aria-controls="marketing-mobile-menu"
          aria-label={open ? t("nav.closeMenu") : t("nav.openMenu")}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
        </button>
      </nav>

      {open ? (
        <div id="marketing-mobile-menu" className="border-t border-border bg-sidebar px-5 pb-5 pt-3 md:hidden">
          <div className="mx-auto flex max-w-[1400px] flex-col">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="flex min-h-11 items-center border-b border-white/[0.06] font-body text-body-md text-secondary"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Link
                href="/login"
                className="inline-flex min-h-11 items-center justify-center rounded-btn border border-white/15 font-body text-body-sm font-semibold text-primary"
                onClick={() => setOpen(false)}
              >
                {t("actions.login")}
              </Link>
              <Link
                href={registrationOpen ? "/register" : "/login"}
                className="inline-flex min-h-11 items-center justify-center rounded-btn bg-brand-gold px-3 font-body text-body-sm font-semibold text-brand-bg"
                onClick={() => setOpen(false)}
              >
                {registrationOpen ? t("actions.register") : t("actions.login")}
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
