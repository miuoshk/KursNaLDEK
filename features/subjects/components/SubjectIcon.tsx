import { cn } from "@/lib/utils";
import { getSubjectIconComponent } from "@/features/subjects/subjectIconMap";

type SubjectIconProps = {
  iconName: string;
  className?: string;
  /** Zgodnie z design system: 20px na kafelkach przedmiotów. */
  size?: number;
};

export function SubjectIcon({
  iconName,
  className,
  size = 20,
}: SubjectIconProps) {
  const Icon = getSubjectIconComponent(iconName);

  return (
    <Icon
      size={size}
      stroke={1.75}
      className={cn("shrink-0", className)}
      aria-hidden
    />
  );
}
