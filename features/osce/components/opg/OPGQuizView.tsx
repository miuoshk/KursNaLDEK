'use client'

import { useEffect } from 'react'
import type { OPGAtlas, OPGStructure, OPGQuizConfig } from '../../lib/opg/types'
import { useOPGQuiz } from './useOPGQuiz'
import OPGImage from './OPGImage'
import OPGMcqPanel from './OPGMcqPanel'
import OPGTextInputPanel from './OPGTextInputPanel'
import OPGQuizProgress from './OPGQuizProgress'
import OPGResultsSummary from './OPGResultsSummary'

interface OPGQuizViewProps {
  atlas: OPGAtlas
  structures: OPGStructure[]
  initialConfig: OPGQuizConfig
  onBack: () => void
}

export default function OPGQuizView({
  atlas,
  structures,
  initialConfig,
  onBack,
}: OPGQuizViewProps) {
  const quiz = useOPGQuiz()
  const currentQuestion = quiz.getCurrentQuestion()

  useEffect(() => {
    quiz.initQuiz(initialConfig, structures)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (
      quiz.phase !== 'feedback' ||
      !quiz.lastFeedback ||
      quiz.lastFeedback.isClose
    )
      return

    const timer = setTimeout(() => {
      quiz.nextQuestion()
    }, 2000)

    return () => clearTimeout(timer)
  }, [quiz.phase, quiz.lastFeedback, quiz.nextQuestion])

  if (quiz.phase === 'summary') {
    return (
      <OPGResultsSummary
        answers={quiz.answers}
        questions={quiz.questions}
        onRetry={() => quiz.initQuiz(initialConfig, structures)}
        onRetryWrong={() => {
          const wrongIds = new Set(
            quiz.answers
              .filter((a) => !a.isCorrect)
              .map((a) => a.questionId),
          )
          const wrongStructures = quiz.questions
            .filter((q) => wrongIds.has(q.id))
            .map((q) => q.targetStructure)

          if (wrongStructures.length > 0) {
            quiz.initQuiz(
              { ...initialConfig, count: wrongStructures.length },
              wrongStructures,
            )
          }
        }}
        onBack={onBack}
      />
    )
  }

  if (!currentQuestion) return null

  const showNumbers = currentQuestion.direction === 'number_to_name'
  const isFeedbackFinal =
    quiz.phase === 'feedback' && !quiz.lastFeedback?.isClose

  return (
    <div>
      <OPGQuizProgress
        currentIndex={quiz.currentIndex}
        totalQuestions={quiz.questions.length}
        correctCount={quiz.getCorrectCount()}
      />

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
        }}
        className="md:flex-row"
      >
        <div style={{ flex: 3, minWidth: 0 }}>
          <OPGImage
            imageUrl={atlas.image_url}
            structures={structures}
            activeStructureNumber={
              currentQuestion.targetStructure.structure_number
            }
            showNumbers={showNumbers}
          />
        </div>

        <div style={{ flex: 2, minWidth: 0 }}>
          {currentQuestion.mode === 'mcq' ? (
            <OPGMcqPanel
              question={currentQuestion}
              onAnswer={quiz.submitMcqAnswer}
              feedback={
                quiz.phase === 'feedback' && quiz.lastFeedback
                  ? {
                      isCorrect: quiz.lastFeedback.isCorrect,
                      correctAnswer: quiz.lastFeedback.correctAnswer,
                    }
                  : null
              }
              disabled={quiz.phase === 'feedback'}
            />
          ) : (
            <OPGTextInputPanel
              question={currentQuestion}
              onAnswer={quiz.submitTextAnswer}
              feedback={quiz.lastFeedback}
              attemptsLeft={quiz.attemptsLeft}
              disabled={isFeedbackFinal}
            />
          )}

          {isFeedbackFinal && (
            <button
              type="button"
              onClick={quiz.nextQuestion}
              style={{
                marginTop: 16,
                width: '100%',
                padding: '12px 16px',
                borderRadius: 8,
                border: '1px solid #C9A84C',
                background: 'rgba(201, 168, 76, 0.1)',
                color: '#C9A84C',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Dalej &rarr;
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
