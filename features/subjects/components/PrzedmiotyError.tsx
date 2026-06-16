import { getTranslations } from "next-intl/server";

type PrzedmiotyErrorProps = {
  message: string;
};

export async function PrzedmiotyError({ message }: PrzedmiotyErrorProps) {
  const t = await getTranslations("subjects");

  return (
    <div
      className="rounded-card border border-[rgba(248,113,113,0.35)] bg-card p-6"
      role="alert"
    >
      <p className="font-heading text-heading-sm text-primary">{t("loadFailedTitle")}</p>
      <p className="mt-2 font-body text-body-md text-secondary">{message}</p>
    </div>
  );
}
