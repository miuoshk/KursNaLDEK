"use client";

import * as Dialog from "@radix-ui/react-dialog";
import {
  Ban,
  Calendar,
  CheckCircle,
  Clock,
  PenTool,
  RefreshCw,
  Users,
  Video,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type ExamFormatSection = {
  title: string;
  description: string;
  Icon: LucideIcon;
};

const EXAM_FORMAT_SECTIONS: ExamFormatSection[] = [
  {
    title: "Struktura",
    description: "Egzamin trwa 2 dni. 7 stacji, na każdej 2 zadania (14 zadań łącznie).",
    Icon: Calendar,
  },
  {
    title: "Zaliczenie",
    description:
      "Próg zaliczenia: min. 60% z obu zadań łącznie na każdej stacji. Nie ma oceny — tylko zaliczenie / niezaliczenie.",
    Icon: CheckCircle,
  },
  {
    title: "Bez błędu kardynalnego",
    description:
      "Nie ma błędu kardynalnego ani punktu krytycznego. Spadnie narzędzie — podnosisz, egzamin leci dalej.",
    Icon: Ban,
  },
  {
    title: "Forma odpowiedzi",
    description:
      "Nie zdajemy ustnie — tylko pokazujemy lub piszemy. Wyjątek: stacja Komunikacja (odpowiedzi do wyboru).",
    Icon: PenTool,
  },
  {
    title: "Czas",
    description:
      "Na kartce podany konkretny czas na zadanie. Sygnał dźwiękowy — nie można go przekroczyć.",
    Icon: Clock,
  },
  {
    title: "Nagrywanie",
    description: "Całość jest nagrywana. VAR działa na naszą korzyść.",
    Icon: Video,
  },
  {
    title: "Organizacja",
    description:
      "Zdajemy w grupach 8-osobowych. Po kolei 8 osób wchodzi na egzamin, reszta czeka.",
    Icon: Users,
  },
  {
    title: "Poprawy",
    description:
      "Poprawia się tylko niezaliczoną stację, nie cały egzamin. Pierwszy tydzień września.",
    Icon: RefreshCw,
  },
];

export function OSCEExamFormatModal() {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className="rounded-xl border border-[#C9A84C]/30 px-4 py-2.5 font-body text-sm text-[#C9A84C] transition-colors hover:bg-[#C9A84C]/10"
        >
          Format egzaminu
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[90vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[#367368]/30 bg-[#002A27] p-6 shadow-xl focus:outline-none">
          <Dialog.Close
            className="absolute right-4 top-4 rounded-md p-1 text-white/60 transition-colors hover:text-white"
            aria-label="Zamknij"
          >
            <X className="size-4" aria-hidden />
          </Dialog.Close>

          <Dialog.Title className="pr-8 font-heading text-lg text-white">
            Format egzaminu OSCE — WNMZ ŚUM
          </Dialog.Title>

          <div className="mt-5 space-y-3">
            {EXAM_FORMAT_SECTIONS.map(({ title, description, Icon }) => (
              <section key={title} className="flex gap-3 rounded-xl bg-[#367368]/5 p-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#367368]/10 text-[#367368]">
                  <Icon className="size-4" aria-hidden />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-white">{title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-white/60">{description}</p>
                </div>
              </section>
            ))}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
