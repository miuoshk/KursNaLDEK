import Link from "next/link";

type SessionCompletionScreenProps = {
  subjectId: string;
};

export function SessionCompletionScreen({ subjectId }: SessionCompletionScreenProps) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
      <p className="font-heading text-heading-md text-primary">Sesja zakończona</p>
      <p className="mt-2 font-body text-body-md text-secondary">
        Świetna robota! Możesz wrócić do przedmiotu.
      </p>
      <Link
        href={`/przedmioty/${subjectId}`}
        className="mt-6 rounded-btn bg-brand-gold px-6 py-3 font-body font-semibold text-brand-bg transition duration-200 hover:brightness-110"
      >
        Wróć do przedmiotu
      </Link>
    </div>
  );
}
