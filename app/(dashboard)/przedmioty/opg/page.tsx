import { loadOPGAtlas, loadOPGStructures } from '@/features/osce/server/loadOPGData'
import OPGPageClient from './OPGPageClient'

export default async function OPGPage() {
  const [atlas, structures] = await Promise.all([
    loadOPGAtlas('opg_standard_01'),
    loadOPGStructures('opg_standard_01'),
  ])

  if (!atlas) {
    return <div>Atlas OPG nie znaleziony.</div>
  }

  return <OPGPageClient atlas={atlas} structures={structures} />
}
