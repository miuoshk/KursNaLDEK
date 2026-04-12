'use client'

import { motion } from 'framer-motion'
import type { OPGStructure } from '../../lib/opg/types'

interface OPGImageProps {
  imageUrl: string
  structures: OPGStructure[]
  activeStructureNumber: number | null
  showNumbers: boolean
}

export default function OPGImage({
  imageUrl,
  structures,
  activeStructureNumber,
  showNumbers,
}: OPGImageProps) {
  return (
    <div className="relative w-full">
      <img
        src={imageUrl}
        alt="Zdjecie pantomograficzne"
        className="block w-full rounded-lg"
        draggable={false}
      />

      {showNumbers &&
        structures.map((s) => {
          const isActive = s.structure_number === activeStructureNumber

          if (isActive) {
            return (
              <motion.div
                key={s.id}
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                style={{
                  position: 'absolute',
                  left: `${s.pos_x_pct}%`,
                  top: `${s.pos_y_pct}%`,
                  transform: 'translate(-50%, -50%)',
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: 'rgba(0, 42, 39, 0.9)',
                  border: '2px solid #C9A84C',
                  color: '#C9A84C',
                  fontSize: 12,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 10,
                  pointerEvents: 'none',
                }}
              >
                {s.structure_number}
              </motion.div>
            )
          }

          return (
            <div
              key={s.id}
              style={{
                position: 'absolute',
                left: `${s.pos_x_pct}%`,
                top: `${s.pos_y_pct}%`,
                transform: 'translate(-50%, -50%)',
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: 'rgba(0, 42, 39, 0.6)',
                border: '1px solid rgba(201, 168, 76, 0.3)',
                color: 'rgba(201, 168, 76, 0.5)',
                fontSize: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1,
                pointerEvents: 'none',
              }}
            >
              {s.structure_number}
            </div>
          )
        })}
    </div>
  )
}
