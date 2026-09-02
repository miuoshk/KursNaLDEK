"use client";

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
