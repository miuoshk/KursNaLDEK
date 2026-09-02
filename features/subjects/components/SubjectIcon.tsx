"use client";

import { cn } from "@/lib/utils";
import { getSubjectIconComponent } from "@/features/subjects/subjectIconMap";
import { RycinaEmblem } from "@/features/shared/components/RycinaEmblem";
import { subjectRycina } from "@/features/shared/lib/rycinaCatalog";

type SubjectIconProps = {
  iconName: string;
  subjectId?: string;
  className?: string;
  /** KNNP atlas marks render at 40 px; Tabler fallback stays 20 px. */
  size?: number;
};

export function SubjectIcon({
  iconName,
  subjectId,
  className,
  size,
}: SubjectIconProps) {
  const art = subjectId ? subjectRycina(subjectId) : undefined;
  const isLdew = Boolean(subjectId?.startsWith("ldew-"));
  /** Corner 40 px marks look jammed; use them only when there is no card plate. */
  const emblem = art?.emblem && !art.plate ? art.emblem : undefined;

  if (emblem && !isLdew) {
    const markSize = size ?? 40;
    return (
      <RycinaEmblem
        id={emblem}
        size={markSize}
        className={cn("text-current", className)}
      />
    );
  }

  const Icon = getSubjectIconComponent(iconName, subjectId);
  return (
    <Icon
      size={size ?? 20}
      stroke={1.75}
      className={cn("shrink-0", className)}
      aria-hidden
    />
  );
}
