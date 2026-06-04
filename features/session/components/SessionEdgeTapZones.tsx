"use client";

type SessionEdgeTapZonesProps = {
  active: boolean;
  canPrevious: boolean;
  canNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
};

/**
 * Niewidoczne strefy na skrajach ekranu — tap przechodzi do poprzedniego / następnego pytania.
 */
export function SessionEdgeTapZones({
  active,
  canPrevious,
  canNext,
  onPrevious,
  onNext,
}: SessionEdgeTapZonesProps) {
  if (!active) return null;

  return (
    <>
      <button
        type="button"
        className="fixed left-0 top-0 z-20 h-full w-[min(14vw,72px)] cursor-default border-0 bg-transparent p-0 opacity-0 disabled:pointer-events-none"
        aria-label="Poprzednie pytanie"
        disabled={!canPrevious}
        onClick={onPrevious}
      />
      <button
        type="button"
        className="fixed right-0 top-0 z-20 h-full w-[min(14vw,72px)] cursor-default border-0 bg-transparent p-0 opacity-0 disabled:pointer-events-none"
        aria-label="Następne pytanie"
        disabled={!canNext}
        onClick={onNext}
      />
    </>
  );
}
