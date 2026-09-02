import type { ReactNode } from "react";

type AuthFrameProps = {
  title: string;
  children: ReactNode;
};

/** Złoty nagłówek poza kartą — logowanie, rejestracja, reset hasła. */
export function AuthFrame({ title, children }: AuthFrameProps) {
  return (
    <>
      <h1 className="mb-6 text-balance text-center font-heading text-[32px] leading-[1.15] text-brand-gold sm:mb-8 sm:text-[36px]">
        {title}
      </h1>
      <div className="rounded-card border border-border bg-card/90 p-6 shadow-[0_24px_60px_-30px_rgba(0,0,0,0.6)] backdrop-blur-sm sm:p-8">
        {children}
      </div>
    </>
  );
}
