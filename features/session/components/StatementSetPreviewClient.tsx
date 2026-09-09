"use client";

import { useState } from "react";
import { FeedbackPanel } from "@/features/session/components/FeedbackPanel";
import { SessionQuestionOptions } from "@/features/session/components/SessionQuestionOptions";
import { TEST_STATEMENT_SET_QUESTION } from "@/features/session/fixtures/statementSetPreview";

const SESSION_ID = "ufo-test-statement-set-preview";

export function StatementSetPreviewClient() {
  const [selected, setSelected] = useState<"a" | "b">("a");
  const question = TEST_STATEMENT_SET_QUESTION;
  const isCorrect = selected === question.correctOptionId;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <p className="font-body text-body-xs font-semibold text-brand-gold">
        Przykład testowy — nie jest to pytanie podręcznikowe
      </p>
      <h1 className="mt-2 font-heading text-heading-md text-primary">
        UFO zestawieniowe
      </h1>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setSelected("a")}
          className="min-h-11 rounded-btn border border-border px-3 font-body text-body-sm text-primary hover:border-brand-gold/40"
        >
          Pokaż błąd (zestaw 1, 2, 3)
        </button>
        <button
          type="button"
          onClick={() => setSelected("b")}
          className="min-h-11 rounded-btn border border-border px-3 font-body text-body-sm text-primary hover:border-brand-gold/40"
        >
          Pokaż poprawną (zestaw 1, 3, 5)
        </button>
      </div>

      <p className="mt-6 whitespace-pre-wrap font-body text-body-lg text-primary">
        {question.text}
      </p>
      <div className="mt-4">
        <SessionQuestionOptions
          sessionId={SESSION_ID}
          q={question}
          selectedOptionId={selected}
          isShowingFeedback
          optionsLocked
          onSelectOption={() => undefined}
        />
      </div>
      <FeedbackPanel
        sessionId={SESSION_ID}
        question={question}
        selectedOptionId={selected}
        isCorrect={isCorrect}
        variant="standard"
      />
    </div>
  );
}
