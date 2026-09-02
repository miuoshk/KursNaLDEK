"use client";

import { Rycina } from "@/features/shared/components/Rycina";
import { RycinaEmblem } from "@/features/shared/components/RycinaEmblem";
import { subjectRycina } from "@/features/shared/lib/rycinaCatalog";

export function SubjectPageHeader({
  subjectId,
  name,
}: {
  subjectId: string;
  name: string;
}) {
  const art = subjectRycina(subjectId);
  const isLdew = subjectId.startsWith("ldew-");

  return (
    <div className="relative">
      {art?.plate ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-6 h-40 overflow-hidden"
        >
          <Rycina
            id={art.plate}
            mask="fade-y"
            className="right-0 top-0 h-full w-[min(420px,70%)] opacity-[0.14]"
          />
        </div>
      ) : null}
      <div className="relative flex items-center gap-3">
        {art?.emblem && !art.plate && !isLdew ? (
          <RycinaEmblem id={art.emblem} size={40} className="text-brand-sage" />
        ) : null}
        <h1 className="font-heading text-2xl font-bold text-primary md:text-3xl">
          {name}
        </h1>
      </div>
    </div>
  );
}
