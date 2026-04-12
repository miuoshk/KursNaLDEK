'use client'

import { useState } from 'react'
import type {
  OPGQuizConfig,
  OPGQuizMode,
  OPGQuizDirection,
} from '../../lib/opg/types'

interface OPGConfigScreenProps {
  onStart: (config: OPGQuizConfig) => void
}

const PRESET_COUNTS = [10, 20, 30] as const

const sectionLabelStyle: React.CSSProperties = {
  fontSize: 14,
  textTransform: 'uppercase',
  letterSpacing: 1,
  color: 'rgba(201, 168, 76, 0.6)',
  marginBottom: 10,
}

const activeStyle: React.CSSProperties = {
  border: '1px solid #C9A84C',
  background: 'rgba(201, 168, 76, 0.1)',
}

const inactiveStyle: React.CSSProperties = {
  border: '1px solid rgba(54, 115, 104, 0.2)',
  background: 'transparent',
}

function chipStyle(isActive: boolean): React.CSSProperties {
  return {
    ...(isActive ? activeStyle : inactiveStyle),
    padding: '10px 16px',
    borderRadius: 8,
    color: 'inherit',
    fontSize: 14,
    fontWeight: isActive ? 600 : 400,
    cursor: 'pointer',
    flex: 1,
    textAlign: 'center',
  }
}

export default function OPGConfigScreen({ onStart }: OPGConfigScreenProps) {
  const [selectedMode, setSelectedMode] = useState<OPGQuizMode>('mcq')
  const [selectedDirection, setSelectedDirection] =
    useState<OPGQuizDirection>('number_to_name')
  const [selectedCount, setSelectedCount] = useState(10)
  const [isCustomCount, setIsCustomCount] = useState(false)

  function handlePresetCount(n: number) {
    setIsCustomCount(false)
    setSelectedCount(n)
  }

  function handleCustomToggle() {
    setIsCustomCount(true)
  }

  function handleStart() {
    onStart({
      mode: selectedMode,
      direction: selectedDirection,
      count: Math.max(1, Math.min(30, selectedCount)),
      atlasId: 'opg_standard_01',
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Tryb odpowiedzi */}
      <section>
        <p style={sectionLabelStyle}>Tryb odpowiedzi</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={() => setSelectedMode('mcq')}
            style={chipStyle(selectedMode === 'mcq')}
          >
            Test (a/b/c/d)
          </button>
          <button
            type="button"
            onClick={() => setSelectedMode('text_input')}
            style={chipStyle(selectedMode === 'text_input')}
          >
            Wpisywanie
          </button>
        </div>
      </section>

      {/* Kierunek pytania */}
      <section>
        <p style={sectionLabelStyle}>Kierunek pytania</p>
        <div style={{ display: 'flex', gap: 8 }}>
          {(
            [
              ['number_to_name', 'Numerki \u2192 Nazwy'],
              ['name_to_number', 'Nazwy \u2192 Numerki'],
              ['mix', 'Mix'],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setSelectedDirection(value)}
              style={chipStyle(selectedDirection === value)}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      {/* Ilość pytań */}
      <section>
        <p style={sectionLabelStyle}>Ilość pytań</p>
        <div style={{ display: 'flex', gap: 8 }}>
          {PRESET_COUNTS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => handlePresetCount(n)}
              style={chipStyle(!isCustomCount && selectedCount === n)}
            >
              {n}
            </button>
          ))}
          <button
            type="button"
            onClick={handleCustomToggle}
            style={chipStyle(isCustomCount)}
          >
            Własne
          </button>
        </div>

        {isCustomCount && (
          <input
            type="number"
            min={1}
            max={30}
            value={selectedCount}
            onChange={(e) => setSelectedCount(Number(e.target.value) || 1)}
            style={{
              marginTop: 8,
              width: '100%',
              padding: 10,
              borderRadius: 8,
              border: '1px solid rgba(201, 168, 76, 0.3)',
              background: 'rgba(0, 42, 39, 0.3)',
              color: 'inherit',
              fontSize: 14,
              boxSizing: 'border-box',
              outline: 'none',
            }}
          />
        )}
      </section>

      {/* START */}
      <button
        type="button"
        onClick={handleStart}
        style={{
          width: '100%',
          padding: 16,
          borderRadius: 12,
          border: 'none',
          background: '#C9A84C',
          color: '#002A27',
          fontSize: 16,
          fontWeight: 700,
          cursor: 'pointer',
          letterSpacing: 0.5,
        }}
      >
        Rozpocznij quiz
      </button>
    </div>
  )
}
