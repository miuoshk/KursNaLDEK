import {
  CONTACT_EMAIL,
  PRODUCT_HREF,
  studioCopy as copy,
} from "@/features/studio/copy";

export function StudioHome() {
  return (
    <div className="studio-shell">
      <div className="studio-orb" aria-hidden="true">
        <div className="studio-orb-indigo" />
        <div className="studio-orb-prussian" />
        <div className="studio-orb-gold" />
      </div>

      <div className="relative z-10">
        <header>
          <div className="mx-auto flex h-16 max-w-[1180px] items-center justify-between px-6 sm:h-20 sm:px-10">
            <a href="/" className="flex items-center gap-2.5" aria-label="Zenit Labs">
              <img src="/studio/mark.svg" alt="" className="size-5" />
              <span className="font-body text-[0.95rem] font-medium tracking-[-0.02em] text-[#F3EFE3]">
                Zenit Labs
              </span>
            </a>
            <nav className="flex items-center gap-7">
              <a
                href="#studio"
                className="font-body text-[0.8rem] text-[#8F93C5] transition-colors duration-200 ease-out hover:text-[#F3EFE3]"
              >
                {copy.nav.studio}
              </a>
              <a
                href="#praca"
                className="font-body text-[0.8rem] text-[#8F93C5] transition-colors duration-200 ease-out hover:text-[#F3EFE3]"
              >
                {copy.nav.work}
              </a>
              <a
                href="#kontakt"
                className="font-body text-[0.8rem] text-[#8F93C5] transition-colors duration-200 ease-out hover:text-[#F3EFE3]"
              >
                {copy.nav.contact}
              </a>
            </nav>
          </div>
        </header>

        <main>
          <section className="flex min-h-[calc(100dvh-5rem)] items-center">
            <div className="studio-rise mx-auto w-full max-w-[1180px] px-6 pb-24 pt-10 sm:px-10 sm:pb-28">
              <p className="font-body text-[0.8rem] text-[#CBAE5D]">{copy.hero.award}</p>
              <h1 className="mt-8 font-body text-[clamp(2rem,5.4vw,4.7rem)] font-light leading-[1.05] tracking-[-0.042em] text-[#F3EFE3] sm:mt-10">
                <span className="block">{copy.hero.h1[0]}</span>
                <span className="block">{copy.hero.h1[1]}</span>
              </h1>
              <p className="mt-10 max-w-[38rem] font-body text-[1.05rem] leading-[1.75] text-[#8F93C5] sm:text-[1.12rem]">
                {copy.hero.lead}
              </p>
              <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3">
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="font-body text-[0.95rem] text-[#CBAE5D] transition-colors duration-200 ease-out hover:text-[#F3EFE3]"
                >
                  {copy.hero.ctaPrimary}
                </a>
                <a
                  href="#praca"
                  className="font-body text-[0.95rem] text-[#8F93C5] transition-colors duration-200 ease-out hover:text-[#F3EFE3]"
                >
                  {copy.hero.ctaSecondary}
                </a>
              </div>
            </div>
          </section>

          <section id="studio" className="scroll-mt-20">
            <div className="mx-auto max-w-[1180px] px-6 py-24 sm:px-10 sm:py-32">
              <p className="font-body text-[0.8rem] text-[#8F93C5]">{copy.purpose.label}</p>
              <h2 className="mt-6 max-w-[20ch] font-body text-[clamp(1.85rem,4vw,3.15rem)] font-light leading-[1.12] tracking-[-0.035em] text-[#F3EFE3]">
                {copy.purpose.h2}
              </h2>
              <div className="mt-10 max-w-[40rem] space-y-5">
                {copy.purpose.paragraphs.map((paragraph) => (
                  <p key={paragraph} className="font-body text-[1.05rem] leading-[1.75] text-[#8F93C5]">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          </section>

          <section className="bg-[#131B2E]">
            <div className="mx-auto max-w-[1180px] px-6 py-24 sm:px-10 sm:py-32">
              <h2 className="max-w-[18ch] font-body text-[clamp(1.85rem,3.6vw,2.85rem)] font-light leading-[1.12] tracking-[-0.035em] text-[#F3EFE3]">
                {copy.focus.h2}
              </h2>
              <div className="mt-14 grid gap-12 md:grid-cols-3 md:gap-10">
                {copy.focus.items.map((item) => (
                  <div key={item.title}>
                    <h3 className="font-body text-[1.15rem] font-medium tracking-[-0.02em] text-[#F3EFE3]">
                      {item.title}
                    </h3>
                    <p className="mt-4 font-body text-[0.98rem] leading-[1.7] text-[#8F93C5]">
                      {item.body}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="scroll-mt-20">
            <div className="mx-auto max-w-[1180px] px-6 py-24 sm:px-10 sm:py-32">
              <p className="font-body text-[0.8rem] text-[#8F93C5]">{copy.audience.label}</p>
              <h2 className="mt-6 font-body text-[clamp(1.85rem,3.6vw,2.85rem)] font-light tracking-[-0.035em] text-[#F3EFE3]">
                {copy.audience.h2}
              </h2>
              <div className="mt-14 grid gap-12 md:grid-cols-3 md:gap-10">
                {copy.audience.items.map((item) => (
                  <div key={item.title}>
                    <h3 className="font-body text-[1.15rem] font-medium tracking-[-0.02em] text-[#F3EFE3]">
                      {item.title}
                    </h3>
                    <p className="mt-4 font-body text-[0.98rem] leading-[1.7] text-[#8F93C5]">
                      {item.body}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section id="praca" className="scroll-mt-20 bg-[#131B2E]">
            <div className="mx-auto max-w-[1180px] px-6 py-24 sm:px-10 sm:py-32">
              <p className="font-body text-[0.8rem] text-[#8F93C5]">{copy.work.label}</p>
              <h2 className="mt-6 font-body text-[clamp(2rem,4.2vw,3.5rem)] font-light tracking-[-0.038em] text-[#F3EFE3]">
                {copy.work.h2}
              </h2>
              <p className="mt-8 max-w-[40rem] font-body text-[1.05rem] leading-[1.75] text-[#8F93C5]">
                {copy.work.intro}
              </p>
              <div className="mt-14 grid gap-12 md:grid-cols-3 md:gap-10">
                {copy.work.details.map((item) => (
                  <div key={item.title}>
                    <h3 className="font-body text-[1.15rem] font-medium tracking-[-0.02em] text-[#F3EFE3]">
                      {item.title}
                    </h3>
                    <p className="mt-4 font-body text-[0.98rem] leading-[1.7] text-[#8F93C5]">
                      {item.body}
                    </p>
                  </div>
                ))}
              </div>
              <a
                href={PRODUCT_HREF}
                className="mt-14 inline-block font-body text-[0.95rem] text-[#CBAE5D] transition-colors duration-200 ease-out hover:text-[#F3EFE3]"
              >
                {copy.work.link}
              </a>
            </div>
          </section>

          <section>
            <div className="mx-auto grid max-w-[1180px] gap-10 px-6 py-24 sm:px-10 sm:py-32 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-end">
              <div>
                <p className="font-body text-[0.8rem] text-[#8F93C5]">{copy.award.label}</p>
                <h2 className="mt-6 font-body text-[clamp(2rem,4vw,3.3rem)] font-light leading-[1.12] tracking-[-0.038em] text-[#CBAE5D]">
                  {copy.award.h2[0]}
                  <br />
                  {copy.award.h2[1]}
                  <br />
                  {copy.award.h2[2]}
                </h2>
              </div>
              <div className="max-w-[28rem] space-y-5">
                {copy.award.paragraphs.map((paragraph) => (
                  <p key={paragraph} className="font-body text-[1.05rem] leading-[1.75] text-[#8F93C5]">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          </section>

          <section className="bg-[#131B2E]">
            <div className="mx-auto max-w-[1180px] px-6 py-24 sm:px-10 sm:py-32">
              <p className="font-body text-[0.8rem] text-[#8F93C5]">{copy.craft.label}</p>
              <h2 className="mt-6 max-w-[18ch] font-body text-[clamp(1.85rem,3.8vw,3rem)] font-light leading-[1.12] tracking-[-0.035em] text-[#F3EFE3]">
                {copy.craft.h2}
              </h2>
              <div className="mt-10 max-w-[40rem] space-y-5">
                {copy.craft.paragraphs.map((paragraph) => (
                  <p key={paragraph} className="font-body text-[1.05rem] leading-[1.75] text-[#8F93C5]">
                    {paragraph}
                  </p>
                ))}
              </div>
              <p className="mt-10 max-w-[40rem] font-body text-[0.78rem] leading-6 text-[#6A73A8]">
                {copy.craft.stack}
              </p>
            </div>
          </section>

          <section id="kontakt" className="scroll-mt-20">
            <div className="mx-auto max-w-[1180px] px-6 py-24 sm:px-10 sm:py-32">
              <h2 className="font-body text-[0.8rem] font-normal text-[#8F93C5]">
                {copy.contact.h2}
              </h2>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="mt-6 inline-block font-body text-[clamp(1.5rem,3vw,2.2rem)] font-light tracking-[-0.03em] text-[#CBAE5D] transition-colors duration-200 ease-out hover:text-[#F3EFE3]"
              >
                {CONTACT_EMAIL}
              </a>
              <p className="mt-5 max-w-md font-body text-[1rem] leading-[1.7] text-[#8F93C5]">
                {copy.contact.body}
              </p>
            </div>
          </section>
        </main>

        <footer>
          <div className="mx-auto flex max-w-[1180px] items-center justify-between px-6 py-8 sm:px-10">
            <p className="font-body text-[0.72rem] text-[#364E85]">© 2026 Zenit Labs</p>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="font-body text-[0.72rem] text-[#364E85] transition-colors duration-200 ease-out hover:text-[#CBAE5D]"
            >
              {CONTACT_EMAIL}
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}
