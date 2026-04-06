type PrzedmiotyErrorProps = {
  message: string;
};

export function PrzedmiotyError({ message }: PrzedmiotyErrorProps) {
  return (
    <div
      className="rounded-card border border-[rgba(248,113,113,0.35)] bg-brand-card-1 p-6"
      role="alert"
    >
      <p className="font-heading text-heading-sm text-primary">Nie udało się załadować danych</p>
      <p className="mt-2 font-body text-body-md text-secondary">{message}</p>
    </div>
  );
}
