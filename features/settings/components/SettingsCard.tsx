type Props = {
  title: string;
  description?: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
};

export function SettingsCard({ title, description, aside, children }: Props) {
  return (
    <section className="rounded-card border border-border bg-card p-6 md:p-7">
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <h2 className="font-heading text-lg font-bold text-primary">{title}</h2>
          {description ? (
            <p className="mt-1 font-body text-body-xs text-muted">{description}</p>
          ) : null}
        </div>
        {aside}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}
