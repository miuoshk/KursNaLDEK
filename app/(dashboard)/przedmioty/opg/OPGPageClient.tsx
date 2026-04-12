'use client'

import { useState } from 'react'
import type {
  OPGQuizConfig,
  OPGAtlas,
  OPGStructure,
} from '@/features/osce/lib/opg/types'
import OPGConfigScreen from '@/features/osce/components/opg/OPGConfigScreen'
import OPGQuizView from '@/features/osce/components/opg/OPGQuizView'

interface OPGPageClientProps {
  atlas: OPGAtlas
  structures: OPGStructure[]
}

export default function OPGPageClient({
  atlas,
  structures,
}: OPGPageClientProps) {
  const [config, setConfig] = useState<OPGQuizConfig | null>(null)

  if (config === null) {
    return <OPGConfigScreen onStart={(c) => setConfig(c)} />
  }

  return (
    <OPGQuizView
      atlas={atlas}
      structures={structures}
      initialConfig={config}
      onBack={() => setConfig(null)}
    />
  )
}
