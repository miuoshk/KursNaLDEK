'use client'

import { useState, useCallback } from 'react'
import type {
  OPGQuizConfig,
  OPGQuestion,
  OPGStructure,
  OPGAnswer,
} from '../../lib/opg/types'
import { fuzzyMatchStructure } from '../../lib/opg/fuzzyMatch'
import type { FuzzyMatchResult } from '../../lib/opg/fuzzyMatch'
import { generateOPGQuestions } from '../../lib/opg/generateQuestions'

type Phase = 'question' | 'feedback' | 'summary'

interface Feedback {
  isCorrect: boolean
  isClose: boolean
  correctAnswer: string
  correctedTypo: boolean
}

const INITIAL_ATTEMPTS = 2

export function useOPGQuiz() {
  const [questions, setQuestions] = useState<OPGQuestion[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<OPGAnswer[]>([])
  const [phase, setPhase] = useState<Phase>('question')
  const [attemptsLeft, setAttemptsLeft] = useState(INITIAL_ATTEMPTS)
  const [questionStartTime, setQuestionStartTime] = useState(Date.now())
  const [lastFeedback, setLastFeedback] = useState<Feedback | null>(null)
  const [config, setConfig] = useState<OPGQuizConfig | null>(null)
  const [attemptCount, setAttemptCount] = useState(0)

  const getCurrentQuestion = useCallback(
    (): OPGQuestion | null => questions[currentIndex] ?? null,
    [questions, currentIndex],
  )

  const getCorrectCount = useCallback(
    () => answers.filter((a) => a.isCorrect).length,
    [answers],
  )

  const initQuiz = useCallback(
    (newConfig: OPGQuizConfig, structures: OPGStructure[]) => {
      const generated = generateOPGQuestions(newConfig, structures)
      setQuestions(generated)
      setConfig(newConfig)
      setCurrentIndex(0)
      setAnswers([])
      setPhase('question')
      setAttemptsLeft(INITIAL_ATTEMPTS)
      setQuestionStartTime(Date.now())
      setLastFeedback(null)
      setAttemptCount(0)
    },
    [],
  )

  const recordAnswer = useCallback(
    (question: OPGQuestion, isCorrect: boolean, isClose: boolean, userInput: string, attempts: number) => {
      const answer: OPGAnswer = {
        questionId: question.id,
        isCorrect,
        isClose,
        attempts,
        userInput,
        timeSpentMs: Date.now() - questionStartTime,
      }
      setAnswers((prev) => [...prev, answer])
    },
    [questionStartTime],
  )

  const submitMcqAnswer = useCallback(
    (selectedStructureNumber: number) => {
      const question = questions[currentIndex]
      if (!question) return

      const newAttempts = attemptCount + 1
      const isCorrect =
        selectedStructureNumber === question.targetStructure.structure_number

      recordAnswer(question, isCorrect, false, String(selectedStructureNumber), newAttempts)
      setLastFeedback({
        isCorrect,
        isClose: false,
        correctAnswer: question.targetStructure.name_pl,
        correctedTypo: false,
      })
      setPhase('feedback')
    },
    [questions, currentIndex, attemptCount, recordAnswer],
  )

  const submitTextAnswer = useCallback(
    (input: string) => {
      const question = questions[currentIndex]
      if (!question) return

      const result: FuzzyMatchResult = fuzzyMatchStructure(
        input,
        question.targetStructure,
      )
      const newAttempts = attemptCount + 1
      setAttemptCount(newAttempts)

      if (result.isCorrect) {
        recordAnswer(question, true, false, input, newAttempts)
        setLastFeedback({
          isCorrect: true,
          isClose: false,
          correctAnswer: question.targetStructure.name_pl,
          correctedTypo: result.correctedTypo,
        })
        setPhase('feedback')
        return
      }

      if (result.isClose && attemptsLeft > 1) {
        setAttemptsLeft((prev) => prev - 1)
        setLastFeedback({
          isCorrect: false,
          isClose: true,
          correctAnswer: question.targetStructure.name_pl,
          correctedTypo: false,
        })
        return
      }

      recordAnswer(question, false, result.isClose, input, newAttempts)
      setLastFeedback({
        isCorrect: false,
        isClose: false,
        correctAnswer: question.targetStructure.name_pl,
        correctedTypo: false,
      })
      setPhase('feedback')
    },
    [questions, currentIndex, attemptCount, attemptsLeft, recordAnswer],
  )

  const nextQuestion = useCallback(() => {
    const nextIdx = currentIndex + 1
    if (nextIdx >= questions.length) {
      setPhase('summary')
    } else {
      setCurrentIndex(nextIdx)
      setPhase('question')
      setQuestionStartTime(Date.now())
      setLastFeedback(null)
      setAttemptsLeft(INITIAL_ATTEMPTS)
      setAttemptCount(0)
    }
  }, [currentIndex, questions.length])

  return {
    questions,
    currentIndex,
    answers,
    phase,
    attemptsLeft,
    lastFeedback,
    config,
    initQuiz,
    submitMcqAnswer,
    submitTextAnswer,
    nextQuestion,
    getCurrentQuestion,
    getCorrectCount,
  }
}
