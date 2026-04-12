'use client'

import { useState, useRef, useEffect } from 'react'
import type { OPGQuestion } from '../../lib/opg/types'

interface Feedback {
  isCorrect: boolean
  isClose: boolean
  correctAnswer: string
  correctedTypo: boolean
}

interface OPGTextInputPanelProps {
  question: OPGQuestion
  onAnswer: (input: string) => void
  feedback: Feedback | null
  attemptsLeft: number
  disabled: boolean
}

export default function OPGTextInputPanel({
  question,
  onAnswer,
  feedback,
  attemptsLeft,
  disabled,
}: OPGTextInputPanelProps) {
  const [inputValue, setInputValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setInputValue('')
  }, [question.id])

  useEffect(() => {
    if (!disabled) inputRef.current?.focus()
  }, [question.id, disabled])

  const isInputLocked =
    disabled ||
    (feedback !== null && !feedback.isClose)

  const heading =
    question.direction === 'number_to_name'
      ? `Struktura nr ${question.targetStructure.structure_number} — wpisz nazwę:`
      : `Wpisz numer struktury: ${question.targetStructure.name_pl}`

  function handleSubmit() {
    const trimmed = inputValue.trim()
    if (!trimmed || isInputLocked) return
    onAnswer(trimmed)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSubmit()
  }

  return (
    <div>
      <p style={{ marginBottom: 16, fontWeight: 600, fontSize: 15 }}>
        {heading}
      </p>

      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={isInputLocked}
        placeholder="Wpisz odpowiedź..."
        style={{
          width: '100%',
          padding: 12,
          borderRadius: 8,
          border: '1px solid rgba(201, 168, 76, 0.3)',
          background: 'rgba(0, 42, 39, 0.3)',
          color: 'inherit',
          fontSize: 14,
          outline: 'none',
          boxSizing: 'border-box',
        }}
      />

      <button
        type="button"
        onClick={handleSubmit}
        disabled={isInputLocked || !inputValue.trim()}
        style={{
          marginTop: 8,
          width: '100%',
          padding: '10px 16px',
          borderRadius: 8,
          border: '1px solid rgba(54, 115, 104, 0.4)',
          background:
            isInputLocked || !inputValue.trim()
              ? 'rgba(54, 115, 104, 0.08)'
              : 'rgba(54, 115, 104, 0.2)',
          color: 'inherit',
          fontSize: 14,
          fontWeight: 600,
          cursor:
            isInputLocked || !inputValue.trim() ? 'default' : 'pointer',
        }}
      >
        Sprawdź
      </button>

      {feedback && (
        <div style={{ marginTop: 12, fontSize: 14, lineHeight: 1.5 }}>
          {feedback.isCorrect && !feedback.correctedTypo && (
            <p style={{ color: '#4ade80' }}>Poprawnie!</p>
          )}

          {feedback.isCorrect && feedback.correctedTypo && (
            <>
              <p style={{ color: '#4ade80' }}>
                Poprawnie! (literówka skorygowana)
              </p>
              <p style={{ color: 'rgba(201, 168, 76, 0.7)', marginTop: 4 }}>
                Prawidłowa nazwa: {feedback.correctAnswer}
              </p>
            </>
          )}

          {feedback.isClose && (
            <p style={{ color: '#C9A84C' }}>
              Blisko! Spróbuj jeszcze raz ({attemptsLeft}{' '}
              {attemptsLeft === 1 ? 'próba' : 'próby'})
            </p>
          )}

          {!feedback.isCorrect && !feedback.isClose && (
            <>
              <p style={{ color: '#f87171' }}>Niepoprawnie.</p>
              <p style={{ color: 'rgba(201, 168, 76, 0.7)', marginTop: 4 }}>
                Prawidłowa odpowiedź: {feedback.correctAnswer}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  )
}
