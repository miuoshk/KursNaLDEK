'use client'

interface OPGQuizProgressProps {
  currentIndex: number
  totalQuestions: number
  correctCount: number
}

export default function OPGQuizProgress({
  currentIndex,
  totalQuestions,
  correctCount,
}: OPGQuizProgressProps) {
  const progressPct =
    totalQuestions > 0 ? (currentIndex / totalQuestions) * 100 : 0

  return (
    <div style={{ marginBottom: 16 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8,
          fontSize: 14,
        }}
      >
        <span>
          {currentIndex + 1}/{totalQuestions}
        </span>
        <span style={{ color: correctCount > 0 ? '#4ade80' : 'inherit' }}>
          {correctCount} poprawnych
        </span>
      </div>

      <div
        style={{
          height: 4,
          borderRadius: 2,
          background: 'rgba(201, 168, 76, 0.15)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${progressPct}%`,
            background: '#C9A84C',
            borderRadius: 2,
            transition: 'width 0.3s ease',
          }}
        />
      </div>
    </div>
  )
}
