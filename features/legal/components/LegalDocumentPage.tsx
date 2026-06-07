import Link from "next/link";

type Props = {
  title: string;
  pdfPath: string;
};

export function LegalDocumentPage({ title, pdfPath }: Props) {
  return (
    <div className="mx-auto flex min-h-screen max-w-4xl flex-col px-4 py-10 md:px-6">
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/login"
            className="font-body text-body-xs text-muted transition hover:text-secondary"
          >
            ← Wróć
          </Link>
          <h1 className="mt-2 font-heading text-2xl font-bold text-primary md:text-3xl">
            {title}
          </h1>
        </div>
        <a
          href={pdfPath}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-fit rounded-btn border border-white/15 bg-white/5 px-4 py-2 font-body text-body-sm text-primary transition hover:bg-white/10"
        >
          Otwórz PDF w nowej karcie
        </a>
      </header>

      <iframe
        src={pdfPath}
        title={title}
        className="min-h-[70vh] w-full flex-1 rounded-card border border-white/10 bg-white"
      />
    </div>
  );
}
