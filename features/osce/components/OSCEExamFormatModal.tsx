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
import { useTranslations } from "next-intl";
import type { LucideIcon } from "lucide-react";

type ExamFormatSection = {
  titleKey:
    | "examFormatStructureTitle"
    | "examFormatPassTitle"
    | "examFormatNoCardinalTitle"
    | "examFormatResponseTitle"
    | "examFormatTimeTitle"
    | "examFormatRecordingTitle"
    | "examFormatOrganizationTitle"
    | "examFormatRetakesTitle";
  descriptionKey:
    | "examFormatStructureDescription"
    | "examFormatPassDescription"
    | "examFormatNoCardinalDescription"
    | "examFormatResponseDescription"
    | "examFormatTimeDescription"
    | "examFormatRecordingDescription"
    | "examFormatOrganizationDescription"
    | "examFormatRetakesDescription";
  Icon: LucideIcon;
};

const EXAM_FORMAT_SECTIONS: ExamFormatSection[] = [
  {
    titleKey: "examFormatStructureTitle",
    descriptionKey: "examFormatStructureDescription",
    Icon: Calendar,
  },
  {
    titleKey: "examFormatPassTitle",
    descriptionKey: "examFormatPassDescription",
    Icon: CheckCircle,
  },
  {
    titleKey: "examFormatNoCardinalTitle",
    descriptionKey: "examFormatNoCardinalDescription",
    Icon: Ban,
  },
  {
    titleKey: "examFormatResponseTitle",
    descriptionKey: "examFormatResponseDescription",
    Icon: PenTool,
  },
  {
    titleKey: "examFormatTimeTitle",
    descriptionKey: "examFormatTimeDescription",
    Icon: Clock,
  },
  {
    titleKey: "examFormatRecordingTitle",
    descriptionKey: "examFormatRecordingDescription",
    Icon: Video,
  },
  {
    titleKey: "examFormatOrganizationTitle",
    descriptionKey: "examFormatOrganizationDescription",
    Icon: Users,
  },
  {
    titleKey: "examFormatRetakesTitle",
    descriptionKey: "examFormatRetakesDescription",
    Icon: RefreshCw,
  },
];

export function OSCEExamFormatModal() {
  const t = useTranslations("osce");
  const tCommon = useTranslations("common");

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className="rounded-xl border border-[#C9A84C]/30 px-4 py-2.5 font-body text-sm text-[#C9A84C] transition-colors hover:bg-[#C9A84C]/10"
        >
          {t("examFormatTrigger")}
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[90vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[#367368]/30 bg-[#002A27] p-6 shadow-xl focus:outline-none">
          <Dialog.Close
            className="absolute right-4 top-4 rounded-md p-1 text-white/60 transition-colors hover:text-white"
            aria-label={tCommon("close")}
          >
            <X className="size-4" aria-hidden />
          </Dialog.Close>

          <Dialog.Title className="pr-8 font-heading text-lg text-white">
            {t("examFormatTitle")}
          </Dialog.Title>

          <div className="mt-5 space-y-3">
            {EXAM_FORMAT_SECTIONS.map(({ titleKey, descriptionKey, Icon }) => (
              <section key={titleKey} className="flex gap-3 rounded-xl bg-[#367368]/5 p-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#367368]/10 text-[#367368]">
                  <Icon className="size-4" aria-hidden />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-white">{t(titleKey)}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-white/60">
                    {t(descriptionKey)}
                  </p>
                </div>
              </section>
            ))}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
