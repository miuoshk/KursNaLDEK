import Link from "next/link";
import { OsceBreadcrumbSetter } from "@/features/osce/components/OsceBreadcrumbSetter";

export default function OsceSymulacjaPlaceholderPage() {
  return (
    <div>
      <OsceBreadcrumbSetter second="Kurs na OSCE" third="Symulacja" />
      <h1 className="font-heading text-heading-xl text-primary">Symulacja OSCE</h1>
      <p className="mt-4 font-body text-body-md text-secondary">
        Tryb symulacji egzaminu OSCE będzie dostępny wkrótce.
      </p>
      <Link
        href="/osce"
        className="mt-8 inline-block font-body text-body-sm text-brand-sage transition-colors hover:text-brand-gold"
      >
        Wróć do listy stacji
      </Link>
    </div>
  );
}
