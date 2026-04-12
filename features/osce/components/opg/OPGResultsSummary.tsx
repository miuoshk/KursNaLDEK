'use client'

import type { OPGAnswer, OPGQuestion } from '../../lib/opg/types'

interface OPGResultsSummaryProps {
  answers: OPGAnswer[]
  questions: OPGQuestion[]
  onRetry: () => void
  onRetryWrong: () => void
  onBack: () => void
}

export default function OPGResultsSummary({
  answers,
  questions,
  onRetry,
  onRetryWrong,
  onBack,
}: OPGResultsSummaryProps) {
  const total = answers.length
  const correct = answers.filter((a) => a.isCorrect).length
  const wrongCount = total - correct
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0

  function getScoreColor() {
    if (pct >= 80) return '#C9A84C'
    if (pct >= 50) return '#ffffff'
    return '#f87171'
  }

  const questionMap = new Map(questions.map((q) => [q.id, q]))

  return (
    <div>
      {/* Hero */}
      <div
        style={{
          textAlign: 'center',
          padding: '32px 0 24px',
        }}
      >
        <p
          style={{
            fontSize: 56,
            fontWeight: 700,
            color: getScoreColor(),
            lineHeight: 1,
            fontFamily: 'DM Serif Display, serif',
          }}
        >
          {pct}%
        </p>
        <p
          style={{
            marginTop: 8,
            fontSize: 15,
            color: 'rgba(255, 255, 255, 0.6)',
          }}
        >
          {correct} z {total} poprawnych
        </p>
      </div>

      {/* Lista pytan */}
      <div style={{ marginBottom: 24 }}>
        {answers.map((answer) => {
          const question = questionMap.get(answer.questionId)
          if (!question) return null

          const { targetStructure } = question

          return (
            <div
              key={answer.questionId}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                padding: '10px 0',
                borderBottom: '1px solid rgba(201, 168, 76, 0.1)',
                fontSize: 14,
              }}
            >
              <span
                style={{
                  color: answer.isCorrect ? '#4ade80' : '#f87171',
                  flexShrink: 0,
                  fontWeight: 600,
                }}
              >
                {answer.isCorrect ? '\u2713' : '\u2717'}
              </span>
              <div>
                <p>
                  Nr {targetStructure.structure_number} —{' '}
                  {targetStructure.name_pl}
                </p>
                {!answer.isCorrect && (
                  <p
                    style={{
                      color: 'rgba(255, 255, 255, 0.4)',
                      marginTop: 2,
                      fontSize: 13,
                    }}
                  >
                    Twoja odpowiedź: {answer.userInput}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Przyciski */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button
          type="button"
          onClick={onRetry}
          style={{
            width: '100%',
            padding: '12px 16px',
            borderRadius: 8,
            border: '1px solid #C9A84C',
            background: 'transparent',
            color: '#C9A84C',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Powtórz quiz
        </button>

        <button
          type="button"
          onClick={onRetryWrong}
          disabled={wrongCount === 0}
          style={{
            width: '100%',
            padding: '12px 16px',
            borderRadius: 8,
            border: '1px solid rgba(54, 115, 104, 0.4)',
            background: wrongCount > 0 ? 'rgba(54, 115, 104, 0.15)' : 'transparent',
            color: wrongCount > 0 ? 'inherit' : 'rgba(255, 255, 255, 0.3)',
            fontSize: 14,
            fontWeight: 600,
            cursor: wrongCount > 0 ? 'pointer' : 'default',
          }}
        >
          Powtórz błędne ({wrongCount})
        </button>

        <button
          type="button"
          onClick={onBack}
          style={{
            width: '100%',
            padding: '12px 16px',
            borderRadius: 8,
            border: 'none',
            background: 'transparent',
            color: 'rgba(255, 255, 255, 0.5)',
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          Wróć do stacji
        </button>
      </div>
    </div>
  )
}
