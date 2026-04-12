'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import type { OPGQuestion, OPGStructure } from '../../lib/opg/types'

interface OPGMcqPanelProps {
  question: OPGQuestion
  onAnswer: (selectedNumber: number) => void
  feedback: { isCorrect: boolean; correctAnswer: string } | null
  disabled: boolean
}

function seededShuffle<T>(arr: T[], seed: string): T[] {
  const copy = [...arr]
  let h = 0
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0
  }
  for (let i = copy.length - 1; i > 0; i--) {
    h = (Math.imul(h, 1664525) + 1013904223) | 0
    const j = ((h >>> 0) % (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export default function OPGMcqPanel({
  question,
  onAnswer,
  feedback,
  disabled,
}: OPGMcqPanelProps) {
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null)

  const options = useMemo<OPGStructure[]>(
    () =>
      seededShuffle(
        [question.targetStructure, ...(question.distractors ?? [])],
        question.id,
      ),
    [question.id, question.targetStructure, question.distractors],
  )

  const heading =
    question.direction === 'number_to_name'
      ? `Struktura oznaczona numerem ${question.targetStructure.structure_number} to:`
      : `Wskaż numer struktury: ${question.targetStructure.name_pl}`

  function handleClick(option: OPGStructure) {
    if (disabled) return
    setSelectedNumber(option.structure_number)
    onAnswer(option.structure_number)
  }

  function getButtonStyle(option: OPGStructure): React.CSSProperties {
    if (feedback) {
      const isTarget =
        option.structure_number === question.targetStructure.structure_number
      const isSelected = option.structure_number === selectedNumber

      if (isTarget) {
        return {
          background: '#1a3a2a',
          borderColor: '#367368',
        }
      }
      if (isSelected && !feedback.isCorrect) {
        return {
          background: '#3a1a1a',
          borderColor: '#c94c4c',
        }
      }
    }
    return {}
  }

  return (
    <div>
      <p
        style={{
          marginBottom: 16,
          fontWeight: 600,
          fontSize: 15,
        }}
      >
        {heading}
      </p>

      {options.map((option, index) => (
        <motion.button
          key={option.id}
          type="button"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: index * 0.05, duration: 0.2 }}
          disabled={disabled}
          onClick={() => handleClick(option)}
          style={{
            width: '100%',
            padding: '12px 16px',
            background: 'rgba(54, 115, 104, 0.08)',
            border: '1px solid rgba(54, 115, 104, 0.2)',
            borderRadius: 8,
            color: 'inherit',
            textAlign: 'left',
            cursor: disabled ? 'default' : 'pointer',
            marginBottom: 8,
            fontSize: 14,
            ...getButtonStyle(option),
          }}
          whileHover={
            disabled ? undefined : { background: 'rgba(54, 115, 104, 0.15)' }
          }
        >
          {question.direction === 'number_to_name'
            ? option.name_pl
            : option.structure_number}
        </motion.button>
      ))}
    </div>
  )
}
