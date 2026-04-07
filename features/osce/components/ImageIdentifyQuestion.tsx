"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, X } from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePinchZoom } from "@/hooks/usePinchZoom";
import { cn } from "@/lib/utils";

export type ImageIdentifyHotspot = {
  id: string;
  x_percent: number;
  y_percent: number;
  radius_percent: number;
  correct_label: string;
  explanation: string;
};

export type ImageIdentifyQuestionData = {
  id: string;
  text: string;
  image_url: string;
  hotspots: ImageIdentifyHotspot[];
  question_type: "image_identify";
  mode: "identify" | "label";
};

export type ImageIdentifyAnswer = { hotspotId: string; userLabel: string };

export type ImageIdentifyQuestionProps = {
  question: ImageIdentifyQuestionData;
  onAnswer: (questionId: string, answers: ImageIdentifyAnswer[], score: number) => void;
  /** Po sprawdzeniu — przejście dalej w sesji. */
  onNext?: () => void;
};

function hotspotContainsPercent(
  px: number,
  py: number,
  h: ImageIdentifyHotspot,
): boolean {
  const dx = px - h.x_percent;
  const dy = py - h.y_percent;
  const r = h.radius_percent;
  return Math.hypot(dx, dy) <= r;
}

function computeScore(
  results: { hotspotId: string; correct: boolean }[],
): number {
  if (results.length === 0) return 0;
  const ok = results.filter((r) => r.correct).length;
  return ok / results.length;
}

export function ImageIdentifyQuestion({
  question,
  onAnswer,
  onNext,
}: ImageIdentifyQuestionProps) {
  const formId = useId();
  const { containerRef, contentRef, contentStyle, resetView } = usePinchZoom({
    minScale: 1,
    maxScale: 4,
    doubleTapScale: 2,
    doubleTapDelayMs: 380,
  });

  const imageWrapperRef = useRef<HTMLDivElement>(null);
  const [wrapperSize, setWrapperSize] = useState({ w: 0, h: 0 });

  const hotspots = question.hotspots;
  const sortedHotspots = useMemo(
    () => [...hotspots].sort((a, b) => a.id.localeCompare(b.id)),
    [hotspots],
  );

  const labelOptions = useMemo(() => {
    const u = [...new Set(hotspots.map((h) => h.correct_label))];
    u.sort((a, b) => a.localeCompare(b, "pl"));
    return u;
  }, [hotspots]);

  const [identifySelections, setIdentifySelections] = useState<Record<string, string>>(
    () => Object.fromEntries(hotspots.map((h) => [h.id, ""])),
  );

  const [labelStep, setLabelStep] = useState(0);
  const [labelOutcome, setLabelOutcome] = useState<Record<string, boolean>>({});

  const [checked, setChecked] = useState(false);
  const submitLockRef = useRef(false);

  /* eslint-disable react-hooks/set-state-in-effect -- reset stanu przy zmianie pytania */
  useEffect(() => {
    setIdentifySelections(Object.fromEntries(hotspots.map((h) => [h.id, ""])));
    setLabelStep(0);
    setLabelOutcome({});
    setChecked(false);
    submitLockRef.current = false;
    resetView();
  }, [question.id, hotspots, resetView]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    const el = imageWrapperRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver((entries) => {
      const cr = entries[0]?.contentRect;
      if (cr) setWrapperSize({ w: cr.width, h: cr.height });
    });
    ro.observe(el);
    setWrapperSize({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, [question.id, question.image_url]);

  const handleIdentifyChange = useCallback((hotspotId: string, value: string) => {
    setIdentifySelections((prev) => ({ ...prev, [hotspotId]: value }));
  }, []);

  const runCheckIdentify = useCallback(() => {
    const answers: ImageIdentifyAnswer[] = sortedHotspots.map((h) => ({
      hotspotId: h.id,
      userLabel: identifySelections[h.id]?.trim() ?? "",
    }));
    const details = sortedHotspots.map((h) => ({
      hotspotId: h.id,
      correct: identifySelections[h.id]?.trim() === h.correct_label,
    }));
    const score = computeScore(details);
    setChecked(true);
    onAnswer(question.id, answers, score);
  }, [identifySelections, onAnswer, question.id, sortedHotspots]);

  const runCheckLabel = useCallback(() => {
    const answers: ImageIdentifyAnswer[] = sortedHotspots.map((h) => ({
      hotspotId: h.id,
      userLabel: labelOutcome[h.id] ? h.correct_label : "",
    }));
    const details = sortedHotspots.map((h) => ({
      hotspotId: h.id,
      correct: Boolean(labelOutcome[h.id]),
    }));
    const score = computeScore(details);
    setChecked(true);
    onAnswer(question.id, answers, score);
  }, [labelOutcome, onAnswer, question.id, sortedHotspots]);

  const onImagePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (question.mode !== "label" || checked) return;
      if (labelStep >= sortedHotspots.length) return;
      const rect = imageWrapperRef.current?.getBoundingClientRect();
      if (!rect?.width) return;

      const px = ((e.clientX - rect.left) / rect.width) * 100;
      const py = ((e.clientY - rect.top) / rect.height) * 100;

      const target = sortedHotspots[labelStep];
      const hit = hotspotContainsPercent(px, py, target);

      setLabelOutcome((prev) => ({ ...prev, [target.id]: hit }));
      setLabelStep((s) => s + 1);
    },
    [checked, labelStep, question.mode, sortedHotspots],
  );

  const labelComplete =
    question.mode === "label" && labelStep >= sortedHotspots.length && sortedHotspots.length > 0;

  const handleSubmit = () => {
    if (checked || submitLockRef.current) return;
    submitLockRef.current = true;
    if (question.mode === "identify") runCheckIdentify();
    else runCheckLabel();
  };

  const isCorrectAt = (hid: string) => {
    const h = hotspots.find((x) => x.id === hid);
    if (!h) return false;
    if (question.mode === "identify") {
      return identifySelections[hid]?.trim() === h.correct_label;
    }
    return Boolean(labelOutcome[hid]);
  };

  return (
    <div className="mx-auto w-full max-w-3xl bg-brand-bg">
      <p className="font-body text-body-lg leading-relaxed text-primary">{question.text}</p>

      {question.mode === "label" && !checked ? (
        <p className="mt-2 font-body text-body-sm text-secondary">
          Kolejno wskaż na obrazie:{" "}
          <span className="font-medium text-brand-gold">
            punkt {Math.min(labelStep + 1, sortedHotspots.length)} / {sortedHotspots.length}
          </span>
        </p>
      ) : null}

      <div
        ref={containerRef}
        className="relative mt-6 max-h-[75vh] w-full overflow-hidden rounded-card border border-white/[0.08] bg-brand-card-1 touch-none select-none"
        style={{ touchAction: "none" }}
      >
        <div
          ref={contentRef}
          style={contentStyle}
          className="flex min-h-[200px] w-full items-center justify-center p-2"
        >
          <div ref={imageWrapperRef} className="relative inline-block max-w-full">
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element -- zewnętrzne URL (OPG) */}
              <img
                src={question.image_url}
                alt=""
                className="pointer-events-none block max-h-[70vh] w-auto max-w-full object-contain"
                draggable={false}
              />

              <div
                className={cn(
                  "absolute inset-0",
                  question.mode === "label" && !checked ? "cursor-crosshair" : "pointer-events-none",
                )}
                onPointerDown={onImagePointerDown}
                role="presentation"
              />

              {sortedHotspots.map((h, i) => {
                const showNum = true;
                const correct = checked ? isCorrectAt(h.id) : null;
                const dimPct = Math.min(100, h.radius_percent * 2);
                const minPx = 44;
                const sizeStyle =
                  wrapperSize.w > 0
                    ? {
                        width: `${Math.max(minPx, (dimPct / 100) * wrapperSize.w)}px`,
                        height: `${Math.max(minPx, (dimPct / 100) * wrapperSize.w)}px`,
                      }
                    : {
                        width: `max(44px, ${dimPct}%)`,
                        height: `max(44px, ${dimPct}%)`,
                      };

                return (
                  <div
                    key={h.id}
                    className="pointer-events-none absolute flex items-center justify-center"
                    style={{
                      left: `${h.x_percent}%`,
                      top: `${h.y_percent}%`,
                      transform: "translate(-50%, -50%)",
                      ...sizeStyle,
                    }}
                  >
                    <div
                      className={cn(
                        "flex size-full items-center justify-center rounded-full border-2 border-dashed border-brand-gold/70 bg-brand-gold/10",
                        "animate-pulse shadow-[0_0_0_4px_rgba(201,168,76,0.12)]",
                        checked &&
                          correct === true &&
                          "border-success bg-success/15 shadow-[0_0_0_4px_rgba(74,222,128,0.2)]",
                        checked &&
                          correct === false &&
                          "border-error bg-error/15 shadow-[0_0_0_4px_rgba(248,113,113,0.2)]",
                      )}
                    >
                      {showNum ? (
                        <span className="font-mono text-sm font-semibold tabular-nums text-brand-gold">
                          {i + 1}
                        </span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <p className="mt-2 font-body text-body-xs text-muted">
        Szczypanie: powiększenie. Podwójne tapnięcie: zoom / reset. Przeciąganie przy powiększeniu.
      </p>

      {question.mode === "identify" ? (
        <div className="mt-8 space-y-4">
          {sortedHotspots.map((h, i) => (
            <div
              key={h.id}
              className="flex flex-col gap-2 rounded-card border border-[color:var(--border-subtle)] bg-brand-card-1 p-4 sm:flex-row sm:items-center sm:gap-6"
            >
              <span className="shrink-0 font-mono text-body-sm text-brand-gold">
                {i + 1}.
              </span>
              <label htmlFor={`${formId}-sel-${h.id}`} className="sr-only">
                Wybór dla punktu {i + 1}
              </label>
              <select
                id={`${formId}-sel-${h.id}`}
                disabled={checked}
                value={identifySelections[h.id] ?? ""}
                onChange={(e) => handleIdentifyChange(h.id, e.target.value)}
                className={cn(
                  "w-full rounded-btn border border-brand-sage/40 bg-brand-bg px-3 py-2.5 font-body text-body-md text-primary",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-gold",
                  checked &&
                    identifySelections[h.id]?.trim() === h.correct_label &&
                    "border-success",
                  checked &&
                    identifySelections[h.id]?.trim() !== h.correct_label &&
                    "border-error",
                )}
              >
                <option value="">Wybierz nazwę…</option>
                {labelOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              {checked ? (
                identifySelections[h.id]?.trim() === h.correct_label ? (
                  <Check className="size-5 shrink-0 text-success" aria-label="Dobrze" />
                ) : (
                  <X className="size-5 shrink-0 text-error" aria-label="Źle" />
                )
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-6 font-body text-body-sm text-secondary">
          {labelComplete && !checked ? (
            <p className="text-brand-gold">Wszystkie punkty wskazane. Sprawdź odpowiedzi.</p>
          ) : null}
        </div>
      )}

      {!checked ? (
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={question.mode === "identify" ? false : !labelComplete}
            className={cn(
              "rounded-btn px-8 py-3 font-body text-body-md font-semibold transition duration-200 ease-out",
              question.mode === "label" && !labelComplete
                ? "cursor-not-allowed bg-white/10 text-muted"
                : "bg-brand-gold text-brand-bg hover:brightness-110",
            )}
          >
            Sprawdź
          </button>
          <button
            type="button"
            onClick={resetView}
            className="rounded-btn border border-brand-sage/40 px-4 py-2 font-body text-body-sm text-brand-sage transition hover:bg-brand-sage/10"
          >
            Reset widoku
          </button>
        </div>
      ) : null}

      <AnimatePresence>
        {checked ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 space-y-4"
          >
            <p className="font-heading text-heading-sm text-brand-gold">Wyjaśnienia</p>
            {sortedHotspots.map((h) => (
              <div
                key={`exp-${h.id}`}
                className="rounded-card border border-white/[0.08] bg-brand-card-1 p-4"
              >
                <p className="font-body text-body-xs text-muted">Punkt {h.correct_label}</p>
                <p className="mt-1 whitespace-pre-wrap font-body text-body-sm text-secondary">
                  {h.explanation}
                </p>
              </div>
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>

      {checked && onNext ? (
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={onNext}
            className="rounded-btn bg-brand-gold px-8 py-3 font-body text-body-md font-semibold text-brand-bg transition duration-200 ease-out hover:brightness-110"
          >
            Następne pytanie
          </button>
        </div>
      ) : null}
    </div>
  );
}
